/**
 * @file sqlite-creative-asset-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for Creative Assets, Deliverable linkage,
 *              aspect ratios, and SHA-256 integrity hashes. Pure functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';

export type AssetFormat = 'COVER_1_1' | 'STORY_9_16' | 'BANNER_16_9' | 'SOCIAL_COPY';
export type AssetAspectRatio = 'SQUARE_1_1' | 'PORTRAIT_9_16' | 'LANDSCAPE_16_9' | 'NA';
export type AssetStatus = 'DRAFT' | 'APPROVED' | 'REJECTED' | 'DISCARDED';

/**
 * Persisted relational representation of a Creative Asset.
 */
export interface CreativeAssetRecord {
  id: string;
  releaseId: string;
  batchId?: string | null;
  deliverableId?: string | null;
  promptId?: string | null;
  format: AssetFormat;
  aspectRatio: AssetAspectRatio;
  width: number;
  height: number;
  storagePath: string;
  contentHash: string;
  mimeType: string;
  fileSizeBytes: number;
  status: AssetStatus;
  metadataJson?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Input DTO for creating a new creative asset.
 */
export interface CreateAssetInput {
  id: string;
  releaseId: string;
  batchId?: string | null;
  deliverableId?: string | null;
  promptId?: string | null;
  format: AssetFormat;
  aspectRatio: AssetAspectRatio;
  width: number;
  height: number;
  storagePath: string;
  contentHash: string;
  mimeType: string;
  fileSizeBytes: number;
  status?: AssetStatus;
  metadataJson?: string | null;
}

/**
 * Filter options for querying creative assets.
 */
export interface AssetFilter {
  format?: AssetFormat;
  status?: AssetStatus;
  batchId?: string;
}

/**
 * Functional repository contract for creative asset management.
 */
export interface CreativeAssetRepository {
  createAsset: (input: CreateAssetInput) => Promise<CreativeAssetRecord>;
  getAssetById: (id: string) => Promise<CreativeAssetRecord | null>;
  getAssetByContentHash: (contentHash: string) => Promise<CreativeAssetRecord | null>;
  listAssetsByReleaseId: (releaseId: string, filter?: AssetFilter) => Promise<CreativeAssetRecord[]>;
  updateAssetStatus: (id: string, status: AssetStatus, deliverableId?: string | null) => Promise<CreativeAssetRecord>;
  deleteAsset: (id: string) => Promise<boolean>;
}

interface SqliteAssetRow {
  id: string;
  release_id: string;
  batch_id: string | null;
  deliverable_id: string | null;
  prompt_id: string | null;
  format: AssetFormat;
  aspect_ratio: AssetAspectRatio;
  width: number;
  height: number;
  storage_path: string;
  content_hash: string;
  mime_type: string;
  file_size_bytes: number;
  status: AssetStatus;
  metadata_json: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToRecord(row: SqliteAssetRow): CreativeAssetRecord {
  return {
    id: row.id,
    releaseId: row.release_id,
    batchId: row.batch_id,
    deliverableId: row.deliverable_id,
    promptId: row.prompt_id,
    format: row.format,
    aspectRatio: row.aspect_ratio,
    width: row.width,
    height: row.height,
    storagePath: row.storage_path,
    contentHash: row.content_hash,
    mimeType: row.mime_type,
    fileSizeBytes: row.file_size_bytes,
    status: row.status,
    metadataJson: row.metadata_json,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Functional factory instantiating the SQLite Creative Asset Repository.
 *
 * @param db - Native DatabaseSync instance
 * @returns Fully typed CreativeAssetRepository implementation
 */
export function createCreativeAssetRepository(db: DatabaseSync): CreativeAssetRepository {
  return {
    createAsset: async (input: CreateAssetInput): Promise<CreativeAssetRecord> => {
      // Step 1: Insert record
      const stmt = db.prepare(`
        INSERT INTO creative_assets (
          id, release_id, batch_id, deliverable_id, prompt_id,
          format, aspect_ratio, width, height, storage_path,
          content_hash, mime_type, file_size_bytes, status, metadata_json,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?,
          datetime('now'), datetime('now')
        )
      `);

      stmt.run(
        input.id,
        input.releaseId,
        input.batchId ?? null,
        input.deliverableId ?? null,
        input.promptId ?? null,
        input.format,
        input.aspectRatio,
        input.width,
        input.height,
        input.storagePath,
        input.contentHash,
        input.mimeType,
        input.fileSizeBytes,
        input.status ?? 'DRAFT',
        input.metadataJson ?? null
      );

      // Step 2: Fetch created record
      const selectStmt = db.prepare(`
        SELECT id, release_id, batch_id, deliverable_id, prompt_id,
               format, aspect_ratio, width, height, storage_path,
               content_hash, mime_type, file_size_bytes, status, metadata_json,
               created_at, updated_at
        FROM creative_assets
        WHERE id = ?
      `);
      const row = selectStmt.get(input.id) as unknown as SqliteAssetRow | undefined;
      if (!row) {
        throw new Error(`Failed to create creative asset: record not found for id ${input.id}`);
      }
      return mapRowToRecord(row);
    },

    getAssetById: async (id: string): Promise<CreativeAssetRecord | null> => {
      // Step 1: Query by ID
      const stmt = db.prepare(`
        SELECT id, release_id, batch_id, deliverable_id, prompt_id,
               format, aspect_ratio, width, height, storage_path,
               content_hash, mime_type, file_size_bytes, status, metadata_json,
               created_at, updated_at
        FROM creative_assets
        WHERE id = ?
      `);
      const row = stmt.get(id) as unknown as SqliteAssetRow | undefined;
      if (!row) return null;
      return mapRowToRecord(row);
    },

    getAssetByContentHash: async (contentHash: string): Promise<CreativeAssetRecord | null> => {
      // Step 1: Query by SHA-256 hash
      const stmt = db.prepare(`
        SELECT id, release_id, batch_id, deliverable_id, prompt_id,
               format, aspect_ratio, width, height, storage_path,
               content_hash, mime_type, file_size_bytes, status, metadata_json,
               created_at, updated_at
        FROM creative_assets
        WHERE content_hash = ?
      `);
      const row = stmt.get(contentHash) as unknown as SqliteAssetRow | undefined;
      if (!row) return null;
      return mapRowToRecord(row);
    },

    listAssetsByReleaseId: async (releaseId: string, filter?: AssetFilter): Promise<CreativeAssetRecord[]> => {
      // Step 1: Prepare dynamic query based on filters
      const conditions: string[] = ['release_id = ?'];
      const values: string[] = [releaseId];

      if (filter?.format) {
        conditions.push('format = ?');
        values.push(filter.format);
      }
      if (filter?.status) {
        conditions.push('status = ?');
        values.push(filter.status);
      }
      if (filter?.batchId) {
        conditions.push('batch_id = ?');
        values.push(filter.batchId);
      }

      const sql = `
        SELECT id, release_id, batch_id, deliverable_id, prompt_id,
               format, aspect_ratio, width, height, storage_path,
               content_hash, mime_type, file_size_bytes, status, metadata_json,
               created_at, updated_at
        FROM creative_assets
        WHERE ${conditions.join(' AND ')}
        ORDER BY created_at DESC
      `;
      const rows = db.prepare(sql).all(...values) as unknown as SqliteAssetRow[];
      return rows.map(mapRowToRecord);
    },

    updateAssetStatus: async (
      id: string,
      status: AssetStatus,
      deliverableId?: string | null
    ): Promise<CreativeAssetRecord> => {
      // Step 1: Verify existence
      const checkStmt = db.prepare(`SELECT id FROM creative_assets WHERE id = ?`);
      const existing = checkStmt.get(id);
      if (!existing) {
        throw new Error(`Creative asset with id ${id} not found`);
      }

      // Step 2: Update status and optional deliverable link
      if (deliverableId !== undefined) {
        const stmt = db.prepare(`
          UPDATE creative_assets
          SET status = ?, deliverable_id = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        stmt.run(status, deliverableId, id);
      } else {
        const stmt = db.prepare(`
          UPDATE creative_assets
          SET status = ?, updated_at = datetime('now')
          WHERE id = ?
        `);
        stmt.run(status, id);
      }

      // Step 3: Fetch updated record
      const fetchStmt = db.prepare(`
        SELECT id, release_id, batch_id, deliverable_id, prompt_id,
               format, aspect_ratio, width, height, storage_path,
               content_hash, mime_type, file_size_bytes, status, metadata_json,
               created_at, updated_at
        FROM creative_assets
        WHERE id = ?
      `);
      const row = fetchStmt.get(id) as unknown as SqliteAssetRow;
      return mapRowToRecord(row);
    },

    deleteAsset: async (id: string): Promise<boolean> => {
      // Step 1: Execute deletion
      const stmt = db.prepare(`DELETE FROM creative_assets WHERE id = ?`);
      const result = stmt.run(id);
      return Number(result.changes) > 0;
    },
  };
}
