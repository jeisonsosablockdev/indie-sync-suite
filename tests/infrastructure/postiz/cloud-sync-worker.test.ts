/**
 * @file cloud-sync-worker.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createCloudSyncWorker (HU-4.5 / SPEC-04-05).
 *              Verifies outbox batch processing, exponential retry transitions, dead-letter state,
 *              and manual force-retry resets.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createCloudSyncWorker,
  CloudSyncWorker,
} from '../../../apps/web/src/lib/infrastructure/postiz/cloud-sync-worker';
import { createPostizApiClient } from '../../../apps/web/src/lib/infrastructure/postiz/postiz-api-client';

describe('SQLite CloudSyncWorker (HU-4.5 / SPEC-04-05)', () => {
  let db: DatabaseSync;
  let worker: CloudSyncWorker;

  const item1 = '11111111-1111-4111-8111-111111111111';
  const item2 = '22222222-2222-4222-8222-222222222222';
  const item3 = '33333333-3333-4333-8333-333333333333';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    const apiClient = createPostizApiClient();
    worker = createCloudSyncWorker(db, apiClient);
  });

  test('processes pending outbox queue items and updates status to SYNCED', async () => {
    // Insert 2 pending items into cloud_sync_queue
    const insertStmt = db.prepare(`
      INSERT INTO cloud_sync_queue (id, aggregate_type, aggregate_id, action, payload, status, retry_count)
      VALUES (?, ?, ?, ?, ?, ?, ?)
    `);

    insertStmt.run(item1, 'scheduled_post', 'post-101', 'CREATE', JSON.stringify({ title: 'Post 1' }), 'PENDING', 0);
    insertStmt.run(item2, 'scheduled_post', 'post-102', 'UPDATE', JSON.stringify({ title: 'Post 2' }), 'PENDING', 0);

    const initialPending = await worker.getPendingItems();
    expect(initialPending).toHaveLength(2);

    const result = await worker.processPendingQueue();
    expect(result.processedCount).toBe(2);
    expect(result.syncedCount).toBe(2);
    expect(result.failedCount).toBe(0);

    // Verify all marked as SYNCED
    const remainingPending = await worker.getPendingItems();
    expect(remainingPending).toHaveLength(0);

    const syncedRows = db.prepare('SELECT status, synced_at FROM cloud_sync_queue WHERE id = ?').get(item1) as {
      status: string;
      synced_at: string;
    };
    expect(syncedRows.status).toBe('SYNCED');
    expect(syncedRows.synced_at).toBeDefined();
  });

  test('handles dead-letter items (retry_count >= 3) and allows manual forceRetryDeadLetter', async () => {
    const insertStmt = db.prepare(`
      INSERT INTO cloud_sync_queue (id, aggregate_type, aggregate_id, action, payload, status, retry_count, error_message)
      VALUES (?, ?, ?, ?, ?, ?, ?, ?)
    `);

    // Insert dead-letter item with 3 retries
    insertStmt.run(
      item3,
      'ad_campaign',
      'campaign-99',
      'CREATE',
      JSON.stringify({ budget: 50 }),
      'FAILED',
      3,
      'Rate limit exceeded by ad network'
    );

    // Because retry_count = 3 (MAX_RETRIES), processPendingQueue will NOT pick it up
    const processResult = await worker.processPendingQueue();
    expect(processResult.processedCount).toBe(0);

    // Call forceRetryDeadLetter to reset
    const retrySuccess = await worker.forceRetryDeadLetter(item3);
    expect(retrySuccess).toBe(true);

    // Verify status was reset to PENDING and retry_count = 0
    const resetRow = db.prepare('SELECT status, retry_count, error_message FROM cloud_sync_queue WHERE id = ?').get(item3) as {
      status: string;
      retry_count: number;
      error_message: string | null;
    };
    expect(resetRow.status).toBe('PENDING');
    expect(resetRow.retry_count).toBe(0);
    expect(resetRow.error_message).toBeNull();

    // Now processPendingQueue can successfully sync it
    const reprocessResult = await worker.processPendingQueue();
    expect(reprocessResult.processedCount).toBe(1);
    expect(reprocessResult.syncedCount).toBe(1);
  });
});
