/**
 * @file social-connection-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createSocialConnectionRepository (HU-4.3 / SPEC-04-01).
 *              Verifies CRUD operations, platform queries, health status updates, and cascade deletion.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createSocialConnectionRepository,
  SocialConnectionRepository,
  CreateSocialConnectionInput,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-social-connection-repository';

describe('SQLite SocialConnectionRepository (HU-4.3 / SPEC-04-01)', () => {
  let db: DatabaseSync;
  let repo: SocialConnectionRepository;

  const labelId = '11111111-1111-4111-8111-111111111111';
  const connectionId = '22222222-2222-4222-8222-222222222222';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createSocialConnectionRepository(db);

    // Seed parent label
    db.prepare('INSERT INTO labels (id, name) VALUES (?, ?)').run(labelId, 'Aether Wave Records');
  });

  test('@spec REQ-HU-4.3-04: creates and retrieves a social connection record by ID', async () => {
    // Arrange
    const input: CreateSocialConnectionInput = {
      id: connectionId,
      labelId,
      platform: 'INSTAGRAM',
      accountName: '@aetherwave',
      accountId: 'ig-123456789',
      healthStatus: 'CONNECTED',
    };

    // Act
    const created = await repo.createConnection(input);
    const retrieved = await repo.getConnectionById(connectionId);

    // Assert
    expect(created.id).toBe(connectionId);
    expect(created.platform).toBe('INSTAGRAM');
    expect(created.healthStatus).toBe('CONNECTED');
    expect(retrieved).not.toBeNull();
    expect(retrieved?.id).toBe(connectionId);
    expect(retrieved?.accountName).toBe('@aetherwave');
  });

  test('@spec REQ-HU-4.3-05: returns null when querying a non-existent connection', async () => {
    // Act
    const result = await repo.getConnectionById('00000000-0000-0000-0000-000000000000');

    // Assert
    expect(result).toBeNull();
  });

  test('@spec REQ-HU-4.3-06: lists all connections for a specific label', async () => {
    // Arrange
    const conn1: CreateSocialConnectionInput = {
      id: connectionId,
      labelId,
      platform: 'INSTAGRAM',
      accountName: '@aetherwave_ig',
      accountId: 'ig-01',
    };
    const conn2: CreateSocialConnectionInput = {
      id: '33333333-3333-4333-8333-333333333333',
      labelId,
      platform: 'TIKTOK',
      accountName: '@aetherwave_tt',
      accountId: 'tt-01',
    };
    await repo.createConnection(conn1);
    await repo.createConnection(conn2);

    // Act
    const list = await repo.listConnectionsByLabelId(labelId);

    // Assert
    expect(list).toHaveLength(2);
    expect(list.map((c) => c.platform)).toContain('INSTAGRAM');
    expect(list.map((c) => c.platform)).toContain('TIKTOK');
  });

  test('@spec REQ-HU-4.3-07: updates health status to EXPIRED and updates timestamp', async () => {
    // Arrange
    const input: CreateSocialConnectionInput = {
      id: connectionId,
      labelId,
      platform: 'TWITTER_X',
      accountName: '@aetherwave_x',
      accountId: 'x-01',
      healthStatus: 'CONNECTED',
    };
    await repo.createConnection(input);

    // Act
    const updated = await repo.updateConnectionHealth(connectionId, {
      healthStatus: 'EXPIRED',
    });

    // Assert
    expect(updated.healthStatus).toBe('EXPIRED');
    const lookup = await repo.getConnectionById(connectionId);
    expect(lookup?.healthStatus).toBe('EXPIRED');
  });

  test('@spec REQ-HU-4.3-08: deletes connection and handles cascade deletion on label removal', async () => {
    // Arrange
    const input: CreateSocialConnectionInput = {
      id: connectionId,
      labelId,
      platform: 'FACEBOOK',
      accountName: 'Aether Wave Official',
      accountId: 'fb-01',
    };
    await repo.createConnection(input);

    // Act 1: Direct deletion
    const deleted = await repo.deleteConnection(connectionId);
    expect(deleted).toBe(true);
    expect(await repo.getConnectionById(connectionId)).toBeNull();

    // Re-create connection
    await repo.createConnection(input);

    // Act 2: Delete parent label
    db.prepare('DELETE FROM labels WHERE id = ?').run(labelId);

    // Assert: Cascaded
    expect(await repo.getConnectionById(connectionId)).toBeNull();
  });
});
