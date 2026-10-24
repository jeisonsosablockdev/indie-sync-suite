/**
 * @file release-concept-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createReleaseConceptRepository with snapshot freezing and FK cascades (SPEC-2.1.2.1).
 *              Strict TDD AAA structure and anti-tautology compliance.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import { createReleaseConceptRepository, ReleaseConceptRepository } from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-release-concept-repository';

describe('SQLite ReleaseConceptRepository (SPEC-2.1.2.1)', () => {
  let db: DatabaseSync;
  let repo: ReleaseConceptRepository;

  const labelId = '10000000-0000-4000-8000-000000000001';
  const artistId = '20000000-0000-4000-8000-000000000001';
  const releaseId = '30000000-0000-4000-8000-000000000001';
  const conceptId = '40000000-0000-4000-8000-000000000001';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    const migrationsDir = path.resolve(__dirname, '../../../apps/web/src/lib/infrastructure/db/migrations');
    runMigrations(db, migrationsDir);

    repo = createReleaseConceptRepository(db);

    // Seed parent label, artist, and release
    db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(labelId, 'Astral Records');
    db.prepare('INSERT INTO artists (id, label_id, name) VALUES (?, ?, ?)').run(artistId, labelId, 'Neon Mirage');
    db.prepare('INSERT INTO releases (id, artist_id, title, release_date, archetype) VALUES (?, ?, ?, ?, ?)').run(
      releaseId,
      artistId,
      'Midnight Odyssey',
      '2026-11-20',
      'single'
    );
  });

  test('@spec SPEC-2.1.2.1: returns null when concept does not exist for release', async () => {
    // Arrange & Act
    const result = await repo.findByReleaseId('non-existent-release');

    // Assert
    expect(result).toBeNull();
  });

  test('@spec SPEC-2.1.2.1: freezeSnapshot throws error when attempting to freeze non-existent concept', async () => {
    // Arrange & Act & Assert
    await expect(repo.freezeSnapshot('non-existent-release-id')).rejects.toThrowError(
      /Release concept not found/
    );
  });

  test('@spec SPEC-2.1.2.1: creates and retrieves new ReleaseConcept', async () => {
    // Arrange
    const newConcept = {
      id: conceptId,
      releaseId,
      narrative: 'Exploración nostálgica del aislamiento nocturno en una metrópoli futurista.',
      lyricTheme: 'Desconexión emocional y redención urbana.',
      soundMood: 'Synthwave analógico oscuro, reverbs espaciosos.',
      isrc: 'USS1Z2600001',
      upc: '012345678905',
      targetDate: '2026-11-20T00:00:00.000Z',
      budgetUsd: 1200.0,
      snapshotFrozen: false,
    };

    // Act
    const saved = await repo.upsert(newConcept);
    const retrieved = await repo.findByReleaseId(releaseId);

    // Assert
    expect(saved.id).toBe(conceptId);
    expect(retrieved).not.toBeNull();
    expect(retrieved?.narrative).toBe(newConcept.narrative);
    expect(retrieved?.isrc).toBe('USS1Z2600001');
    expect(retrieved?.budgetUsd).toBe(1200.0);
    expect(retrieved?.snapshotFrozen).toBe(false);
  });

  test('@spec SPEC-2.1.2.1: updates existing mutable concept before freeze', async () => {
    // Arrange
    await repo.upsert({
      id: conceptId,
      releaseId,
      narrative: 'Narrativa inicial borrador.',
      lyricTheme: 'Tema inicial.',
      soundMood: 'Mood inicial.',
      targetDate: '2026-11-20T00:00:00.000Z',
      budgetUsd: 500.0,
      snapshotFrozen: false,
    });

    // Act
    const updated = await repo.upsert({
      id: conceptId,
      releaseId,
      narrative: 'Narrativa refinada post feedback.',
      lyricTheme: 'Tema actualizado.',
      soundMood: 'Mood actualizado.',
      targetDate: '2026-11-20T00:00:00.000Z',
      budgetUsd: 800.0,
      snapshotFrozen: false,
    });

    // Assert
    expect(updated.narrative).toBe('Narrativa refinada post feedback.');
    expect(updated.budgetUsd).toBe(800.0);
  });

  test('@spec SPEC-2.1.2.1: freezeSnapshot locks concept and rejects subsequent mutations', async () => {
    // Arrange: Create concept
    await repo.upsert({
      id: conceptId,
      releaseId,
      narrative: 'Narrativa final de producción.',
      lyricTheme: 'Tema final.',
      soundMood: 'Mood definitivo.',
      targetDate: '2026-11-20T00:00:00.000Z',
      budgetUsd: 1500.0,
      snapshotFrozen: false,
    });

    // Act: Freeze snapshot
    await repo.freezeSnapshot(releaseId);
    const frozen = await repo.findByReleaseId(releaseId);

    // Assert: Concept is frozen with timestamp
    expect(frozen?.snapshotFrozen).toBe(true);
    expect(frozen?.frozenAt).not.toBeNull();

    // Act & Assert: Invariant enforcement - subsequent mutation must throw
    await expect(
      repo.upsert({
        id: conceptId,
        releaseId,
        narrative: 'Intento de modificación no autorizada.',
        lyricTheme: 'Tema alterado.',
        soundMood: 'Mood alterado.',
        targetDate: '2026-11-20T00:00:00.000Z',
        budgetUsd: 2000.0,
        snapshotFrozen: false,
      })
    ).rejects.toThrowError(/Cannot modify frozen release concept/);
  });

  test('@spec SPEC-2.1.2.1: cascades deletion from parent release to release_concept', async () => {
    // Arrange: Create concept
    await repo.upsert({
      id: conceptId,
      releaseId,
      narrative: 'Narrativa para prueba de cascade.',
      lyricTheme: 'Tema.',
      soundMood: 'Mood.',
      targetDate: '2026-11-20T00:00:00.000Z',
      budgetUsd: 1000.0,
      snapshotFrozen: false,
    });

    // Act: Delete parent release
    db.prepare('DELETE FROM releases WHERE id = ?').run(releaseId);

    // Assert: Concept record should be deleted
    const countRow = db.prepare('SELECT count(*) as count FROM release_concepts WHERE release_id = ?').get(releaseId) as any;
    expect(countRow.count).toBe(0);
  });
});
