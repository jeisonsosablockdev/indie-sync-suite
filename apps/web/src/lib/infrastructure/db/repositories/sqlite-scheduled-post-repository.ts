/**
 * @file sqlite-scheduled-post-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for multichannel scheduled posts, media handshake tracking,
 *              and Postiz sync states. Pure functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';

export type PostStatus = 'DRAFT' | 'QUEUED' | 'PUBLISHED' | 'FAILED';

export interface ScheduledPostRecord {
  id: string;
  releaseId: string;
  assetId?: string | null;
  platform: string;
  postText: string;
  scheduledTime: string;
  mediaUrl?: string | null;
  mediaHash?: string | null;
  postizPostId?: string | null;
  status: PostStatus;
  errorMessage?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateScheduledPostInput {
  id: string;
  releaseId: string;
  assetId?: string | null;
  platform: string;
  postText: string;
  scheduledTime: string;
  mediaUrl?: string | null;
  mediaHash?: string | null;
  postizPostId?: string | null;
  status?: PostStatus;
  errorMessage?: string | null;
}

export interface UpdateScheduledPostStatusInput {
  status: PostStatus;
  postizPostId?: string | null;
  errorMessage?: string | null;
}

export interface ScheduledPostRepository {
  createScheduledPost: (input: CreateScheduledPostInput) => Promise<ScheduledPostRecord>;
  getScheduledPostById: (id: string) => Promise<ScheduledPostRecord | null>;
  listScheduledPostsByReleaseId: (releaseId: string) => Promise<ScheduledPostRecord[]>;
  updateScheduledPostStatus: (id: string, updates: UpdateScheduledPostStatusInput) => Promise<ScheduledPostRecord>;
  reschedulePost: (id: string, newScheduledTime: string) => Promise<ScheduledPostRecord>;
  deleteScheduledPost: (id: string) => Promise<boolean>;
}

interface SqlitePostRow {
  id: string;
  release_id: string;
  asset_id: string | null;
  platform: string;
  post_text: string;
  scheduled_time: string;
  media_url: string | null;
  media_hash: string | null;
  postiz_post_id: string | null;
  status: PostStatus;
  error_message: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToRecord(row: SqlitePostRow): ScheduledPostRecord {
  return {
    id: row.id,
    releaseId: row.release_id,
    assetId: row.asset_id,
    platform: row.platform,
    postText: row.post_text,
    scheduledTime: row.scheduled_time,
    mediaUrl: row.media_url,
    mediaHash: row.media_hash,
    postizPostId: row.postiz_post_id,
    status: row.status,
    errorMessage: row.error_message,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Functional factory instantiating the SQLite Scheduled Post Repository.
 *
 * @param db - Native DatabaseSync instance
 * @returns Fully typed ScheduledPostRepository implementation
 */
export function createScheduledPostRepository(db: DatabaseSync): ScheduledPostRepository {
  return {
    createScheduledPost: async (input: CreateScheduledPostInput): Promise<ScheduledPostRecord> => {
      // Step 1: Insert post record
      const stmt = db.prepare(`
        INSERT INTO scheduled_posts (
          id, release_id, asset_id, platform, post_text,
          scheduled_time, media_url, media_hash, postiz_post_id,
          status, error_message, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, ?, datetime('now'), datetime('now')
        )
      `);

      stmt.run(
        input.id,
        input.releaseId,
        input.assetId ?? null,
        input.platform,
        input.postText,
        input.scheduledTime,
        input.mediaUrl ?? null,
        input.mediaHash ?? null,
        input.postizPostId ?? null,
        input.status ?? 'DRAFT',
        input.errorMessage ?? null
      );

      // Step 2: Fetch and return created record
      const selectStmt = db.prepare(`
        SELECT id, release_id, asset_id, platform, post_text,
               scheduled_time, media_url, media_hash, postiz_post_id,
               status, error_message, created_at, updated_at
        FROM scheduled_posts
        WHERE id = ?
      `);
      const row = selectStmt.get(input.id) as unknown as SqlitePostRow | undefined;
      if (!row) {
        throw new Error(`Failed to create scheduled post with id: ${input.id}`);
      }
      return mapRowToRecord(row);
    },

    getScheduledPostById: async (id: string): Promise<ScheduledPostRecord | null> => {
      // Step 1: Query post by id
      const stmt = db.prepare(`
        SELECT id, release_id, asset_id, platform, post_text,
               scheduled_time, media_url, media_hash, postiz_post_id,
               status, error_message, created_at, updated_at
        FROM scheduled_posts
        WHERE id = ?
      `);
      const row = stmt.get(id) as unknown as SqlitePostRow | undefined;
      if (!row) return null;
      return mapRowToRecord(row);
    },

    listScheduledPostsByReleaseId: async (releaseId: string): Promise<ScheduledPostRecord[]> => {
      // Step 1: Query posts for release ordered by time
      const stmt = db.prepare(`
        SELECT id, release_id, asset_id, platform, post_text,
               scheduled_time, media_url, media_hash, postiz_post_id,
               status, error_message, created_at, updated_at
        FROM scheduled_posts
        WHERE release_id = ?
        ORDER BY scheduled_time ASC, created_at DESC
      `);
      const rows = stmt.all(releaseId) as unknown as SqlitePostRow[];
      return rows.map(mapRowToRecord);
    },

    updateScheduledPostStatus: async (
      id: string,
      updates: UpdateScheduledPostStatusInput
    ): Promise<ScheduledPostRecord> => {
      // Step 1: Verify existence
      const checkStmt = db.prepare(`SELECT id FROM scheduled_posts WHERE id = ?`);
      const existing = checkStmt.get(id);
      if (!existing) {
        throw new Error(`Scheduled post with id ${id} not found`);
      }

      // Step 2: Update status and Postiz metadata
      const stmt = db.prepare(`
        UPDATE scheduled_posts
        SET status = ?,
            postiz_post_id = COALESCE(?, postiz_post_id),
            error_message = COALESCE(?, error_message),
            updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(updates.status, updates.postizPostId ?? null, updates.errorMessage ?? null, id);

      // Step 3: Fetch updated record
      const selectStmt = db.prepare(`
        SELECT id, release_id, asset_id, platform, post_text,
               scheduled_time, media_url, media_hash, postiz_post_id,
               status, error_message, created_at, updated_at
        FROM scheduled_posts
        WHERE id = ?
      `);
      const row = selectStmt.get(id) as unknown as SqlitePostRow;
      return mapRowToRecord(row);
    },

    reschedulePost: async (id: string, newScheduledTime: string): Promise<ScheduledPostRecord> => {
      // Step 1: Verify existence
      const checkStmt = db.prepare(`SELECT id FROM scheduled_posts WHERE id = ?`);
      const existing = checkStmt.get(id);
      if (!existing) {
        throw new Error(`Scheduled post with id ${id} not found`);
      }

      // Step 2: Update scheduled time
      const stmt = db.prepare(`
        UPDATE scheduled_posts
        SET scheduled_time = ?, updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(newScheduledTime, id);

      // Step 3: Fetch updated record
      const selectStmt = db.prepare(`
        SELECT id, release_id, asset_id, platform, post_text,
               scheduled_time, media_url, media_hash, postiz_post_id,
               status, error_message, created_at, updated_at
        FROM scheduled_posts
        WHERE id = ?
      `);
      const row = selectStmt.get(id) as unknown as SqlitePostRow;
      return mapRowToRecord(row);
    },

    deleteScheduledPost: async (id: string): Promise<boolean> => {
      // Step 1: Execute deletion
      const stmt = db.prepare(`DELETE FROM scheduled_posts WHERE id = ?`);
      const result = stmt.run(id);
      return Number(result.changes) > 0;
    },
  };
}
