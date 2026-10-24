/**
 * @file streaming-metrics-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createStreamingMetricsRepository (HU-5.1 & HU-5.4 / SPEC-05-01 & SPEC-05-02).
 *              Verifies report creation, batch ingestion, time-window aggregations, and cascade deletions.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createStreamingMetricsRepository,
  StreamingMetricsRepository,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-streaming-metrics-repository';

describe('SQLite StreamingMetricsRepository (SPEC-05-01 & SPEC-05-02)', () => {
  let db: DatabaseSync;
  let repo: StreamingMetricsRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const artistId = '22222222-2222-4222-8222-222222222222';
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const reportId = '44444444-4444-4444-8444-444444444444';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createStreamingMetricsRepository(db);

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

  test('creates a streaming report audit header', async () => {
    const report = await repo.createReport({
      id: reportId,
      releaseId,
      fileName: 'spotify_artists_nov2026.csv',
      rowCount: 4,
      sourcePlatform: 'SPOTIFY',
    });

    expect(report.id).toBe(reportId);
    expect(report.fileName).toBe('spotify_artists_nov2026.csv');
    expect(report.sourcePlatform).toBe('SPOTIFY');
    expect(report.rowCount).toBe(4);
  });

  test('ingests batch of metric rows and calculates correct aggregations', async () => {
    await repo.createReport({
      id: reportId,
      releaseId,
      fileName: 'spotify_nov.csv',
      rowCount: 3,
      sourcePlatform: 'SPOTIFY',
    });

    const rows = [
      {
        id: 'row-1',
        metricDate: '2026-11-14',
        streams: 1000,
        listeners: 700,
        saves: 120,
        countryCode: 'MX',
      },
      {
        id: 'row-2',
        metricDate: '2026-11-15',
        streams: 2500,
        listeners: 1800,
        saves: 300,
        countryCode: 'MX',
      },
      {
        id: 'row-3',
        metricDate: '2026-11-15',
        streams: 1500,
        listeners: 1100,
        saves: 180,
        countryCode: 'CO',
      },
    ];

    const inserted = await repo.ingestMetricsBatch(reportId, releaseId, rows);
    expect(inserted).toBe(3);

    // Test total summary
    const totalSummary = await repo.getMetricsSummary(releaseId);
    expect(totalSummary.totalStreams).toBe(5000);
    expect(totalSummary.totalListeners).toBe(3600);
    expect(totalSummary.totalSaves).toBe(600);
    expect(totalSummary.startDate).toBe('2026-11-14');
    expect(totalSummary.endDate).toBe('2026-11-15');
    expect(totalSummary.topCountries).toHaveLength(2);
    expect(totalSummary.topCountries[0]).toEqual({ countryCode: 'MX', streams: 3500 });
    expect(totalSummary.topCountries[1]).toEqual({ countryCode: 'CO', streams: 1500 });
  });

  test('filters metrics by custom date range', async () => {
    await repo.createReport({
      id: reportId,
      releaseId,
      fileName: 'spotify_nov.csv',
      rowCount: 3,
      sourcePlatform: 'SPOTIFY',
    });

    await repo.ingestMetricsBatch(reportId, releaseId, [
      { id: 'm-1', metricDate: '2026-11-01', streams: 500, listeners: 300, saves: 50 },
      { id: 'm-2', metricDate: '2026-11-10', streams: 1200, listeners: 800, saves: 100 },
      { id: 'm-3', metricDate: '2026-11-20', streams: 2000, listeners: 1500, saves: 250 },
    ]);

    // Range: 2026-11-05 to 2026-11-15
    const filtered = await repo.getMetricsSummary(releaseId, '2026-11-05', '2026-11-15');
    expect(filtered.totalStreams).toBe(1200);
    expect(filtered.totalListeners).toBe(800);
  });

  test('lists metrics in chronological order', async () => {
    await repo.createReport({
      id: reportId,
      releaseId,
      fileName: 'spotify_nov.csv',
      rowCount: 2,
      sourcePlatform: 'SPOTIFY',
    });

    await repo.ingestMetricsBatch(reportId, releaseId, [
      { id: 'm-late', metricDate: '2026-11-20', streams: 100, listeners: 50, saves: 10 },
      { id: 'm-early', metricDate: '2026-11-05', streams: 50, listeners: 25, saves: 5 },
    ]);

    const list = await repo.listMetricsByReleaseId(releaseId);
    expect(list).toHaveLength(2);
    expect(list[0].id).toBe('m-early');
    expect(list[1].id).toBe('m-late');
  });

  test('cascades deletion on release removal', async () => {
    await repo.createReport({
      id: reportId,
      releaseId,
      fileName: 'spotify_nov.csv',
      rowCount: 1,
      sourcePlatform: 'SPOTIFY',
    });

    await repo.ingestMetricsBatch(reportId, releaseId, [
      { id: 'm-1', metricDate: '2026-11-05', streams: 100, listeners: 50, saves: 10 },
    ]);

    db.prepare('DELETE FROM releases WHERE id = ?').run(releaseId);

    const metrics = await repo.listMetricsByReleaseId(releaseId);
    expect(metrics).toHaveLength(0);
  });
});
