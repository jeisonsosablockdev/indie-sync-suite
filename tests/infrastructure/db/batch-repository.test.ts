/**
 * @file batch-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createBatchRepository (HU-3.2 / SPEC-03-03).
 *              Verifies 4-variant batch lifecycle, status transitions, task linkage, and cascade deletion.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createBatchRepository,
  BatchRepository,
  CreateBatchInput,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-batch-repository';

describe('SQLite BatchRepository (HU-3.2 / SPEC-03-03)', () => {
  let db: DatabaseSync;
  let repo: BatchRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const artistId = '22222222-2222-4222-8222-222222222222';
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const promptId = '44444444-4444-4444-8444-444444444444';
  const batchId = '55555555-5555-4555-8555-555555555555';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createBatchRepository(db);

    // Seed parent entities: label -> artist -> release -> creative_prompt
    db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(labelId, 'Solaris Music');
    db.prepare('INSERT INTO artists (id, label_id, name) VALUES (?, ?, ?)').run(
      artistId,
      labelId,
      'Astra Wave'
    );
    db.prepare(
      'INSERT INTO releases (id, artist_id, title, release_date, archetype) VALUES (?, ?, ?, ?, ?)'
    ).run(releaseId, artistId, 'Nebula Dream', '2026-12-15', 'single');

    db.prepare(`
      INSERT INTO creative_prompts (
        id, release_id, prompt_text, platform_preset, aspect_ratio, version, subject
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      promptId,
      releaseId,
      'Neon cosmic synthesizer artwork',
      'MIDJOURNEY_V6',
      'SQUARE_1_1',
      1,
      'Synthesizer artwork'
    );
  });

  test('@spec REQ-HU-3.2-01: creates and retrieves a generation batch with 4 variants default', async () => {
    // Arrange
    const input: CreateBatchInput = {
      id: batchId,
      releaseId,
      promptId,
      status: 'PENDING',
      variantCount: 4,
    };

    // Act
    const created = await repo.createBatch(input);
    const retrieved = await repo.getBatchById(batchId);

    // Assert
    expect(created.id).toBe(batchId);
    expect(created.variantCount).toBe(4);
    expect(created.status).toBe('PENDING');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(batchId);
    expect(retrieved?.promptId).toBe(promptId);
  });

  test('@spec REQ-HU-3.2-02: returns null when batch does not exist', async () => {
    // Act
    const result = await repo.getBatchById('00000000-0000-0000-0000-000000000000');

    // Assert
    expect(result).toBeNull();
  });

  test('@spec REQ-HU-3.2-03: updates batch status through generation lifecycle', async () => {
    // Arrange
    const input: CreateBatchInput = {
      id: batchId,
      releaseId,
      promptId,
      status: 'PENDING',
    };
    await repo.createBatch(input);

    // Act 1: Transition to GENERATING
    const inProgress = await repo.updateBatchStatus(batchId, 'GENERATING');
    expect(inProgress.status).toBe('GENERATING');

    // Act 2: Transition to COMPLETED
    const completed = await repo.updateBatchStatus(batchId, 'COMPLETED');
    expect(completed.status).toBe('COMPLETED');
  });

  test('@spec REQ-HU-3.2-04: links batch to release task deliverable', async () => {
    // Arrange
    const input: CreateBatchInput = {
      id: batchId,
      releaseId,
      promptId,
    };
    await repo.createBatch(input);
    const phaseId = '66666666-6666-4666-8666-666666666666';
    const taskId = '77777777-7777-4777-8777-777777777777';

    // Seed parent phase & task for foreign key constraint
    db.prepare(`
      INSERT INTO release_phases (id, release_id, phase_type, name, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(phaseId, releaseId, 'PRE_RELEASE', 'Visual Production', '2026-11-01', '2026-11-15');

    db.prepare(`
      INSERT INTO release_tasks (id, release_id, phase_id, title, due_date, offset_days)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(taskId, releaseId, phaseId, 'Cover Artwork Delivery', '2026-11-15', -30);

    // Act
    const linked = await repo.linkBatchToTask(batchId, taskId);

    // Assert
    expect(linked.taskId).toBe(taskId);
  });

  test('@spec REQ-HU-3.2-05: deletes generation batch cleanly', async () => {
    // Arrange
    const input: CreateBatchInput = {
      id: batchId,
      releaseId,
      promptId,
    };
    await repo.createBatch(input);

    // Act
    const deleted = await repo.deleteBatch(batchId);
    const lookup = await repo.getBatchById(batchId);

    // Assert
    expect(deleted).toBe(true);
    expect(lookup).toBeNull();
  });

  test('@spec REQ-HU-3.2-06: cascade deletes batch when release concept is removed', async () => {
    // Arrange
    const input: CreateBatchInput = {
      id: batchId,
      releaseId,
      promptId,
    };
    await repo.createBatch(input);

    // Act: Delete parent release
    db.prepare('DELETE FROM releases WHERE id = ?').run(releaseId);

    // Assert: Batch removed via ON DELETE CASCADE
    const lookup = await repo.getBatchById(batchId);
    expect(lookup).toBeNull();
  });
});
