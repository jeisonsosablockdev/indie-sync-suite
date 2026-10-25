/**
 * @file artist-portal-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createArtistPortalRepository (HU-6.5 / SPEC-06-01).
 *              Verifies session creation, lookup by token hash, immediate revocation,
 *              and recording of deliverable reviews.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createArtistPortalRepository,
  ArtistPortalRepository,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-artist-portal-repository';
import {
  ArtistPortalSession,
  PortalDeliverableReview,
} from '../../../apps/web/src/lib/pipelines/portal/portal-schemas';

describe('SQLite ArtistPortalRepository (SPEC-06-01)', () => {
  let db: DatabaseSync;
  let repo: ArtistPortalRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const artistId = '22222222-2222-4222-8222-222222222222';
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const phaseId = '44444444-4444-4444-8444-444444444444';
  const taskId = '55555555-5555-4555-8555-555555555555';
  const deliverableId = '66666666-6666-4666-8666-666666666666';

  const sessionId = '77777777-7777-4777-8777-777777777777';
  const tokenHash = 'a1b2c3d4e5f60718293a4b5c6d7e8f90123456789abcdef0123456789abcdef0';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createArtistPortalRepository(db);

    // Seed parent entities: label -> artist -> release -> phase -> task -> deliverable
    db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(labelId, 'Aether Wave Records');
    db.prepare('INSERT INTO artists (id, label_id, name) VALUES (?, ?, ?)').run(
      artistId,
      labelId,
      'Astra Project'
    );
    db.prepare(
      'INSERT INTO releases (id, artist_id, title, release_date, archetype) VALUES (?, ?, ?, ?, ?)'
    ).run(releaseId, artistId, 'Neon Horizon', '2026-11-15T00:00:00.000Z', 'THE_ARCHITECT');

    db.prepare(
      'INSERT INTO release_phases (id, release_id, phase_type, name, start_date, end_date, order_index) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(phaseId, releaseId, 'PRE_RELEASE', 'Pre-Release Phase', '2026-10-01', '2026-11-14', 1);

    db.prepare(
      'INSERT INTO release_tasks (id, release_id, phase_id, title, due_date, offset_days, status) VALUES (?, ?, ?, ?, ?, ?, ?)'
    ).run(taskId, releaseId, phaseId, 'Aprobar Arte de Portada', '2026-11-01', -14, 'IN_REVIEW');

    db.prepare(
      'INSERT INTO task_deliverables (id, task_id, title, asset_url, status) VALUES (?, ?, ?, ?, ?)'
    ).run(deliverableId, taskId, 'Portada Oficial 3000px', 'https://assets.example.com/cover.png', 'IN_REVIEW');
  });

  test('should create and retrieve an artist portal session by token hash', () => {
    const session: ArtistPortalSession = {
      id: sessionId,
      releaseId,
      artistId,
      tokenHash,
      expiresAt: '2026-11-01T00:00:00.000Z',
    };

    repo.createSession(session);

    const fetched = repo.getSessionByTokenHash(tokenHash);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(sessionId);
    expect(fetched?.releaseId).toBe(releaseId);
    expect(fetched?.artistId).toBe(artistId);
    expect(fetched?.tokenHash).toBe(tokenHash);
    expect(fetched?.expiresAt).toBe('2026-11-01T00:00:00.000Z');
    expect(fetched?.revokedAt).toBeNull();
  });

  test('should return null when session does not exist', () => {
    const result = repo.getSessionByTokenHash('non-existent-hash');
    expect(result).toBeNull();
  });

  test('should immediately revoke an active session', () => {
    const session: ArtistPortalSession = {
      id: sessionId,
      releaseId,
      artistId,
      tokenHash,
      expiresAt: '2026-11-01T00:00:00.000Z',
    };

    repo.createSession(session);
    repo.revokeSession(sessionId);

    const updated = repo.getSessionByTokenHash(tokenHash);
    expect(updated).not.toBeNull();
    expect(updated?.revokedAt).not.toBeNull();
  });

  test('should record review decisions and query them by session and deliverable', () => {
    // Arrange
    const session: ArtistPortalSession = {
      id: sessionId,
      releaseId,
      artistId,
      tokenHash,
      expiresAt: '2026-11-01T00:00:00.000Z',
    };
    repo.createSession(session);

    const reviewId = '88888888-8888-4888-8888-888888888888';
    const review: PortalDeliverableReview = {
      id: reviewId,
      sessionId,
      deliverableId,
      decision: 'APPROVED',
      feedbackText: 'El arte de portada quedó excelente, aprobado.',
    };

    // Act
    repo.recordReview(review);

    // Assert by session
    const sessionReviews = repo.getReviewsForSession(sessionId);
    expect(sessionReviews).toHaveLength(1);
    expect(sessionReviews[0].id).toBe(reviewId);
    expect(sessionReviews[0].decision).toBe('APPROVED');
    expect(sessionReviews[0].feedbackText).toBe('El arte de portada quedó excelente, aprobado.');

    // Assert by deliverable
    const deliverableReviews = repo.getReviewsForDeliverable(deliverableId);
    expect(deliverableReviews).toHaveLength(1);
    expect(deliverableReviews[0].id).toBe(reviewId);
    expect(deliverableReviews[0].decision).toBe('APPROVED');
  });

  test('should record changes requested decision with feedback text', () => {
    const session: ArtistPortalSession = {
      id: sessionId,
      releaseId,
      artistId,
      tokenHash,
      expiresAt: '2026-11-01T00:00:00.000Z',
    };
    repo.createSession(session);

    const reviewId = '99999999-9999-4999-8999-999999999999';
    const review: PortalDeliverableReview = {
      id: reviewId,
      sessionId,
      deliverableId,
      decision: 'CHANGES_REQUESTED',
      feedbackText: 'Por favor aumentar el contraste del título.',
    };

    repo.recordReview(review);

    const reviews = repo.getReviewsForDeliverable(deliverableId);
    expect(reviews).toHaveLength(1);
    expect(reviews[0].decision).toBe('CHANGES_REQUESTED');
    expect(reviews[0].feedbackText).toBe('Por favor aumentar el contraste del título.');
  });
});
