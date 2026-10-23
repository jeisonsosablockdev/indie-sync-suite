/**
 * @file action-log-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for SqliteActionLogRepository.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import { SqliteActionLogRepository } from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-action-log-repository';

describe('SqliteActionLogRepository', () => {
  let db: DatabaseSync;
  let repo: SqliteActionLogRepository;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');
    runMigrations(db);

    repo = new SqliteActionLogRepository(db);
  });

  test('records tool execution requests and updates lifecycle states', async () => {
    const actionId = '30000000-0000-4000-8000-000000000001';

    // 1. Record initial request
    await repo.recordRequest({
      id: actionId,
      toolName: 'actualizar_marca_artista',
      paramsSnapshot: { artistId: 'xyz', bio: 'Updated bio' },
      riskLevel: 'SENSITIVE',
      status: 'REQUESTED',
    });

    let record = await repo.findById(actionId);
    expect(record).not.toBeNull();
    expect(record?.toolName).toBe('actualizar_marca_artista');
    expect(record?.status).toBe('REQUESTED');

    // 2. Transition to CONFIRMED
    await repo.updateStatus(actionId, 'CONFIRMED', { confirmedBy: 'producer-jay' });

    record = await repo.findById(actionId);
    expect(record?.status).toBe('CONFIRMED');
    expect(record?.confirmedBy).toBe('producer-jay');

    // 3. Transition to EXECUTED with result
    await repo.updateStatus(actionId, 'EXECUTED', {
      resultSnapshot: { success: true },
    });

    record = await repo.findById(actionId);
    expect(record?.status).toBe('EXECUTED');
    expect(record?.resultSnapshot).toEqual({ success: true });
    expect(record?.executedAt).toBeDefined();

    // 4. List all records
    const all = await repo.findAll();
    expect(all.length).toBe(1);
    expect(all[0]?.id).toBe(actionId);
  });
});
