/**
 * @file sqlite-social-connection-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for social and ad accounts connected via OAuth Hub.
 *              Pure functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';

export type SocialPlatform =
  | 'INSTAGRAM'
  | 'TIKTOK'
  | 'TWITTER_X'
  | 'YOUTUBE'
  | 'FACEBOOK'
  | 'META_ADS'
  | 'TIKTOK_ADS';

export type HealthStatus = 'CONNECTED' | 'EXPIRED' | 'DISCONNECTED';

export interface SocialConnectionRecord {
  id: string;
  labelId: string;
  platform: SocialPlatform;
  accountName: string;
  accountId: string;
  healthStatus: HealthStatus;
  accessTokenEncrypted?: string | null;
  tokenExpiresAt?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateSocialConnectionInput {
  id: string;
  labelId: string;
  platform: SocialPlatform;
  accountName: string;
  accountId: string;
  healthStatus?: HealthStatus;
  accessTokenEncrypted?: string | null;
  tokenExpiresAt?: string | null;
}

export interface UpdateConnectionHealthInput {
  healthStatus: HealthStatus;
  accessTokenEncrypted?: string | null;
  tokenExpiresAt?: string | null;
}

export interface SocialConnectionRepository {
  createConnection: (input: CreateSocialConnectionInput) => Promise<SocialConnectionRecord>;
  getConnectionById: (id: string) => Promise<SocialConnectionRecord | null>;
  listConnectionsByLabelId: (labelId: string) => Promise<SocialConnectionRecord[]>;
  updateConnectionHealth: (id: string, updates: UpdateConnectionHealthInput) => Promise<SocialConnectionRecord>;
  deleteConnection: (id: string) => Promise<boolean>;
}

interface SqliteConnectionRow {
  id: string;
  label_id: string;
  platform: SocialPlatform;
  account_name: string;
  account_id: string;
  health_status: HealthStatus;
  access_token_encrypted: string | null;
  token_expires_at: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToRecord(row: SqliteConnectionRow): SocialConnectionRecord {
  return {
    id: row.id,
    labelId: row.label_id,
    platform: row.platform,
    accountName: row.account_name,
    accountId: row.account_id,
    healthStatus: row.health_status,
    accessTokenEncrypted: row.access_token_encrypted,
    tokenExpiresAt: row.token_expires_at,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Functional factory instantiating the SQLite Social Connection Repository.
 *
 * @param db - Native DatabaseSync instance
 * @returns Fully typed SocialConnectionRepository implementation
 */
export function createSocialConnectionRepository(db: DatabaseSync): SocialConnectionRepository {
  return {
    createConnection: async (input: CreateSocialConnectionInput): Promise<SocialConnectionRecord> => {
      // Step 1: Insert connection record
      const stmt = db.prepare(`
        INSERT INTO social_connections (
          id, label_id, platform, account_name, account_id,
          health_status, access_token_encrypted, token_expires_at,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?,
          datetime('now'), datetime('now')
        )
      `);

      stmt.run(
        input.id,
        input.labelId,
        input.platform,
        input.accountName,
        input.accountId,
        input.healthStatus ?? 'CONNECTED',
        input.accessTokenEncrypted ?? null,
        input.tokenExpiresAt ?? null
      );

      // Step 2: Fetch and return created record
      const selectStmt = db.prepare(`
        SELECT id, label_id, platform, account_name, account_id,
               health_status, access_token_encrypted, token_expires_at,
               created_at, updated_at
        FROM social_connections
        WHERE id = ?
      `);
      const row = selectStmt.get(input.id) as unknown as SqliteConnectionRow | undefined;
      if (!row) {
        throw new Error(`Failed to create social connection with id: ${input.id}`);
      }
      return mapRowToRecord(row);
    },

    getConnectionById: async (id: string): Promise<SocialConnectionRecord | null> => {
      // Step 1: Query connection by id
      const stmt = db.prepare(`
        SELECT id, label_id, platform, account_name, account_id,
               health_status, access_token_encrypted, token_expires_at,
               created_at, updated_at
        FROM social_connections
        WHERE id = ?
      `);
      const row = stmt.get(id) as unknown as SqliteConnectionRow | undefined;
      if (!row) return null;
      return mapRowToRecord(row);
    },

    listConnectionsByLabelId: async (labelId: string): Promise<SocialConnectionRecord[]> => {
      // Step 1: Query connections for label
      const stmt = db.prepare(`
        SELECT id, label_id, platform, account_name, account_id,
               health_status, access_token_encrypted, token_expires_at,
               created_at, updated_at
        FROM social_connections
        WHERE label_id = ?
        ORDER BY platform ASC, created_at DESC
      `);
      const rows = stmt.all(labelId) as unknown as SqliteConnectionRow[];
      return rows.map(mapRowToRecord);
    },

    updateConnectionHealth: async (
      id: string,
      updates: UpdateConnectionHealthInput
    ): Promise<SocialConnectionRecord> => {
      // Step 1: Verify existence
      const checkStmt = db.prepare(`SELECT id FROM social_connections WHERE id = ?`);
      const existing = checkStmt.get(id);
      if (!existing) {
        throw new Error(`Social connection with id ${id} not found`);
      }

      // Step 2: Update health status and tokens
      const stmt = db.prepare(`
        UPDATE social_connections
        SET health_status = ?,
            access_token_encrypted = COALESCE(?, access_token_encrypted),
            token_expires_at = COALESCE(?, token_expires_at),
            updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(updates.healthStatus, updates.accessTokenEncrypted ?? null, updates.tokenExpiresAt ?? null, id);

      // Step 3: Fetch updated record
      const selectStmt = db.prepare(`
        SELECT id, label_id, platform, account_name, account_id,
               health_status, access_token_encrypted, token_expires_at,
               created_at, updated_at
        FROM social_connections
        WHERE id = ?
      `);
      const row = selectStmt.get(id) as unknown as SqliteConnectionRow;
      return mapRowToRecord(row);
    },

    deleteConnection: async (id: string): Promise<boolean> => {
      // Step 1: Execute deletion
      const stmt = db.prepare(`DELETE FROM social_connections WHERE id = ?`);
      const result = stmt.run(id);
      return Number(result.changes) > 0;
    },
  };
}
