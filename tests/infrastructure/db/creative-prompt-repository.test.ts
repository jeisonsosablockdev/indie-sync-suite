/**
 * @file creative-prompt-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createCreativePromptRepository (HU-3.6 / SPEC-03-01).
 *              Verifies CRUD, version incrementation, platform preset mapping, and cascade deletion.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createCreativePromptRepository,
  CreativePromptRepository,
  CreatePromptInput,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-creative-prompt-repository';

describe('SQLite CreativePromptRepository (HU-3.6 / SPEC-03-01)', () => {
  let db: DatabaseSync;
  let repo: CreativePromptRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const artistId = '22222222-2222-4222-8222-222222222222';
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const promptId = '44444444-4444-4444-8444-444444444444';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createCreativePromptRepository(db);

    // Seed parent entities: label -> artist -> release
    db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(labelId, 'Hyperion Records');
    db.prepare('INSERT INTO artists (id, label_id, name) VALUES (?, ?, ?)').run(
      artistId,
      labelId,
      'Luna Vex'
    );
    db.prepare(
      'INSERT INTO releases (id, artist_id, title, release_date, archetype) VALUES (?, ?, ?, ?, ?)'
    ).run(releaseId, artistId, 'Starlight Echoes', '2026-12-01', 'single');
  });

  test('@spec REQ-HU-3.6-12: creates and retrieves a creative prompt by ID', async () => {
    // Arrange
    const input: CreatePromptInput = {
      id: promptId,
      releaseId,
      promptText: 'Astral synthwave visualizer with violet nebula backdrop',
      negativePrompt: 'low quality, blurry, text',
      platformPreset: 'MIDJOURNEY_V6',
      aspectRatio: 'SQUARE_1_1',
      version: 1,
      subject: 'Astral synthwave nebula',
      palette: '#7B2CBF, #9D4EDD',
      lighting: 'Ethereal ambient starlight',
      camera: 'Wide angle deep space photography',
    };

    // Act
    const created = await repo.createPrompt(input);
    const retrieved = await repo.getPromptById(promptId);

    // Assert
    expect(created.id).toBe(promptId);
    expect(created.releaseId).toBe(releaseId);
    expect(created.promptText).toBe(input.promptText);
    expect(created.platformPreset).toBe('MIDJOURNEY_V6');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(promptId);
    expect(retrieved?.version).toBe(1);
    expect(retrieved?.subject).toBe('Astral synthwave nebula');
  });

  test('@spec REQ-HU-3.6-13: returns null when prompt is not found', async () => {
    // Act
    const notFound = await repo.getPromptById('00000000-0000-0000-0000-000000000000');

    // Assert
    expect(notFound).toBeNull();
  });

  test('@spec REQ-HU-3.6-14: lists all prompts for a given release in descending order', async () => {
    // Arrange
    const prompt1: CreatePromptInput = {
      id: '55555555-5555-4555-8555-555555555555',
      releaseId,
      promptText: 'First prompt concept',
      platformPreset: 'MIDJOURNEY_V6',
      aspectRatio: 'SQUARE_1_1',
      version: 1,
      subject: 'Concept 1',
    };
    const prompt2: CreatePromptInput = {
      id: '66666666-6666-4666-8666-666666666666',
      releaseId,
      promptText: 'Second prompt concept (iterated)',
      platformPreset: 'FLUX_SD',
      aspectRatio: 'PORTRAIT_9_16',
      version: 2,
      subject: 'Concept 2',
    };

    await repo.createPrompt(prompt1);
    await repo.createPrompt(prompt2);

    // Act
    const list = await repo.listPromptsByReleaseId(releaseId);

    // Assert: Kills SQL ORDER BY mutation (Mutant 1) by asserting strict index position
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe(prompt2.id); // version 2 MUST be first
    expect(list[1].id).toBe(prompt1.id); // version 1 MUST be second
  });

  test('@spec REQ-HU-3.6-15: updates prompt text, negative prompt, preset and increments version', async () => {
    // Arrange
    const input: CreatePromptInput = {
      id: promptId,
      releaseId,
      promptText: 'Initial prompt text',
      platformPreset: 'MIDJOURNEY_V6',
      aspectRatio: 'SQUARE_1_1',
      version: 1,
      subject: 'Initial subject',
    };
    await repo.createPrompt(input);

    // Act
    const updated = await repo.updatePrompt(promptId, {
      promptText: 'Refined prompt text with deeper cinematic shadow',
      negativePrompt: 'oversaturated, text, artifacts',
      platformPreset: 'FLUX_SD',
      version: 2,
    });

    // Assert
    expect(updated.id).toBe(promptId);
    expect(updated.promptText).toBe('Refined prompt text with deeper cinematic shadow');
    expect(updated.negativePrompt).toBe('oversaturated, text, artifacts');
    expect(updated.platformPreset).toBe('FLUX_SD');
    expect(updated.version).toBe(2);
  });

  test('@spec REQ-HU-3.6-15b: automatically increments version when version is omitted in updates', async () => {
    // Arrange
    const input: CreatePromptInput = {
      id: promptId,
      releaseId,
      promptText: 'Base prompt text',
      platformPreset: 'MIDJOURNEY_V6',
      aspectRatio: 'SQUARE_1_1',
      version: 1,
      subject: 'Base subject',
    };
    await repo.createPrompt(input);

    // Act: Update without specifying version
    const updated = await repo.updatePrompt(promptId, {
      promptText: 'Auto-incremented text revision',
    });

    // Assert: Verify version was bumped to 2 automatically
    expect(updated.id).toBe(promptId);
    expect(updated.version).toBe(2);
    expect(updated.promptText).toBe('Auto-incremented text revision');
  });

  test('@spec REQ-HU-3.6-16: deletes prompt and verifies deletion', async () => {
    // Arrange
    const input: CreatePromptInput = {
      id: promptId,
      releaseId,
      promptText: 'To be deleted',
      platformPreset: 'RAW_TEXT',
      aspectRatio: 'SQUARE_1_1',
      subject: 'Temporary',
    };
    await repo.createPrompt(input);

    // Act
    const deleted = await repo.deletePrompt(promptId);
    const check = await repo.getPromptById(promptId);

    // Assert
    expect(deleted).toBe(true);
    expect(check).toBeNull();
  });

  test('@spec REQ-HU-3.6-17: enforces cascade deletion when parent release is removed', async () => {
    // Arrange
    const input: CreatePromptInput = {
      id: promptId,
      releaseId,
      promptText: 'Cascading prompt test',
      platformPreset: 'MIDJOURNEY_V6',
      aspectRatio: 'SQUARE_1_1',
      subject: 'Cascade target',
    };
    await repo.createPrompt(input);

    // Act: Delete parent release
    db.prepare('DELETE FROM releases WHERE id = ?').run(releaseId);

    // Assert
    const promptAfterDelete = await repo.getPromptById(promptId);
    expect(promptAfterDelete).toBeNull();
  });
});
