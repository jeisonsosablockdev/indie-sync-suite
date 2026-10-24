/**
 * @file sqlite-batch-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for Generation Batches, tracking 4-variant explorations,
 *              execution statuses, and links to release planner tasks. Pure functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';

export type BatchStatus = 'PENDING' | 'GENERATING' | 'COMPLETED' | 'FAILED';

/**
 * Relational representation of a Generation Batch.
 */
export interface GenerationBatchRecord {
  id: string;
  releaseId: string;
  promptId: string;
  taskId?: string | null;
  status: BatchStatus;
  variantCount: number;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Input DTO for creating a new generation batch.
 */
export interface CreateBatchInput {
  id: string;
  releaseId: string;
  promptId: string;
  taskId?: string | null;
  status?: BatchStatus;
  variantCount?: number;
}

/**
 * Functional repository contract for generation batch lifecycle.
 */
export interface BatchRepository {
  createBatch: (input: CreateBatchInput) => Promise<GenerationBatchRecord>;
  getBatchById: (id: string) => Promise<GenerationBatchRecord | null>;
  listBatchesByReleaseId: (releaseId: string) => Promise<GenerationBatchRecord[]>;
  updateBatchStatus: (id: string, status: BatchStatus) => Promise<GenerationBatchRecord>;
  linkBatchToTask: (id: string, taskId: string) => Promise<GenerationBatchRecord>;
  deleteBatch: (id: string) => Promise<boolean>;
}

interface SqliteBatchRow {
  id: string;
  release_id: string;
  prompt_id: string;
  task_id: string | null;
  status: BatchStatus;
  variant_count: number;
  created_at: string;
  updated_at: string;
}

function mapRowToRecord(row: SqliteBatchRow): GenerationBatchRecord {
  return {
    id: row.id,
    releaseId: row.release_id,
    promptId: row.prompt_id,
    taskId: row.task_id,
    status: row.status,
    variantCount: row.variant_count,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Functional factory instantiating the SQLite Batch Repository.
 *
 * @param db - Native DatabaseSync instance
 * @returns Fully typed BatchRepository implementation
 */
export function createBatchRepository(db: DatabaseSync): BatchRepository {
  return {
    createBatch: async (input: CreateBatchInput): Promise<GenerationBatchRecord> => {
      // Step 1: Insert batch row
      const stmt = db.prepare(`
        INSERT INTO generation_batches (
          id, release_id, prompt_id, task_id, status, variant_count,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          datetime('now'), datetime('now')
        )
      `);

      stmt.run(
        input.id,
        input.releaseId,
        input.promptId,
        input.taskId ?? null,
        input.status ?? 'PENDING',
        input.variantCount ?? 4
      );

      // Step 2: Fetch and return created record
      const selectStmt = db.prepare(`
        SELECT id, release_id, prompt_id, task_id, status, variant_count,
               created_at, updated_at
        FROM generation_batches
        WHERE id = ?
      `);
      const row = selectStmt.get(input.id) as unknown as SqliteBatchRow | undefined;
      if (!row) {
        throw new Error(`Failed to create generation batch: record not found for id ${input.id}`);
      }
      return mapRowToRecord(row);
    },

    getBatchById: async (id: string): Promise<GenerationBatchRecord | null> => {
      // Step 1: Query by id
      const stmt = db.prepare(`
        SELECT id, release_id, prompt_id, task_id, status, variant_count,
               created_at, updated_at
        FROM generation_batches
        WHERE id = ?
      `);
      const row = stmt.get(id) as unknown as SqliteBatchRow | undefined;
      if (!row) return null;
      return mapRowToRecord(row);
    },

    listBatchesByReleaseId: async (releaseId: string): Promise<GenerationBatchRecord[]> => {
      // Step 1: Query batches by releaseId ordered chronologically
      const stmt = db.prepare(`
        SELECT id, release_id, prompt_id, task_id, status, variant_count,
               created_at, updated_at
        FROM generation_batches
        WHERE release_id = ?
        ORDER BY created_at DESC
      `);
      const rows = stmt.all(releaseId) as unknown as SqliteBatchRow[];
      return rows.map(mapRowToRecord);
    },

    updateBatchStatus: async (id: string, status: BatchStatus): Promise<GenerationBatchRecord> => {
      // Step 1: Verify existence
      const checkStmt = db.prepare(`SELECT id FROM generation_batches WHERE id = ?`);
      const existing = checkStmt.get(id);
      if (!existing) {
        throw new Error(`Generation batch with id ${id} not found`);
      }

      // Step 2: Update status
      const stmt = db.prepare(`
        UPDATE generation_batches
        SET status = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(status, id);

      // Step 3: Fetch updated record
      const fetchStmt = db.prepare(`
        SELECT id, release_id, prompt_id, task_id, status, variant_count,
               created_at, updated_at
        FROM generation_batches
        WHERE id = ?
      `);
      const row = fetchStmt.get(id) as unknown as SqliteBatchRow;
      return mapRowToRecord(row);
    },

    linkBatchToTask: async (id: string, taskId: string): Promise<GenerationBatchRecord> => {
      // Step 1: Verify existence
      const checkStmt = db.prepare(`SELECT id FROM generation_batches WHERE id = ?`);
      const existing = checkStmt.get(id);
      if (!existing) {
        throw new Error(`Generation batch with id ${id} not found`);
      }

      // Step 2: Update task linkage
      const stmt = db.prepare(`
        UPDATE generation_batches
        SET task_id = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(taskId, id);

      // Step 3: Fetch updated record
      const fetchStmt = db.prepare(`
        SELECT id, release_id, prompt_id, task_id, status, variant_count,
               created_at, updated_at
        FROM generation_batches
        WHERE id = ?
      `);
      const row = fetchStmt.get(id) as unknown as SqliteBatchRow;
      return mapRowToRecord(row);
    },

    deleteBatch: async (id: string): Promise<boolean> => {
      // Step 1: Execute deletion
      const stmt = db.prepare(`DELETE FROM generation_batches WHERE id = ?`);
      const result = stmt.run(id);
      return Number(result.changes) > 0;
    },
  };
}
