/**
 * @file artist-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for SqliteLabelRepository and SqliteArtistRepository with foreign key cascades.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import { SqliteLabelRepository } from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-label-repository';
import { SqliteArtistRepository } from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-artist-repository';

describe('SQLite Brand Vault Repositories', () => {
  let db: DatabaseSync;
  let labelRepo: SqliteLabelRepository;
  let artistRepo: SqliteArtistRepository;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    runMigrations(db);

    labelRepo = new SqliteLabelRepository(db);
    artistRepo = new SqliteArtistRepository(db);
  });

  test('executes complete CRUD cycle for Label and affiliated Artists', async () => {
    const labelId = '10000000-0000-4000-8000-000000000001';
    const artistId = '20000000-0000-4000-8000-000000000001';

    // 1. Create Label
    await labelRepo.create({
      id: labelId,
      name: 'Sub-Pop Indie',
      bio: 'Iconic independent label founded in Seattle',
      colorPalette: ['#000000', '#FFFFFF'],
      typography: { primary: 'Futura', weights: [400, 700] },
      toneOfVoice: 'Grunge, raw, authentic',
      socialLinks: { website: 'https://subpop.com' },
    });

    const retrievedLabel = await labelRepo.findById(labelId);
    expect(retrievedLabel).not.toBeNull();
    expect(retrievedLabel?.name).toBe('Sub-Pop Indie');
    expect(retrievedLabel?.colorPalette).toEqual(['#000000', '#FFFFFF']);

    // 2. Create Artist linked to Label
    await artistRepo.create({
      id: artistId,
      labelId,
      name: 'Nirvana',
      genre: 'Grunge',
      bio: 'Pioneering alternative rock trio',
      subgenres: ['Alternative Rock', 'Punk'],
      colorPalette: ['#FEF08A', '#18181B'],
      typography: { primary: 'Onyx', weights: [400] },
      toneOfVoice: 'Raw, energetic, rebellious',
      socialLinks: { spotify: 'https://open.spotify.com/artist/nirvana' },
    });

    const retrievedArtist = await artistRepo.findById(artistId);
    expect(retrievedArtist).not.toBeNull();
    expect(retrievedArtist?.name).toBe('Nirvana');
    expect(retrievedArtist?.genre).toBe('Grunge');
    expect(retrievedArtist?.subgenres).toEqual(['Alternative Rock', 'Punk']);

    // 3. Find Artists by Label ID
    const labelArtists = await artistRepo.findByLabelId(labelId);
    expect(labelArtists.length).toBe(1);
    expect(labelArtists[0]?.id).toBe(artistId);

    // 4. Update Artist
    const updated = await artistRepo.update(artistId, {
      bio: 'Legendary grunge band',
      colorPalette: ['#EAB308', '#000000'],
    });
    expect(updated?.bio).toBe('Legendary grunge band');
    expect(updated?.colorPalette).toEqual(['#EAB308', '#000000']);

    // 5. Cascade Delete: Deleting Label automatically removes affiliated Artists
    await labelRepo.delete(labelId);

    const deletedArtist = await artistRepo.findById(artistId);
    expect(deletedArtist).toBeNull();
  });

  test('enforces foreign key integrity: rejects artist insertion for non-existent label', async () => {
    const orphanArtist = {
      id: '99999999-9999-4999-8999-999999999999',
      labelId: '00000000-0000-4000-8000-000000000000', // Missing label
      name: 'Orphan Artist',
      genre: 'Indie',
      colorPalette: ['#123456'],
      typography: { primary: 'Inter', weights: [400] },
      socialLinks: {},
    };

    await expect(artistRepo.create(orphanArtist as any)).rejects.toThrow();
  });
});
