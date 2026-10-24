/**
 * @file creative-asset-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createCreativeAssetRepository (HU-3.5 / SPEC-03-06).
 *              Verifies CRUD operations, format filtering, SHA-256 lookups, deliverable linkage, and cascade deletion.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createCreativeAssetRepository,
  CreativeAssetRepository,
  CreateAssetInput,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-creative-asset-repository';

describe('SQLite CreativeAssetRepository (HU-3.5 / SPEC-03-06)', () => {
  let db: DatabaseSync;
  let repo: CreativeAssetRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const artistId = '22222222-2222-4222-8222-222222222222';
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const assetId = '88888888-8888-4888-8888-888888888888';
  const testHash = 'a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createCreativeAssetRepository(db);

    // Seed parent entities: label -> artist -> release
    db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(labelId, 'Nova Pulse Records');
    db.prepare('INSERT INTO artists (id, label_id, name) VALUES (?, ?, ?)').run(
      artistId,
      labelId,
      'Orion Vibe'
    );
    db.prepare(
      'INSERT INTO releases (id, artist_id, title, release_date, archetype) VALUES (?, ?, ?, ?, ?)'
    ).run(releaseId, artistId, 'Supernova', '2026-11-20', 'single');
  });

  test('@spec REQ-HU-3.5-05: creates and retrieves a creative asset by ID', async () => {
    // Arrange
    const input: CreateAssetInput = {
      id: assetId,
      releaseId,
      format: 'COVER_1_1',
      aspectRatio: 'SQUARE_1_1',
      width: 3000,
      height: 3000,
      storagePath: '.local-vault/assets/supernova-cover.png',
      contentHash: testHash,
      mimeType: 'image/png',
      fileSizeBytes: 4194304,
      status: 'DRAFT',
    };

    // Act
    const created = await repo.createAsset(input);
    const retrieved = await repo.getAssetById(assetId);

    // Assert
    expect(created.id).toBe(assetId);
    expect(created.format).toBe('COVER_1_1');
    expect(created.width).toBe(3000);
    expect(created.height).toBe(3000);
    expect(created.contentHash).toBe(testHash);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(assetId);
    expect(retrieved?.releaseId).toBe(releaseId);
  });

  test('@spec REQ-HU-3.5-06: retrieves an asset by its immutable SHA-256 content hash', async () => {
    // Arrange
    const input: CreateAssetInput = {
      id: assetId,
      releaseId,
      format: 'STORY_9_16',
      aspectRatio: 'PORTRAIT_9_16',
      width: 1080,
      height: 1920,
      storagePath: '.local-vault/assets/supernova-story.mp4',
      contentHash: testHash,
      mimeType: 'video/mp4',
      fileSizeBytes: 12582912,
      status: 'APPROVED',
    };
    await repo.createAsset(input);

    // Act
    const found = await repo.getAssetByContentHash(testHash);
    const notFound = await repo.getAssetByContentHash('0000000000000000000000000000000000000000000000000000000000000000');

    // Assert
    expect(found).not.toBeNull();
    expect(found?.id).toBe(assetId);
    expect(found?.format).toBe('STORY_9_16');
    expect(notFound).toBeNull();
  });

  test('@spec REQ-HU-3.5-07: lists and filters assets by release ID and format', async () => {
    // Arrange
    const asset1: CreateAssetInput = {
      id: assetId,
      releaseId,
      format: 'COVER_1_1',
      aspectRatio: 'SQUARE_1_1',
      width: 3000,
      height: 3000,
      storagePath: 'cover.png',
      contentHash: testHash,
      mimeType: 'image/png',
      fileSizeBytes: 2000000,
      status: 'APPROVED',
    };
    const asset2: CreateAssetInput = {
      id: '99999999-9999-4999-8999-999999999999',
      releaseId,
      format: 'BANNER_16_9',
      aspectRatio: 'LANDSCAPE_16_9',
      width: 1920,
      height: 1080,
      storagePath: 'banner.png',
      contentHash: 'b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3d4e5f6a1b2c3',
      mimeType: 'image/png',
      fileSizeBytes: 1500000,
      status: 'DRAFT',
    };
    await repo.createAsset(asset1);
    await repo.createAsset(asset2);

    // Act
    const all = await repo.listAssetsByReleaseId(releaseId);
    const coversOnly = await repo.listAssetsByReleaseId(releaseId, { format: 'COVER_1_1' });
    const approvedOnly = await repo.listAssetsByReleaseId(releaseId, { status: 'APPROVED' });

    // Assert
    expect(all).toHaveLength(2);
    expect(coversOnly).toHaveLength(1);
    expect(coversOnly[0]?.format).toBe('COVER_1_1');
    expect(approvedOnly).toHaveLength(1);
    expect(approvedOnly[0]?.status).toBe('APPROVED');
  });

  test('@spec REQ-HU-3.5-08: updates asset status and links deliverable ID', async () => {
    // Arrange
    const input: CreateAssetInput = {
      id: assetId,
      releaseId,
      format: 'COVER_1_1',
      aspectRatio: 'SQUARE_1_1',
      width: 3000,
      height: 3000,
      storagePath: 'cover.png',
      contentHash: testHash,
      mimeType: 'image/png',
      fileSizeBytes: 3000000,
      status: 'DRAFT',
    };
    await repo.createAsset(input);
    const deliverableId = 'dddddddd-dddd-4ddd-8ddd-dddddddddddd';

    // Seed phase, task, and deliverable to satisfy foreign key constraints
    const phaseId = 'pppppppp-pppp-4ppp-8ppp-pppppppppppp';
    const taskId = 'tttttttt-tttt-4ttt-8ttt-tttttttttttt';
    db.prepare(`
      INSERT INTO release_phases (id, release_id, phase_type, name, start_date, end_date)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(phaseId, releaseId, 'PRE_RELEASE', 'Cover Phase', '2026-11-01', '2026-11-10');

    db.prepare(`
      INSERT INTO release_tasks (id, release_id, phase_id, title, due_date, offset_days)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(taskId, releaseId, phaseId, 'Cover Task', '2026-11-05', -15);

    db.prepare(`
      INSERT INTO task_deliverables (id, task_id, title, asset_url)
      VALUES (?, ?, ?, ?)
    `).run(deliverableId, taskId, 'Final Master Cover', 'https://storage/cover.png');

    // Act
    const updated = await repo.updateAssetStatus(assetId, 'APPROVED', deliverableId);

    // Assert
    expect(updated.status).toBe('APPROVED');
    expect(updated.deliverableId).toBe(deliverableId);
  });

  test('@spec REQ-HU-3.5-09: deletes an asset and handles cascade deletion on release removal', async () => {
    // Arrange
    const input: CreateAssetInput = {
      id: assetId,
      releaseId,
      format: 'COVER_1_1',
      aspectRatio: 'SQUARE_1_1',
      width: 3000,
      height: 3000,
      storagePath: 'cover.png',
      contentHash: testHash,
      mimeType: 'image/png',
      fileSizeBytes: 1000000,
    };
    await repo.createAsset(input);

    // Act 1: Delete asset directly
    const deleted = await repo.deleteAsset(assetId);
    expect(deleted).toBe(true);
    expect(await repo.getAssetById(assetId)).toBeNull();

    // Re-create asset
    await repo.createAsset(input);

    // Act 2: Delete release parent
    db.prepare('DELETE FROM releases WHERE id = ?').run(releaseId);

    // Assert: Asset cascade removed
    expect(await repo.getAssetById(assetId)).toBeNull();
  });
});
