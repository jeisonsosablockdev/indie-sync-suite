/**
 * @file scheduled-post-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createScheduledPostRepository (HU-4.1 / SPEC-04-02).
 *              Verifies CRUD operations, chronological ordering, status updates, rescheduling, and cascade/null relations.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createScheduledPostRepository,
  ScheduledPostRepository,
  CreateScheduledPostInput,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-scheduled-post-repository';

describe('SQLite ScheduledPostRepository (HU-4.1 / SPEC-04-02)', () => {
  let db: DatabaseSync;
  let repo: ScheduledPostRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const artistId = '22222222-2222-4222-8222-222222222222';
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const assetId = '44444444-4444-4444-8444-444444444444';
  const postId = '55555555-5555-4555-8555-555555555555';
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

    repo = createScheduledPostRepository(db);

    // Seed parent entities: label -> artist -> release -> creative_asset
    db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(labelId, 'Aether Wave Records');
    db.prepare('INSERT INTO artists (id, label_id, name) VALUES (?, ?, ?)').run(
      artistId,
      labelId,
      'Astra Project'
    );
    db.prepare(
      'INSERT INTO releases (id, artist_id, title, release_date, archetype) VALUES (?, ?, ?, ?, ?)'
    ).run(releaseId, artistId, 'Nebula Horizons', '2026-11-20', 'single');

    db.prepare(`
      INSERT INTO creative_assets (
        id, release_id, format, aspect_ratio, width, height, storage_path, content_hash, mime_type, file_size_bytes, status
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `).run(
      assetId,
      releaseId,
      'COVER_1_1',
      'SQUARE_1_1',
      3000,
      3000,
      'assets/nebula.png',
      testHash,
      'image/png',
      4194304,
      'APPROVED'
    );
  });

  test('@spec REQ-HU-4.1-06: creates and retrieves a scheduled post by ID', async () => {
    // Arrange
    const input: CreateScheduledPostInput = {
      id: postId,
      releaseId,
      assetId,
      platform: 'INSTAGRAM',
      postText: '¡Nuestro nuevo single sale este viernes! Haz pre-save.',
      scheduledTime: '2026-11-18T18:00:00.000Z',
      mediaUrl: 'https://r2.postiz.com/assets/nebula.png',
      mediaHash: testHash,
      status: 'DRAFT',
    };

    // Act
    const created = await repo.createScheduledPost(input);
    const retrieved = await repo.getScheduledPostById(postId);

    // Assert
    expect(created.id).toBe(postId);
    expect(created.releaseId).toBe(releaseId);
    expect(created.assetId).toBe(assetId);
    expect(created.status).toBe('DRAFT');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(postId);
    expect(retrieved?.mediaHash).toBe(testHash);
  });

  test('@spec REQ-HU-4.1-07: lists scheduled posts ordered chronologically by scheduled_time', async () => {
    // Arrange
    const postEarly: CreateScheduledPostInput = {
      id: postId,
      releaseId,
      platform: 'TWITTER_X',
      postText: 'Primer teaser del release',
      scheduledTime: '2026-11-10T12:00:00.000Z',
    };
    const postLate: CreateScheduledPostInput = {
      id: '66666666-6666-4666-8666-666666666666',
      releaseId,
      platform: 'TIKTOK',
      postText: '¡Ya en todas las plataformas!',
      scheduledTime: '2026-11-20T00:00:00.000Z',
    };
    await repo.createScheduledPost(postLate);
    await repo.createScheduledPost(postEarly);

    // Act
    const posts = await repo.listScheduledPostsByReleaseId(releaseId);

    // Assert
    expect(posts).toHaveLength(2);
    expect(posts[0]?.id).toBe(postId); // Earlier post first
    expect(posts[1]?.id).toBe('66666666-6666-4666-8666-666666666666');
  });

  test('@spec REQ-HU-4.1-08: updates post status to QUEUED and PUBLISHED with external Postiz ID', async () => {
    // Arrange
    const input: CreateScheduledPostInput = {
      id: postId,
      releaseId,
      platform: 'INSTAGRAM',
      postText: 'Lanzamiento inminente',
      scheduledTime: '2026-11-19T20:00:00.000Z',
      status: 'DRAFT',
    };
    await repo.createScheduledPost(input);

    // Act 1: Queueing
    const queued = await repo.updateScheduledPostStatus(postId, {
      status: 'QUEUED',
      postizPostId: 'postiz-job-98765',
    });
    expect(queued.status).toBe('QUEUED');
    expect(queued.postizPostId).toBe('postiz-job-98765');

    // Act 2: Published
    const published = await repo.updateScheduledPostStatus(postId, {
      status: 'PUBLISHED',
    });
    expect(published.status).toBe('PUBLISHED');
  });

  test('@spec REQ-HU-4.1-09: reschedules post timestamp dynamically', async () => {
    // Arrange
    const input: CreateScheduledPostInput = {
      id: postId,
      releaseId,
      platform: 'YOUTUBE',
      postText: 'Video oficial',
      scheduledTime: '2026-11-20T16:00:00.000Z',
    };
    await repo.createScheduledPost(input);

    // Act
    const updated = await repo.reschedulePost(postId, '2026-11-21T18:00:00.000Z');

    // Assert
    expect(updated.scheduledTime).toBe('2026-11-21T18:00:00.000Z');
  });

  test('@spec REQ-HU-4.1-10: sets asset_id to NULL on asset deletion and cascades on release deletion', async () => {
    // Arrange
    const input: CreateScheduledPostInput = {
      id: postId,
      releaseId,
      assetId,
      platform: 'FACEBOOK',
      postText: 'Single announcement',
      scheduledTime: '2026-11-15T12:00:00.000Z',
    };
    await repo.createScheduledPost(input);

    // Act 1: Delete creative asset
    db.prepare('DELETE FROM creative_assets WHERE id = ?').run(assetId);

    // Assert: asset_id is NULL, post still exists
    const postAfterAssetDelete = await repo.getScheduledPostById(postId);
    expect(postAfterAssetDelete).not.toBeNull();
    expect(postAfterAssetDelete?.assetId).toBeNull();

    // Act 2: Delete release parent
    db.prepare('DELETE FROM releases WHERE id = ?').run(releaseId);

    // Assert: Cascade deleted
    const postAfterReleaseDelete = await repo.getScheduledPostById(postId);
    expect(postAfterReleaseDelete).toBeNull();
  });
});
