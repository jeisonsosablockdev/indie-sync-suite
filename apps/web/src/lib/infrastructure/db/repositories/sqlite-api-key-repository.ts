/**
 * @file sqlite-api-key-repository.ts
 * @layer Infrastructure
 * @description Pure functional SQLite repository managing external REST API keys, hashed secrets,
 *              granular scopes, and access auditing using native node:sqlite DatabaseSync. Zero classes.
 */

import { DatabaseSync } from 'node:sqlite';
import {
  ExternalApiKey,
  ApiKeyScope,
} from '../../../pipelines/portal/portal-schemas';

export interface ApiKeyRepository {
  createApiKey: (key: ExternalApiKey) => void;
  getApiKeyByHash: (keyHash: string) => ExternalApiKey | null;
  listApiKeys: () => ExternalApiKey[];
  revokeApiKey: (keyId: string) => void;
  recordUsage: (keyId: string) => void;
}

interface RawApiKeyRow {
  id: string;
  label: string;
  key_prefix: string;
  key_hash: string;
  scopes_json: string;
  last_used_at: string | null;
  revoked_at: string | null;
  created_at: string;
}

/**
 * Functional factory instantiating the ApiKeyRepository using native DatabaseSync.
 *
 * @param db - Native node:sqlite DatabaseSync connection instance
 * @returns Fully typed ApiKeyRepository API
 */
export function createApiKeyRepository(db: DatabaseSync): ApiKeyRepository {
  // Step 1: Prepare reusable SQL statements
  const insertKeyStmt = db.prepare(`
    INSERT INTO external_api_keys (id, label, key_prefix, key_hash, scopes_json, last_used_at, revoked_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?, ?)
  `);

  const selectKeyByHashStmt = db.prepare(`
    SELECT id, label, key_prefix, key_hash, scopes_json, last_used_at, revoked_at, created_at
    FROM external_api_keys
    WHERE key_hash = ?
  `);

  const listKeysStmt = db.prepare(`
    SELECT id, label, key_prefix, key_hash, scopes_json, last_used_at, revoked_at, created_at
    FROM external_api_keys
    ORDER BY created_at DESC
  `);

  const revokeKeyStmt = db.prepare(`
    UPDATE external_api_keys
    SET revoked_at = datetime('now')
    WHERE id = ?
  `);

  const recordUsageStmt = db.prepare(`
    UPDATE external_api_keys
    SET last_used_at = datetime('now')
    WHERE id = ?
  `);

  return {
    createApiKey: (key: ExternalApiKey): void => {
      // Step 2: Insert hashed API key record
      insertKeyStmt.run(
        key.id,
        key.label,
        key.keyPrefix,
        key.keyHash,
        JSON.stringify(key.scopes),
        key.lastUsedAt ?? null,
        key.revokedAt ?? null,
        key.createdAt ?? new Date().toISOString()
      );
    },

    getApiKeyByHash: (keyHash: string): ExternalApiKey | null => {
      // Step 3: Lookup active key by its SHA-256 hash
      const row = selectKeyByHashStmt.get(keyHash) as RawApiKeyRow | undefined;
      if (!row) {
        return null;
      }

      let parsedScopes: ApiKeyScope[] = [];
      try {
        parsedScopes = JSON.parse(row.scopes_json) as ApiKeyScope[];
      } catch {
        parsedScopes = [];
      }

      return {
        id: row.id,
        label: row.label,
        keyPrefix: row.key_prefix,
        keyHash: row.key_hash,
        scopes: parsedScopes,
        lastUsedAt: row.last_used_at,
        revokedAt: row.revoked_at,
        createdAt: row.created_at,
      };
    },

    listApiKeys: (): ExternalApiKey[] => {
      // Step 4: List all API keys for management console
      const rows = listKeysStmt.all() as unknown as RawApiKeyRow[];
      return rows.map((r) => {
        let parsedScopes: ApiKeyScope[] = [];
        try {
          parsedScopes = JSON.parse(r.scopes_json) as ApiKeyScope[];
        } catch {
          parsedScopes = [];
        }

        return {
          id: r.id,
          label: r.label,
          keyPrefix: r.key_prefix,
          keyHash: r.key_hash,
          scopes: parsedScopes,
          lastUsedAt: r.last_used_at,
          revokedAt: r.revoked_at,
          createdAt: r.created_at,
        };
      });
    },

    revokeApiKey: (keyId: string): void => {
      // Step 5: Mark API key as revoked
      revokeKeyStmt.run(keyId);
    },

    recordUsage: (keyId: string): void => {
      // Step 6: Update last_used_at timestamp
      recordUsageStmt.run(keyId);
    },
  };
}
