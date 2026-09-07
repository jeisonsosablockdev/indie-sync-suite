/**
 * @file tests/infrastructure/db/sqlite-schema.test.ts
 * @layer Infrastructure / Database (Layer 4)
 * @description Comprehensive unit & integration tests for SQLite Core Relational Schema and Outbox Queue.
 *
 * TDD Methodology: tdd-primal (F.I.R.S.T. & AAA Pattern)
 * Traceability:
 * - @spec SPEC-1.1.1: Relational DDL & Foreign Key Cascades
 * - @spec SPEC-1.1.2: SQLite Client Concurrency, Pragmas & Migrations
 * - @spec SPEC-1.2.1: Cloud Sync Outbox Queue State Machine
 * - @spec SPEC-1.2.2: Atomic Unit of Work Transactionality
 */

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import path from "node:path";
import fs from "node:fs";
import { SqliteClient } from "@/lib/infrastructure/db/sqlite-client";
import { SqliteMigrator } from "@/lib/infrastructure/db/migrator";
import { SqliteOutboxRepository } from "@/lib/infrastructure/db/repositories/sqlite-outbox-repository";
import { SqliteUnitOfWork } from "@/lib/infrastructure/db/unit-of-work";

describe("SQLite Core & Outbox Queue (SPEC-01)", () => {
  let client: SqliteClient;
  let testDbPath: string;

  beforeEach(() => {
    // Step 1: Arrange temporary isolated disk database path for testing pragmas & WAL
    const testDir = path.resolve(process.cwd(), ".data/test");
    if (!fs.existsSync(testDir)) {
      fs.mkdirSync(testDir, { recursive: true });
    }
    testDbPath = path.join(testDir, `test-${Date.now()}-${Math.random().toString(36).slice(2)}.db`);
    client = new SqliteClient({ databasePath: testDbPath });
  });

  afterEach(() => {
    // Step 2: Clean up client and temporary database file
    client.close();
    if (fs.existsSync(testDbPath)) {
      fs.rmSync(testDbPath, { force: true });
    }
    const walPath = `${testDbPath}-wal`;
    const shmPath = `${testDbPath}-shm`;
    if (fs.existsSync(walPath)) fs.rmSync(walPath, { force: true });
    if (fs.existsSync(shmPath)) fs.rmSync(shmPath, { force: true });
  });

  describe("SPEC-1.1.2: Client Configuration & Migrations", () => {
    test("@spec SPEC-1.1.2: enforces WAL journal mode, busy_timeout and foreign keys", () => {
      // Arrange
      const db = client.getDatabase();

      // Act
      const fkResult = db.prepare("PRAGMA foreign_keys;").all() as { foreign_keys: number }[];
      const busyResult = db.prepare("PRAGMA busy_timeout;").all() as { timeout: number }[];
      const journalResult = db.prepare("PRAGMA journal_mode;").all() as { journal_mode: string }[];

      // Assert
      expect(fkResult[0].foreign_keys).toBe(1);
      expect(busyResult[0].timeout).toBe(5000);
      expect(journalResult[0].journal_mode.toLowerCase()).toBe("wal");
    });

    test("@spec SPEC-1.1.2: runs migrations idempotently without errors", () => {
      // Arrange
      const db = client.getDatabase();
      const migrator = new SqliteMigrator(db);

      // Act: Run migrations first time
      const firstRunApplied = migrator.runMigrations();

      // Assert: Should have applied initial schema
      expect(firstRunApplied).toContain("001_initial_schema.sql");

      // Act: Run migrations second time (idempotency check)
      const secondRunApplied = migrator.runMigrations();

      // Assert: No new migrations should be applied
      expect(secondRunApplied.length).toBe(0);
    });
  });

  describe("SPEC-1.1.1: Relational DDL & Foreign Key Cascades", () => {
    beforeEach(() => {
      const db = client.getDatabase();
      const migrator = new SqliteMigrator(db);
      migrator.runMigrations();
    });

    test("@spec SPEC-1.1.1: fails with foreign key violation when parent label is missing", () => {
      // Arrange
      const db = client.getDatabase();
      const orphanArtistStatement = db.prepare(`
        INSERT INTO artists (id, label_id, name, created_at, updated_at)
        VALUES (?, ?, ?, datetime('now'), datetime('now'))
      `);

      // Act & Assert
      expect(() => {
        orphanArtistStatement.run("artist-1", "non-existent-label", "Solo Artist");
      }).toThrow(/foreign key/i);
    });

    test("@spec SPEC-1.1.1: cascades deletion from label down to artist, release, task and audio link", () => {
      // Arrange
      const db = client.getDatabase();

      // Step 1: Insert hierarchy: Label -> Artist -> Release -> Task & Audio Link
      db.prepare("INSERT INTO labels (id, name) VALUES (?, ?)").run("label-100", "Indie Records");
      db.prepare("INSERT INTO artists (id, label_id, name) VALUES (?, ?, ?)").run("artist-100", "label-100", "Neon Wave");
      db.prepare("INSERT INTO releases (id, artist_id, title, release_date, archetype) VALUES (?, ?, ?, ?, ?)")
        .run("release-100", "artist-100", "Midnight Drive", "2026-10-01", "single");
      db.prepare("INSERT INTO tasks (id, release_id, phase, title, due_date) VALUES (?, ?, ?, ?, ?)")
        .run("task-100", "release-100", "pre_release", "Mastering Check", "2026-09-20");
      db.prepare("INSERT INTO external_audio_links (id, release_id, provider, url) VALUES (?, ?, ?, ?)")
        .run("link-100", "release-100", "drive", "https://drive.google.com/file/d/123/view");

      // Verify records exist
      expect(db.prepare("SELECT count(*) as c FROM artists WHERE id = ?").all("artist-100")[0]).toEqual({ c: 1 });
      expect(db.prepare("SELECT count(*) as c FROM releases WHERE id = ?").all("release-100")[0]).toEqual({ c: 1 });
      expect(db.prepare("SELECT count(*) as c FROM tasks WHERE id = ?").all("task-100")[0]).toEqual({ c: 1 });
      expect(db.prepare("SELECT count(*) as c FROM external_audio_links WHERE id = ?").all("link-100")[0]).toEqual({ c: 1 });

      // Act: Delete top-level Label
      db.prepare("DELETE FROM labels WHERE id = ?").run("label-100");

      // Assert: Cascade should have wiped entire tree
      expect(db.prepare("SELECT count(*) as c FROM artists WHERE id = ?").all("artist-100")[0]).toEqual({ c: 0 });
      expect(db.prepare("SELECT count(*) as c FROM releases WHERE id = ?").all("release-100")[0]).toEqual({ c: 0 });
      expect(db.prepare("SELECT count(*) as c FROM tasks WHERE id = ?").all("task-100")[0]).toEqual({ c: 0 });
      expect(db.prepare("SELECT count(*) as c FROM external_audio_links WHERE id = ?").all("link-100")[0]).toEqual({ c: 0 });
    });
  });

  describe("SPEC-1.2.1: Outbox Queue Lifecycle", () => {
    let outboxRepo: SqliteOutboxRepository;

    beforeEach(() => {
      const db = client.getDatabase();
      new SqliteMigrator(db).runMigrations();
      outboxRepo = new SqliteOutboxRepository(db);
    });

    test("@spec SPEC-1.2.1: enqueues event with PENDING status and valid timestamp", () => {
      // Arrange & Act
      const event = outboxRepo.enqueue({
        aggregateType: "artist",
        aggregateId: "art-1",
        action: "CREATE",
        payload: { name: "Future Sound", genre: "Electronic" },
      });

      // Assert
      expect(event.id).toBeDefined();
      expect(event.status).toBe("PENDING");
      expect(event.retryCount).toBe(0);
      expect(JSON.parse(event.payload)).toEqual({ name: "Future Sound", genre: "Electronic" });

      const pending = outboxRepo.getPendingEvents();
      expect(pending.length).toBe(1);
      expect(pending[0].id).toBe(event.id);
    });

    test("@spec SPEC-1.2.1: transitions event to SYNCED with syncedAt timestamp", () => {
      // Arrange
      const event = outboxRepo.enqueue({
        aggregateType: "release",
        aggregateId: "rel-1",
        action: "UPDATE",
        payload: { title: "Updated Release" },
      });

      // Act
      outboxRepo.markAsSynced(event.id);

      // Assert: No more pending events
      const pending = outboxRepo.getPendingEvents();
      expect(pending.length).toBe(0);

      const db = client.getDatabase();
      const row = db.prepare("SELECT status, synced_at FROM cloud_sync_queue WHERE id = ?").all(event.id)[0] as {
        status: string;
        synced_at: string;
      };
      expect(row.status).toBe("SYNCED");
      expect(row.synced_at).toBeTruthy();
    });

    test("@spec SPEC-1.2.1: marks event as FAILED, records error message and increments retryCount", () => {
      // Arrange
      const event = outboxRepo.enqueue({
        aggregateType: "task",
        aggregateId: "task-1",
        action: "DELETE",
        payload: { taskId: "task-1" },
      });

      // Act
      outboxRepo.markAsFailed(event.id, "Network timeout 504 Gateway");

      // Assert
      const db = client.getDatabase();
      const row = db.prepare("SELECT status, retry_count, error_message FROM cloud_sync_queue WHERE id = ?").all(event.id)[0] as {
        status: string;
        retry_count: number;
        error_message: string;
      };
      expect(row.status).toBe("FAILED");
      expect(row.retry_count).toBe(1);
      expect(row.error_message).toBe("Network timeout 504 Gateway");
    });
  });

  describe("SPEC-1.2.2: Unit of Work Atomic Transactions", () => {
    let uow: SqliteUnitOfWork;

    beforeEach(() => {
      const db = client.getDatabase();
      new SqliteMigrator(db).runMigrations();
      uow = new SqliteUnitOfWork(db);
    });

    test("@spec SPEC-1.2.2: commits both aggregate mutation and outbox event when successful", () => {
      // Arrange
      const db = client.getDatabase();
      const outboxRepo = new SqliteOutboxRepository(db);

      // Act
      uow.executeTransaction((txDb) => {
        txDb.prepare("INSERT INTO labels (id, name) VALUES (?, ?)").run("label-200", "Atomic Records");
        outboxRepo.enqueue({
          aggregateType: "label",
          aggregateId: "label-200",
          action: "CREATE",
          payload: { id: "label-200", name: "Atomic Records" },
        });
      });

      // Assert: Both label and outbox event exist
      const labelCount = db.prepare("SELECT count(*) as c FROM labels WHERE id = ?").all("label-200")[0] as { c: number };
      const outboxCount = db.prepare("SELECT count(*) as c FROM cloud_sync_queue WHERE aggregate_id = ?").all("label-200")[0] as { c: number };
      expect(labelCount.c).toBe(1);
      expect(outboxCount.c).toBe(1);
    });

    test("@spec SPEC-1.2.2: rolls back both mutation and outbox event when an error occurs", () => {
      // Arrange
      const db = client.getDatabase();
      const outboxRepo = new SqliteOutboxRepository(db);

      // Act & Assert
      expect(() => {
        uow.executeTransaction((txDb) => {
          txDb.prepare("INSERT INTO labels (id, name) VALUES (?, ?)").run("label-fail", "Will Rollback");
          outboxRepo.enqueue({
            aggregateType: "label",
            aggregateId: "label-fail",
            action: "CREATE",
            payload: { name: "Will Rollback" },
          });
          // Deliberate error to trigger rollback
          throw new Error("Simulated Outbox Failure");
        });
      }).toThrow("Simulated Outbox Failure");

      // Assert: Neither the label nor the outbox event were persisted
      const labelCount = db.prepare("SELECT count(*) as c FROM labels WHERE id = ?").all("label-fail")[0] as { c: number };
      const outboxCount = db.prepare("SELECT count(*) as c FROM cloud_sync_queue WHERE aggregate_id = ?").all("label-fail")[0] as { c: number };
      expect(labelCount.c).toBe(0);
      expect(outboxCount.c).toBe(0);
    });
  });
});
