/**
 * @file ad-campaign-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createAdCampaignRepository (HU-4.2 / SPEC-04-04).
 *              Verifies CRUD operations, budget invariant validation ($20–$100 USD), status transitions,
 *              and cascade deletion on release deletion.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createAdCampaignRepository,
  AdCampaignRepository,
  CreateAdCampaignInput,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-ad-campaign-repository';

describe('SQLite AdCampaignRepository (HU-4.2 / SPEC-04-04)', () => {
  let db: DatabaseSync;
  let repo: AdCampaignRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const artistId = '22222222-2222-4222-8222-222222222222';
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const campaignId1 = 'aaaa1111-1111-4111-8111-111111111111';
  const campaignId2 = 'bbbb2222-2222-4222-8222-222222222222';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createAdCampaignRepository(db);

    // Seed parent entities: label -> artist -> release
    db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(labelId, 'Aether Wave Records');
    db.prepare('INSERT INTO artists (id, label_id, name) VALUES (?, ?, ?)').run(
      artistId,
      labelId,
      'Astra Project'
    );
    db.prepare(
      'INSERT INTO releases (id, artist_id, title, release_date, archetype) VALUES (?, ?, ?, ?, ?)'
    ).run(releaseId, artistId, 'Neon Horizon', '2026-11-15T00:00:00.000Z', 'THE_ARCHITECT');
  });

  test('creates and retrieves an ad campaign within budget boundaries ($20-$100)', async () => {
    const input: CreateAdCampaignInput = {
      id: campaignId1,
      releaseId,
      platform: 'META_ADS',
      budgetUsd: 50.0,
      destinationUrl: 'https://distrokid.com/hyperfollow/astra/neon-horizon',
      targetAudience: 'Indie electronic, synthwave fans 18-35',
      startDate: '2026-11-10T00:00:00.000Z',
      endDate: '2026-11-17T00:00:00.000Z',
      status: 'DRAFT',
    };

    const created = await repo.createCampaign(input);
    expect(created.id).toBe(campaignId1);
    expect(created.budgetUsd).toBe(50.0);
    expect(created.status).toBe('DRAFT');

    const fetched = await repo.getCampaignById(campaignId1);
    expect(fetched).not.toBeNull();
    expect(fetched?.platform).toBe('META_ADS');
    expect(fetched?.targetAudience).toBe('Indie electronic, synthwave fans 18-35');
  });

  test('rejects creation when budget is below $20.00 USD (application & database invariant)', async () => {
    const input: CreateAdCampaignInput = {
      id: campaignId1,
      releaseId,
      platform: 'TIKTOK_ADS',
      budgetUsd: 15.0,
      destinationUrl: 'https://spotify.com/album/123',
      targetAudience: 'Viral music',
      startDate: '2026-11-10T00:00:00.000Z',
      endDate: '2026-11-15T00:00:00.000Z',
    };

    await expect(repo.createCampaign(input)).rejects.toThrow(
      'Budget USD must be between $20.00 and $100.00'
    );
  });

  test('rejects creation when budget is above $100.00 USD', async () => {
    const input: CreateAdCampaignInput = {
      id: campaignId1,
      releaseId,
      platform: 'META_ADS',
      budgetUsd: 150.0,
      destinationUrl: 'https://spotify.com/album/123',
      targetAudience: 'Broad audience',
      startDate: '2026-11-10T00:00:00.000Z',
      endDate: '2026-11-15T00:00:00.000Z',
    };

    await expect(repo.createCampaign(input)).rejects.toThrow(
      'Budget USD must be between $20.00 and $100.00'
    );
  });

  test('lists campaigns by release ordered by start_date', async () => {
    await repo.createCampaign({
      id: campaignId1,
      releaseId,
      platform: 'META_ADS',
      budgetUsd: 40.0,
      destinationUrl: 'https://distrokid.com/1',
      targetAudience: 'Audience 1',
      startDate: '2026-11-12T00:00:00.000Z',
      endDate: '2026-11-17T00:00:00.000Z',
    });

    await repo.createCampaign({
      id: campaignId2,
      releaseId,
      platform: 'TIKTOK_ADS',
      budgetUsd: 30.0,
      destinationUrl: 'https://distrokid.com/2',
      targetAudience: 'Audience 2',
      startDate: '2026-11-08T00:00:00.000Z',
      endDate: '2026-11-13T00:00:00.000Z',
    });

    const campaigns = await repo.listCampaignsByReleaseId(releaseId);
    expect(campaigns).toHaveLength(2);
    // campaignId2 starts earlier (11-08 < 11-12)
    expect(campaigns[0].id).toBe(campaignId2);
    expect(campaigns[1].id).toBe(campaignId1);
  });

  test('updates campaign status and external campaign id', async () => {
    await repo.createCampaign({
      id: campaignId1,
      releaseId,
      platform: 'META_ADS',
      budgetUsd: 25.0,
      destinationUrl: 'https://distrokid.com/1',
      targetAudience: 'Audience 1',
      startDate: '2026-11-12T00:00:00.000Z',
      endDate: '2026-11-17T00:00:00.000Z',
      status: 'DRAFT',
    });

    const updated = await repo.updateCampaignStatus(campaignId1, {
      status: 'ACTIVE',
      externalCampaignId: 'act_meta_987654321',
    });

    expect(updated.status).toBe('ACTIVE');
    expect(updated.externalCampaignId).toBe('act_meta_987654321');
  });

  test('deletes campaign by id and verifies cascade on release deletion', async () => {
    await repo.createCampaign({
      id: campaignId1,
      releaseId,
      platform: 'META_ADS',
      budgetUsd: 20.0,
      destinationUrl: 'https://distrokid.com/1',
      targetAudience: 'Audience 1',
      startDate: '2026-11-12T00:00:00.000Z',
      endDate: '2026-11-17T00:00:00.000Z',
    });

    // Delete single campaign
    const deleted = await repo.deleteCampaign(campaignId1);
    expect(deleted).toBe(true);
    expect(await repo.getCampaignById(campaignId1)).toBeNull();

    // Recreate and test release cascade
    await repo.createCampaign({
      id: campaignId2,
      releaseId,
      platform: 'TIKTOK_ADS',
      budgetUsd: 20.0,
      destinationUrl: 'https://distrokid.com/2',
      targetAudience: 'Audience 2',
      startDate: '2026-11-12T00:00:00.000Z',
      endDate: '2026-11-17T00:00:00.000Z',
    });

    db.prepare('DELETE FROM releases WHERE id = ?').run(releaseId);
    expect(await repo.getCampaignById(campaignId2)).toBeNull();
  });
});
