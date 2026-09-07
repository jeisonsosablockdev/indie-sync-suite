/**
 * @file brand-tools.test.ts
 * @layer Domain Test
 * @description Unit tests for Brand Vault agent tool definitions and contracts.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import { SqliteArtistRepository } from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-artist-repository';
import { SqliteLabelRepository } from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-label-repository';
import {
  createConsultarMarcaTool,
  createCrearArtistaTool,
  createActualizarMarcaArtistaTool,
} from '../../../apps/web/src/lib/pipelines/agent/tools/brand-tools';

describe('Brand Vault Tool Calling Contracts', () => {
  let db: DatabaseSync;
  let artistRepo: SqliteArtistRepository;
  let labelRepo: SqliteLabelRepository;
  const labelId = '11111111-1111-4111-8111-111111111111';

  beforeEach(async () => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    runMigrations(db);

    artistRepo = new SqliteArtistRepository(db);
    labelRepo = new SqliteLabelRepository(db);

    await labelRepo.create({
      id: labelId,
      name: 'Sony Music Indie',
      bio: 'Major indie division',
      colorPalette: ['#000000', '#FFFFFF'],
      typography: { primary: 'Inter', weights: [400] },
      toneOfVoice: 'Modern, creative',
      socialLinks: {},
    });
  });

  test('consultar_marca tool retrieves artist and label data', async () => {
    const tool = createConsultarMarcaTool(artistRepo, labelRepo);
    expect(tool.riskLevel).toBe('SAFE');

    const result = await tool.execute({ labelId });
    expect(result.type).toBe('label');
    expect(result.data.name).toBe('Sony Music Indie');
  });

  test('crear_artista tool validates parameters and registers new artist in repository', async () => {
    const tool = createCrearArtistaTool(artistRepo);
    expect(tool.riskLevel).toBe('SENSITIVE');

    const result = await tool.execute(
      {
        labelId,
        name: 'The Midnight Sounds',
        genre: 'Synthpop',
        bio: 'Atmospheric 80s inspired synthpop duo',
        colorPalette: ['#0F172A', '#818CF8'],
      },
      { confirmedBy: 'admin-user' }
    );

    expect(result.success).toBe(true);
    expect(result.artist.name).toBe('The Midnight Sounds');
    expect(result.confirmedBy).toBe('admin-user');

    const inDb = await artistRepo.findById(result.artist.id);
    expect(inDb).not.toBeNull();
    expect(inDb?.genre).toBe('Synthpop');
  });

  test('actualizar_marca_artista updates existing artist brand parameters', async () => {
    // First create
    const createTool = createCrearArtistaTool(artistRepo);
    const created = await createTool.execute({
      labelId,
      name: 'Echoes',
      genre: 'Dream Pop',
    });

    const updateTool = createActualizarMarcaArtistaTool(artistRepo);
    expect(updateTool.riskLevel).toBe('SENSITIVE');

    const updateResult = await updateTool.execute({
      artistId: created.artist.id,
      bio: 'Ethereal dream pop with lush reverbs',
      colorPalette: ['#18181B', '#EC4899'],
    });

    expect(updateResult.success).toBe(true);
    expect(updateResult.updated.bio).toBe('Ethereal dream pop with lush reverbs');
    expect(updateResult.updated.colorPalette).toEqual(['#18181B', '#EC4899']);
  });
});
