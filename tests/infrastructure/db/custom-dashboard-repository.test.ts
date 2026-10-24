/**
 * @file custom-dashboard-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createCustomDashboardRepository (HU-5.3 & HU-6.1 v5 / SPEC-05-06).
 *              Verifies dashboard registration, widget composition, sequencing order,
 *              and cascade deletion.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createCustomDashboardRepository,
  CustomDashboardRepository,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-custom-dashboard-repository';

describe('SQLite CustomDashboardRepository (SPEC-05-06)', () => {
  let db: DatabaseSync;
  let repo: CustomDashboardRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const artistId = '22222222-2222-4222-8222-222222222222';
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const dashboardId = '66666666-6666-4666-8666-666666666666';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createCustomDashboardRepository(db);

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

  test('should create and retrieve a custom API dashboard', async () => {
    // Act
    const created = await repo.createDashboard({
      id: dashboardId,
      releaseId,
      name: 'Panel Spotify For Artists',
      endpointUrl: 'https://api.spotify.com/v1/artists/astra/stats',
      authHeaderEncrypted: 'Bearer eyJhbGciOi...',
    });

    // Assert
    expect(created.id).toBe(dashboardId);
    expect(created.releaseId).toBe(releaseId);
    expect(created.name).toBe('Panel Spotify For Artists');
    expect(created.endpointUrl).toBe('https://api.spotify.com/v1/artists/astra/stats');
    expect(created.authHeaderEncrypted).toBe('Bearer eyJhbGciOi...');

    const fetched = await repo.getDashboardById(dashboardId);
    expect(fetched).not.toBeNull();
    expect(fetched?.name).toBe('Panel Spotify For Artists');
  });

  test('should list dashboards associated with a release', async () => {
    // Arrange
    const d1 = 'd1111111-1111-4111-8111-111111111111';
    const d2 = 'd2222222-2222-4222-8222-222222222222';

    await repo.createDashboard({
      id: d1,
      releaseId,
      name: 'Panel 1',
      endpointUrl: 'https://api.example.com/one',
    });
    await repo.createDashboard({
      id: d2,
      releaseId,
      name: 'Panel 2',
      endpointUrl: 'https://api.example.com/two',
    });

    // Act
    const list = await repo.listDashboardsByReleaseId(releaseId);

    // Assert
    expect(list.length).toBe(2);
    expect(list.map((d) => d.id)).toContain(d1);
    expect(list.map((d) => d.id)).toContain(d2);
  });

  test('should add widgets and retrieve them ordered by order_index', async () => {
    // Arrange
    await repo.createDashboard({
      id: dashboardId,
      releaseId,
      name: 'Panel con Widgets',
      endpointUrl: 'https://api.example.com/metrics',
    });

    const w1 = 'w1111111-1111-4111-8111-111111111111';
    const w2 = 'w2222222-2222-4222-8222-222222222222';

    // Act - insert out of order
    await repo.addWidget({
      id: w2,
      dashboardId,
      widgetType: 'TIME_SERIES',
      title: 'Evolución de Streams',
      dataPath: 'dailyStreams',
      orderIndex: 2,
    });

    await repo.addWidget({
      id: w1,
      dashboardId,
      widgetType: 'KPI_CARD',
      title: 'Oyentes Totales',
      dataPath: 'totalListeners',
      orderIndex: 1,
    });

    const widgets = await repo.listWidgetsByDashboardId(dashboardId);

    // Assert
    expect(widgets.length).toBe(2);
    expect(widgets[0].id).toBe(w1); // orderIndex 1 first
    expect(widgets[0].widgetType).toBe('KPI_CARD');
    expect(widgets[1].id).toBe(w2); // orderIndex 2 second
    expect(widgets[1].widgetType).toBe('TIME_SERIES');
  });

  test('should delete dashboard and cascade delete all its widgets', async () => {
    // Arrange
    await repo.createDashboard({
      id: dashboardId,
      releaseId,
      name: 'Panel a Eliminar',
      endpointUrl: 'https://api.example.com/temp',
    });

    await repo.addWidget({
      id: 'widget-to-delete',
      dashboardId,
      widgetType: 'KPI_CARD',
      title: 'Temporal',
      dataPath: 'temp',
    });

    // Act
    const deleted = await repo.deleteDashboard(dashboardId);

    // Assert
    expect(deleted).toBe(true);

    const fetchedDashboard = await repo.getDashboardById(dashboardId);
    expect(fetchedDashboard).toBeNull();

    const widgetsAfter = await repo.listWidgetsByDashboardId(dashboardId);
    expect(widgetsAfter.length).toBe(0);

    const rawCheck = db.prepare('SELECT count(*) as count FROM custom_dashboard_widgets WHERE dashboard_id = ?').get(dashboardId) as { count: number };
    expect(rawCheck.count).toBe(0);
  });
});
