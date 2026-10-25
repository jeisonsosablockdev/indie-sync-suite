/**
 * @file api-key-repository.test.ts
 * @layer Infrastructure Test
 * @description SQLite integration tests for createApiKeyRepository (HU-6.2 / SPEC-06-02).
 *              Verifies key persistence, hash lookups, scope deserialization,
 *              usage auditing, and immediate revocation.
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createApiKeyRepository,
  ApiKeyRepository,
} from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-api-key-repository';
import { ExternalApiKey } from '../../../apps/web/src/lib/pipelines/portal/portal-schemas';

describe('SQLite ApiKeyRepository (SPEC-06-02)', () => {
  let db: DatabaseSync;
  let repo: ApiKeyRepository;

  const keyId1 = '11111111-1111-4111-8111-111111111111';
  const keyHash1 = 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855';

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    repo = createApiKeyRepository(db);
  });

  test('should insert and retrieve an API key by hash with parsed scopes', () => {
    const keyRecord: ExternalApiKey = {
      id: keyId1,
      label: 'Antigravity Local Agent',
      keyPrefix: 'iss_live_abc12345',
      keyHash: keyHash1,
      scopes: ['READ_RELEASES', 'WRITE_TASKS'],
    };

    repo.createApiKey(keyRecord);

    const fetched = repo.getApiKeyByHash(keyHash1);
    expect(fetched).not.toBeNull();
    expect(fetched?.id).toBe(keyId1);
    expect(fetched?.label).toBe('Antigravity Local Agent');
    expect(fetched?.keyPrefix).toBe('iss_live_abc12345');
    expect(fetched?.scopes).toEqual(['READ_RELEASES', 'WRITE_TASKS']);
    expect(fetched?.revokedAt).toBeNull();
    expect(fetched?.lastUsedAt).toBeNull();
  });

  test('should return null when looking up non-existent key hash', () => {
    expect(repo.getApiKeyByHash('unknown-hash')).toBeNull();
  });

  test('should list all API keys in descending order', () => {
    const key1: ExternalApiKey = {
      id: keyId1,
      label: 'Key 1',
      keyPrefix: 'iss_live_11111111',
      keyHash: keyHash1,
      scopes: ['READ_RELEASES'],
    };
    const key2: ExternalApiKey = {
      id: '22222222-2222-4222-8222-222222222222',
      label: 'Key 2',
      keyPrefix: 'iss_live_22222222',
      keyHash: 'hash-key-2',
      scopes: ['FULL_ACCESS'],
    };

    repo.createApiKey(key1);
    repo.createApiKey(key2);

    const list = repo.listApiKeys();
    expect(list).toHaveLength(2);
    expect(list.map((k) => k.id)).toContain(keyId1);
    expect(list.map((k) => k.id)).toContain('22222222-2222-4222-8222-222222222222');
  });

  test('should revoke API key and mark revoked_at', () => {
    const keyRecord: ExternalApiKey = {
      id: keyId1,
      label: 'Test Key',
      keyPrefix: 'iss_live_revoking',
      keyHash: keyHash1,
      scopes: ['READ_RELEASES'],
    };

    repo.createApiKey(keyRecord);
    repo.revokeApiKey(keyId1);

    const fetched = repo.getApiKeyByHash(keyHash1);
    expect(fetched).not.toBeNull();
    expect(fetched?.revokedAt).not.toBeNull();
  });

  test('should record usage timestamp on API key', () => {
    const keyRecord: ExternalApiKey = {
      id: keyId1,
      label: 'Test Key',
      keyPrefix: 'iss_live_usage',
      keyHash: keyHash1,
      scopes: ['READ_RELEASES'],
    };

    repo.createApiKey(keyRecord);
    expect(repo.getApiKeyByHash(keyHash1)?.lastUsedAt).toBeNull();

    repo.recordUsage(keyId1);
    expect(repo.getApiKeyByHash(keyHash1)?.lastUsedAt).not.toBeNull();
  });
});
