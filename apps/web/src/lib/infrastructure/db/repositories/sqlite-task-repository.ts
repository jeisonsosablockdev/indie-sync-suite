/**
 * @file sqlite-task-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for Release Tasks, Phases, DAG Dependencies, and Undo Snapshots.
 *              Strict functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';
import { ReleaseTask, ReleasePhase } from '../../../pipelines/planner/planner-schemas';
import { assertNoCycle } from '../../../pipelines/planner/cascade-calculator';

export interface TaskDependency {
  taskId: string;
  prerequisiteTaskId: string;
}

export interface TaskRepository {
  findPhasesByReleaseId: (releaseId: string) => Promise<ReleasePhase[]>;
  createPhase: (phase: ReleasePhase) => Promise<ReleasePhase>;
  findTasksByReleaseId: (releaseId: string) => Promise<ReleaseTask[]>;
  findTaskById: (taskId: string) => Promise<ReleaseTask | null>;
  createTask: (task: Omit<ReleaseTask, 'createdAt' | 'updatedAt'>) => Promise<ReleaseTask>;
  updateTask: (taskId: string, patch: Partial<ReleaseTask>) => Promise<ReleaseTask>;
  deleteTask: (taskId: string) => Promise<void>;
  findDependenciesByReleaseId: (releaseId: string) => Promise<TaskDependency[]>;
  addDependency: (taskId: string, prerequisiteTaskId: string) => Promise<void>;
  removeDependency: (taskId: string, prerequisiteTaskId: string) => Promise<void>;
  batchUpdateDates: (updates: Array<{ taskId: string; dueDate: string; offsetDays: number }>) => Promise<void>;
  saveUndoSnapshot: (releaseId: string, snapshotJson: string) => Promise<string>;
  getLatestUndoSnapshot: (releaseId: string) => Promise<{ id: string; snapshotJson: string } | null>;
  invalidateUndoSnapshots: (releaseId: string) => Promise<void>;
}

export function createTaskRepository(db: DatabaseSync): TaskRepository {
  return {
    findPhasesByReleaseId: async (releaseId: string): Promise<ReleasePhase[]> => {
      // Step 1: Query release phases ordered by chronological orderIndex
      const stmt = db.prepare(`
        SELECT id, release_id as releaseId, phase_type as phaseType,
               name, start_date as startDate, end_date as endDate,
               order_index as orderIndex, created_at as createdAt
        FROM release_phases
        WHERE release_id = ?
        ORDER BY order_index ASC
      `);
      return stmt.all(releaseId) as any as ReleasePhase[];
    },

    createPhase: async (phase: ReleasePhase): Promise<ReleasePhase> => {
      // Step 1: Insert phase record
      const stmt = db.prepare(`
        INSERT INTO release_phases (id, release_id, phase_type, name, start_date, end_date, order_index, created_at)
        VALUES (?, ?, ?, ?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(
        phase.id,
        phase.releaseId,
        phase.phaseType,
        phase.name,
        phase.startDate,
        phase.endDate,
        phase.orderIndex
      );
      return phase;
    },

    findTasksByReleaseId: async (releaseId: string): Promise<ReleaseTask[]> => {
      // Step 1: Query tasks for release
      const stmt = db.prepare(`
        SELECT id, release_id as releaseId, phase_id as phaseId,
               parent_task_id as parentTaskId, title, description,
               assigned_role as assignedRole, due_date as dueDate,
               offset_days as offsetDays, is_gatekeeper as isGatekeeper,
               status, order_index as orderIndex,
               created_at as createdAt, updated_at as updatedAt
        FROM release_tasks
        WHERE release_id = ?
        ORDER BY due_date ASC, order_index ASC
      `);
      const rows = stmt.all(releaseId) as any[];
      return rows.map(r => ({
        ...r,
        isGatekeeper: Boolean(r.isGatekeeper),
      }));
    },

    findTaskById: async (taskId: string): Promise<ReleaseTask | null> => {
      // Step 1: Query single task by ID
      const stmt = db.prepare(`
        SELECT id, release_id as releaseId, phase_id as phaseId,
               parent_task_id as parentTaskId, title, description,
               assigned_role as assignedRole, due_date as dueDate,
               offset_days as offsetDays, is_gatekeeper as isGatekeeper,
               status, order_index as orderIndex,
               created_at as createdAt, updated_at as updatedAt
        FROM release_tasks
        WHERE id = ?
      `);
      const row = stmt.get(taskId) as any;
      if (!row) return null;
      return {
        ...row,
        isGatekeeper: Boolean(row.isGatekeeper),
      };
    },

    createTask: async (task): Promise<ReleaseTask> => {
      // Step 1: Insert task record
      const stmt = db.prepare(`
        INSERT INTO release_tasks (
          id, release_id, phase_id, parent_task_id, title, description,
          assigned_role, due_date, offset_days, is_gatekeeper, status, order_index,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          datetime('now'), datetime('now')
        )
      `);
      stmt.run(
        task.id,
        task.releaseId,
        task.phaseId,
        task.parentTaskId ?? null,
        task.title,
        task.description ?? '',
        task.assignedRole,
        task.dueDate,
        task.offsetDays,
        task.isGatekeeper ? 1 : 0,
        task.status,
        task.orderIndex
      );

      // Step 2: Invalidate undo snapshot when new tasks are added
      const invalidateStmt = db.prepare('UPDATE schedule_undo_snapshots SET is_valid = 0 WHERE release_id = ?');
      invalidateStmt.run(task.releaseId);

      return (await createTaskRepository(db).findTaskById(task.id))!;
    },

    updateTask: async (taskId: string, patch: Partial<ReleaseTask>): Promise<ReleaseTask> => {
      // Step 1: Check existing task
      const existing = await createTaskRepository(db).findTaskById(taskId);
      if (!existing) {
        throw new Error(`Tarea no encontrada: ${taskId}`);
      }

      // Step 2: Build dynamic update statement
      const updates: string[] = ['updated_at = datetime(\'now\')'];
      const params: any[] = [];

      if (patch.title !== undefined) {
        updates.push('title = ?');
        params.push(patch.title);
      }
      if (patch.description !== undefined) {
        updates.push('description = ?');
        params.push(patch.description);
      }
      if (patch.assignedRole !== undefined) {
        updates.push('assigned_role = ?');
        params.push(patch.assignedRole);
      }
      if (patch.dueDate !== undefined) {
        updates.push('due_date = ?');
        params.push(patch.dueDate);
      }
      if (patch.offsetDays !== undefined) {
        updates.push('offset_days = ?');
        params.push(patch.offsetDays);
      }
      if (patch.isGatekeeper !== undefined) {
        updates.push('is_gatekeeper = ?');
        params.push(patch.isGatekeeper ? 1 : 0);
      }
      if (patch.status !== undefined) {
        updates.push('status = ?');
        params.push(patch.status);
      }

      params.push(taskId);

      const stmt = db.prepare(`
        UPDATE release_tasks
        SET ${updates.join(', ')}
        WHERE id = ?
      `);
      stmt.run(...params);

      return (await createTaskRepository(db).findTaskById(taskId))!;
    },

    deleteTask: async (taskId: string): Promise<void> => {
      // Step 1: Find task to know releaseId
      const task = await createTaskRepository(db).findTaskById(taskId);
      if (!task) return;

      // Step 2: Delete task (foreign keys cascade dependencies and deliverables)
      const stmt = db.prepare('DELETE FROM release_tasks WHERE id = ?');
      stmt.run(taskId);

      // Step 3: Invalidate undo snapshot
      const invalidateStmt = db.prepare('UPDATE schedule_undo_snapshots SET is_valid = 0 WHERE release_id = ?');
      invalidateStmt.run(task.releaseId);
    },

    findDependenciesByReleaseId: async (releaseId: string): Promise<TaskDependency[]> => {
      // Step 1: Join tasks and dependencies
      const stmt = db.prepare(`
        SELECT td.task_id as taskId, td.prerequisite_task_id as prerequisiteTaskId
        FROM task_dependencies td
        JOIN release_tasks t ON t.id = td.task_id
        WHERE t.release_id = ?
      `);
      return stmt.all(releaseId) as any as TaskDependency[];
    },

    addDependency: async (taskId: string, prerequisiteTaskId: string): Promise<void> => {
      // Step 1: Fetch releaseId for both tasks
      const task = await createTaskRepository(db).findTaskById(taskId);
      const prereq = await createTaskRepository(db).findTaskById(prerequisiteTaskId);
      if (!task || !prereq) {
        throw new Error('No se pueden vincular tareas inexistentes.');
      }
      if (task.releaseId !== prereq.releaseId) {
        throw new Error('Las tareas deben pertenecer al mismo release.');
      }

      // Step 2: Fetch existing dependencies and verify cycle prevention
      const currentDeps = await createTaskRepository(db).findDependenciesByReleaseId(task.releaseId);
      const proposedDeps = [...currentDeps, { taskId, prerequisiteTaskId }];

      // Step 3: Invariant check - assertNoCycle throws if cycle is detected
      assertNoCycle(proposedDeps);

      // Step 4: Insert dependency
      const stmt = db.prepare(`
        INSERT INTO task_dependencies (task_id, prerequisite_task_id, created_at)
        VALUES (?, ?, datetime('now'))
      `);
      stmt.run(taskId, prerequisiteTaskId);
    },

    removeDependency: async (taskId: string, prerequisiteTaskId: string): Promise<void> => {
      const stmt = db.prepare(`
        DELETE FROM task_dependencies
        WHERE task_id = ? AND prerequisite_task_id = ?
      `);
      stmt.run(taskId, prerequisiteTaskId);
    },

    batchUpdateDates: async (updates): Promise<void> => {
      // Step 1: Run updates in an atomic SQLite transaction via BEGIN / COMMIT
      const updateStmt = db.prepare(`
        UPDATE release_tasks
        SET due_date = ?,
            offset_days = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `);

      db.exec('BEGIN TRANSACTION');
      try {
        for (const item of updates) {
          updateStmt.run(item.dueDate, item.offsetDays, item.taskId);
        }
        db.exec('COMMIT');
      } catch (err) {
        db.exec('ROLLBACK');
        throw err;
      }
    },

    saveUndoSnapshot: async (releaseId: string, snapshotJson: string): Promise<string> => {
      const snapshotId = crypto.randomUUID();
      // Step 1: Invalidate previous snapshots for this release
      db.prepare('UPDATE schedule_undo_snapshots SET is_valid = 0 WHERE release_id = ?').run(releaseId);

      // Step 2: Insert new valid snapshot
      const stmt = db.prepare(`
        INSERT INTO schedule_undo_snapshots (id, release_id, snapshot_json, is_valid, created_at)
        VALUES (?, ?, ?, 1, datetime('now'))
      `);
      stmt.run(snapshotId, releaseId, snapshotJson);
      return snapshotId;
    },

    getLatestUndoSnapshot: async (releaseId: string): Promise<{ id: string; snapshotJson: string } | null> => {
      const stmt = db.prepare(`
        SELECT id, snapshot_json as snapshotJson
        FROM schedule_undo_snapshots
        WHERE release_id = ? AND is_valid = 1
        ORDER BY created_at DESC
        LIMIT 1
      `);
      const row = stmt.get(releaseId) as any;
      if (!row) return null;
      return { id: row.id, snapshotJson: row.snapshotJson };
    },

    invalidateUndoSnapshots: async (releaseId: string): Promise<void> => {
      const stmt = db.prepare('UPDATE schedule_undo_snapshots SET is_valid = 0 WHERE release_id = ?');
      stmt.run(releaseId);
    },
  };
}
