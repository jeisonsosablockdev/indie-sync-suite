/**
 * @file sqlite-deliverable-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for Task Deliverables and chronological feedback audit history.
 *              Strict functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';
import { DeliverableStatus } from '../../../pipelines/planner/deliverable-state-machine';

export interface TaskDeliverable {
  id: string;
  taskId: string;
  title: string;
  assetUrl: string;
  status: DeliverableStatus;
  rejectionReason?: string | null;
  reviewedAt?: string | null;
  reviewedBy?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

export interface DeliverableFeedback {
  id: string;
  deliverableId: string;
  authorRole: 'LABEL_MANAGER' | 'ARTIST';
  comment: string;
  createdAt: string;
}

export interface DeliverableRepository {
  findDeliverablesByTaskId: (taskId: string) => Promise<TaskDeliverable[]>;
  findDeliverableById: (id: string) => Promise<TaskDeliverable | null>;
  createDeliverable: (
    deliverable: Omit<TaskDeliverable, 'createdAt' | 'updatedAt'>
  ) => Promise<TaskDeliverable>;
  updateDeliverableStatus: (
    id: string,
    status: DeliverableStatus,
    rejectionReason?: string | null,
    reviewedBy?: string | null
  ) => Promise<TaskDeliverable>;
  addFeedback: (
    deliverableId: string,
    authorRole: 'LABEL_MANAGER' | 'ARTIST',
    comment: string
  ) => Promise<DeliverableFeedback>;
  findFeedbackHistory: (deliverableId: string) => Promise<DeliverableFeedback[]>;
}

export function createDeliverableRepository(db: DatabaseSync): DeliverableRepository {
  return {
    findDeliverablesByTaskId: async (taskId: string): Promise<TaskDeliverable[]> => {
      // Step 1: Query deliverables for task
      const stmt = db.prepare(`
        SELECT id, task_id as taskId, title, asset_url as assetUrl,
               status, rejection_reason as rejectionReason,
               reviewed_at as reviewedAt, reviewed_by as reviewedBy,
               created_at as createdAt, updated_at as updatedAt
        FROM task_deliverables
        WHERE task_id = ?
        ORDER BY created_at ASC
      `);
      return stmt.all(taskId) as any as TaskDeliverable[];
    },

    findDeliverableById: async (id: string): Promise<TaskDeliverable | null> => {
      const stmt = db.prepare(`
        SELECT id, task_id as taskId, title, asset_url as assetUrl,
               status, rejection_reason as rejectionReason,
               reviewed_at as reviewedAt, reviewed_by as reviewedBy,
               created_at as createdAt, updated_at as updatedAt
        FROM task_deliverables
        WHERE id = ?
      `);
      const row = stmt.get(id) as any;
      if (!row) return null;
      return row as TaskDeliverable;
    },

    createDeliverable: async (deliverable): Promise<TaskDeliverable> => {
      // Step 1: Insert deliverable record
      const stmt = db.prepare(`
        INSERT INTO task_deliverables (
          id, task_id, title, asset_url, status, rejection_reason,
          reviewed_at, reviewed_by, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?,
          ?, ?, datetime('now'), datetime('now')
        )
      `);
      stmt.run(
        deliverable.id,
        deliverable.taskId,
        deliverable.title,
        deliverable.assetUrl,
        deliverable.status,
        deliverable.rejectionReason ?? null,
        deliverable.reviewedAt ?? null,
        deliverable.reviewedBy ?? null
      );

      return (await createDeliverableRepository(db).findDeliverableById(deliverable.id))!;
    },

    updateDeliverableStatus: async (
      id: string,
      status: DeliverableStatus,
      rejectionReason?: string | null,
      reviewedBy?: string | null
    ): Promise<TaskDeliverable> => {
      // Step 1: Update status with timestamp
      const reviewedAt = (status === 'APPROVED' || status === 'REJECTED') ? new Date().toISOString() : null;
      const stmt = db.prepare(`
        UPDATE task_deliverables
        SET status = ?,
            rejection_reason = ?,
            reviewed_at = ?,
            reviewed_by = ?,
            updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(status, rejectionReason ?? null, reviewedAt, reviewedBy ?? null, id);

      return (await createDeliverableRepository(db).findDeliverableById(id))!;
    },

    addFeedback: async (
      deliverableId: string,
      authorRole: 'LABEL_MANAGER' | 'ARTIST',
      comment: string
    ): Promise<DeliverableFeedback> => {
      const feedbackId = crypto.randomUUID();
      // Step 1: Insert feedback comment
      const stmt = db.prepare(`
        INSERT INTO deliverable_feedbacks (id, deliverable_id, author_role, comment, created_at)
        VALUES (?, ?, ?, ?, datetime('now'))
      `);
      stmt.run(feedbackId, deliverableId, authorRole, comment);

      // Step 2: Return inserted feedback
      const getStmt = db.prepare(`
        SELECT id, deliverable_id as deliverableId, author_role as authorRole,
               comment, created_at as createdAt
        FROM deliverable_feedbacks
        WHERE id = ?
      `);
      return getStmt.get(feedbackId) as any as DeliverableFeedback;
    },

    findFeedbackHistory: async (deliverableId: string): Promise<DeliverableFeedback[]> => {
      // Step 1: Retrieve audit trail ordered chronologically
      const stmt = db.prepare(`
        SELECT id, deliverable_id as deliverableId, author_role as authorRole,
               comment, created_at as createdAt
        FROM deliverable_feedbacks
        WHERE deliverable_id = ?
        ORDER BY created_at ASC
      `);
      return stmt.all(deliverableId) as any as DeliverableFeedback[];
    },
  };
}
