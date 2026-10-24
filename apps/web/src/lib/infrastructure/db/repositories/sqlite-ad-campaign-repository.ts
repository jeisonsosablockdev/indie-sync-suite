/**
 * @file sqlite-ad-campaign-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for micro-budget programmatic ad campaigns ($20–$100 USD)
 *              on Meta and TikTok Ads. Pure functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';

export type AdPlatform = 'META_ADS' | 'TIKTOK_ADS';
export type AdCampaignStatus = 'DRAFT' | 'PENDING_APPROVAL' | 'ACTIVE' | 'COMPLETED' | 'FAILED';

export interface AdCampaignRecord {
  id: string;
  releaseId: string;
  platform: AdPlatform;
  budgetUsd: number;
  destinationUrl: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  status: AdCampaignStatus;
  externalCampaignId?: string | null;
  createdAt: string;
  updatedAt: string;
}

export interface CreateAdCampaignInput {
  id: string;
  releaseId: string;
  platform: AdPlatform;
  budgetUsd: number;
  destinationUrl: string;
  targetAudience: string;
  startDate: string;
  endDate: string;
  status?: AdCampaignStatus;
  externalCampaignId?: string | null;
}

export interface UpdateCampaignStatusInput {
  status: AdCampaignStatus;
  externalCampaignId?: string | null;
}

export interface AdCampaignRepository {
  createCampaign: (input: CreateAdCampaignInput) => Promise<AdCampaignRecord>;
  getCampaignById: (id: string) => Promise<AdCampaignRecord | null>;
  listCampaignsByReleaseId: (releaseId: string) => Promise<AdCampaignRecord[]>;
  updateCampaignStatus: (id: string, updates: UpdateCampaignStatusInput) => Promise<AdCampaignRecord>;
  deleteCampaign: (id: string) => Promise<boolean>;
}

interface SqliteCampaignRow {
  id: string;
  release_id: string;
  platform: AdPlatform;
  budget_usd: number;
  destination_url: string;
  target_audience: string;
  start_date: string;
  end_date: string;
  status: AdCampaignStatus;
  external_campaign_id: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToRecord(row: SqliteCampaignRow): AdCampaignRecord {
  return {
    id: row.id,
    releaseId: row.release_id,
    platform: row.platform,
    budgetUsd: row.budget_usd,
    destinationUrl: row.destination_url,
    targetAudience: row.target_audience,
    startDate: row.start_date,
    endDate: row.end_date,
    status: row.status,
    externalCampaignId: row.external_campaign_id,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Functional factory instantiating the SQLite Ad Campaign Repository.
 *
 * @param db - Native DatabaseSync instance
 * @returns Fully typed AdCampaignRepository implementation
 */
export function createAdCampaignRepository(db: DatabaseSync): AdCampaignRepository {
  return {
    createCampaign: async (input: CreateAdCampaignInput): Promise<AdCampaignRecord> => {
      // Step 1: Validate invariant budget range ($20 to $100 USD)
      if (input.budgetUsd < 20 || input.budgetUsd > 100) {
        throw new Error(`Budget USD must be between $20.00 and $100.00, received: ${input.budgetUsd}`);
      }

      // Step 2: Insert campaign record
      const stmt = db.prepare(`
        INSERT INTO ad_campaigns (
          id, release_id, platform, budget_usd, destination_url,
          target_audience, start_date, end_date, status,
          external_campaign_id, created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?,
          ?, datetime('now'), datetime('now')
        )
      `);

      stmt.run(
        input.id,
        input.releaseId,
        input.platform,
        input.budgetUsd,
        input.destinationUrl,
        input.targetAudience,
        input.startDate,
        input.endDate,
        input.status ?? 'DRAFT',
        input.externalCampaignId ?? null
      );

      // Step 3: Fetch and return created record
      const selectStmt = db.prepare(`
        SELECT id, release_id, platform, budget_usd, destination_url,
               target_audience, start_date, end_date, status,
               external_campaign_id, created_at, updated_at
        FROM ad_campaigns
        WHERE id = ?
      `);
      const row = selectStmt.get(input.id) as unknown as SqliteCampaignRow | undefined;
      if (!row) {
        throw new Error(`Failed to create ad campaign with id: ${input.id}`);
      }
      return mapRowToRecord(row);
    },

    getCampaignById: async (id: string): Promise<AdCampaignRecord | null> => {
      // Step 1: Query campaign by id
      const stmt = db.prepare(`
        SELECT id, release_id, platform, budget_usd, destination_url,
               target_audience, start_date, end_date, status,
               external_campaign_id, created_at, updated_at
        FROM ad_campaigns
        WHERE id = ?
      `);
      const row = stmt.get(id) as unknown as SqliteCampaignRow | undefined;
      if (!row) return null;
      return mapRowToRecord(row);
    },

    listCampaignsByReleaseId: async (releaseId: string): Promise<AdCampaignRecord[]> => {
      // Step 1: Query campaigns for release ordered chronologically
      const stmt = db.prepare(`
        SELECT id, release_id, platform, budget_usd, destination_url,
               target_audience, start_date, end_date, status,
               external_campaign_id, created_at, updated_at
        FROM ad_campaigns
        WHERE release_id = ?
        ORDER BY start_date ASC, created_at DESC
      `);
      const rows = stmt.all(releaseId) as unknown as SqliteCampaignRow[];
      return rows.map(mapRowToRecord);
    },

    updateCampaignStatus: async (
      id: string,
      updates: UpdateCampaignStatusInput
    ): Promise<AdCampaignRecord> => {
      // Step 1: Verify existence
      const checkStmt = db.prepare(`SELECT id FROM ad_campaigns WHERE id = ?`);
      const existing = checkStmt.get(id);
      if (!existing) {
        throw new Error(`Ad campaign with id ${id} not found`);
      }

      // Step 2: Update status and external ID
      const stmt = db.prepare(`
        UPDATE ad_campaigns
        SET status = ?,
            external_campaign_id = COALESCE(?, external_campaign_id),
            updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(updates.status, updates.externalCampaignId ?? null, id);

      // Step 3: Fetch updated record
      const selectStmt = db.prepare(`
        SELECT id, release_id, platform, budget_usd, destination_url,
               target_audience, start_date, end_date, status,
               external_campaign_id, created_at, updated_at
        FROM ad_campaigns
        WHERE id = ?
      `);
      const row = selectStmt.get(id) as unknown as SqliteCampaignRow;
      return mapRowToRecord(row);
    },

    deleteCampaign: async (id: string): Promise<boolean> => {
      // Step 1: Execute deletion
      const stmt = db.prepare(`DELETE FROM ad_campaigns WHERE id = ?`);
      const result = stmt.run(id);
      return Number(result.changes) > 0;
    },
  };
}
