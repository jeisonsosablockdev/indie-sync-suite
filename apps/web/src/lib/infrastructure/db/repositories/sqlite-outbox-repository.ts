/**
 * @file apps/web/src/lib/infrastructure/db/repositories/sqlite-outbox-repository.ts
 * @layer Infrastructure (Layer 4)
 * @description Repository implementation for the Outbox Pattern persistence in SQLite.
 *
 * Architectural Invariant:
 * Implements persistent outbox queue operations using node:sqlite prepared statements.
 */

import { DatabaseSync } from "node:sqlite";
import crypto from "node:crypto";
import {
  EnqueueOutboxInput,
  OutboxEvent,
  OutboxEventSchema,
} from "@/lib/pipelines/outbox/outbox-event";

export class SqliteOutboxRepository {
  private readonly db: DatabaseSync;

  /**
   * Initializes outbox repository with an active database connection.
   * @param db - DatabaseSync connection instance
   */
  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /**
   * Enqueues a new synchronization event into the cloud_sync_queue.
   * @param input - Event creation payload
   * @returns Newly created OutboxEvent
   */
  public enqueue(input: EnqueueOutboxInput): OutboxEvent {
    // Step 1: Generate UUID and serialize payload
    const id = input.id ?? crypto.randomUUID();
    const payloadStr = JSON.stringify(input.payload);
    const now = new Date().toISOString();

    // Step 2: Insert into SQLite
    const statement = this.db.prepare(`
      INSERT INTO cloud_sync_queue (
        id, aggregate_type, aggregate_id, action, payload, status, retry_count, created_at
      ) VALUES (?, ?, ?, ?, ?, 'PENDING', 0, ?)
    `);

    statement.run(id, input.aggregateType, input.aggregateId, input.action, payloadStr, now);

    // Step 3: Return validated domain entity
    return OutboxEventSchema.parse({
      id,
      aggregateType: input.aggregateType,
      aggregateId: input.aggregateId,
      action: input.action,
      payload: payloadStr,
      status: "PENDING",
      retryCount: 0,
      createdAt: now,
    });
  }

  /**
   * Retrieves pending outbox events ordered by creation timestamp.
   * @param limit - Maximum number of events to fetch
   * @returns Array of pending OutboxEvents
   */
  public getPendingEvents(limit = 20): OutboxEvent[] {
    const statement = this.db.prepare(`
      SELECT id, aggregate_type as aggregateType, aggregate_id as aggregateId, action,
             payload, status, retry_count as retryCount, error_message as errorMessage,
             created_at as createdAt, synced_at as syncedAt
      FROM cloud_sync_queue
      WHERE status = 'PENDING'
      ORDER BY created_at ASC
      LIMIT ?
    `);

    const rows = statement.all(limit) as Record<string, unknown>[];
    return rows.map((row) => OutboxEventSchema.parse(row));
  }

  /**
   * Marks an outbox event as successfully synchronized.
   * @param id - Event ID
   */
  public markAsSynced(id: string): void {
    const now = new Date().toISOString();
    const statement = this.db.prepare(`
      UPDATE cloud_sync_queue
      SET status = 'SYNCED', synced_at = ?
      WHERE id = ?
    `);
    statement.run(now, id);
  }

  /**
   * Marks an outbox event as failed and increments retry count.
   * @param id - Event ID
   * @param errorMessage - Error description
   */
  public markAsFailed(id: string, errorMessage: string): void {
    const statement = this.db.prepare(`
      UPDATE cloud_sync_queue
      SET status = 'FAILED', retry_count = retry_count + 1, error_message = ?
      WHERE id = ?
    `);
    statement.run(errorMessage, id);
  }
}
