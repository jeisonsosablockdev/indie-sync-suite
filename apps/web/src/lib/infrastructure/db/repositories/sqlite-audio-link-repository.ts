/**
 * @file sqlite-audio-link-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for External Audio Links with auto-milestone synchronization.
 *              Strict functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';
import {
  ExternalAudioLink,
  CreateAudioLinkInput,
  VerificationStatus,
} from '../../../pipelines/planner/audio-link-schemas';

export interface AudioLinkRepository {
  findLinksByReleaseId: (releaseId: string) => Promise<ExternalAudioLink[]>;
  findLinkById: (id: string) => Promise<ExternalAudioLink | null>;
  upsertLink: (input: CreateAudioLinkInput) => Promise<ExternalAudioLink>;
  updateVerificationStatus: (
    id: string,
    status: VerificationStatus,
    meta?: { mimeType?: string | null; fileSizeBytes?: number | null }
  ) => Promise<ExternalAudioLink>;
  deleteLink: (id: string) => Promise<void>;
}

export function createAudioLinkRepository(db: DatabaseSync): AudioLinkRepository {
  return {
    findLinksByReleaseId: async (releaseId: string): Promise<ExternalAudioLink[]> => {
      // Step 1: Query all audio links for release ordered by category
      const stmt = db.prepare(`
        SELECT id, release_id as releaseId, category, url,
               verified_status as verifiedStatus, verified_at as verifiedAt,
               mime_type as mimeType, file_size_bytes as fileSizeBytes,
               created_at as createdAt, updated_at as updatedAt
        FROM external_audio_links
        WHERE release_id = ?
        ORDER BY category ASC
      `);
      return stmt.all(releaseId) as any as ExternalAudioLink[];
    },

    findLinkById: async (id: string): Promise<ExternalAudioLink | null> => {
      // Step 1: Query audio link by ID
      const stmt = db.prepare(`
        SELECT id, release_id as releaseId, category, url,
               verified_status as verifiedStatus, verified_at as verifiedAt,
               mime_type as mimeType, file_size_bytes as fileSizeBytes,
               created_at as createdAt, updated_at as updatedAt
        FROM external_audio_links
        WHERE id = ?
      `);
      const row = stmt.get(id) as any;
      if (!row) return null;
      return row as ExternalAudioLink;
    },

    upsertLink: async (input: CreateAudioLinkInput): Promise<ExternalAudioLink> => {
      const linkId = crypto.randomUUID();

      // Step 1: Atomic upsert relying on unique index (release_id, category)
      const stmt = db.prepare(`
        INSERT INTO external_audio_links (
          id, release_id, provider, category, url, verified_status, verified_at,
          mime_type, file_size_bytes, created_at, updated_at
        ) VALUES (
          ?, ?, 'cloud', ?, ?, 'UNVERIFIED', NULL, NULL, NULL, datetime('now'), datetime('now')
        )
        ON CONFLICT(release_id, category) DO UPDATE SET
          url = excluded.url,
          verified_status = 'UNVERIFIED',
          verified_at = NULL,
          mime_type = NULL,
          file_size_bytes = NULL,
          updated_at = datetime('now')
      `);

      stmt.run(linkId, input.releaseId, input.category, input.url);

      // Step 2: Fetch and return current record
      const fetchStmt = db.prepare(`
        SELECT id, release_id as releaseId, category, url,
               verified_status as verifiedStatus, verified_at as verifiedAt,
               mime_type as mimeType, file_size_bytes as fileSizeBytes,
               created_at as createdAt, updated_at as updatedAt
        FROM external_audio_links
        WHERE release_id = ? AND category = ?
      `);
      return fetchStmt.get(input.releaseId, input.category) as any as ExternalAudioLink;
    },

    updateVerificationStatus: async (
      id: string,
      status: VerificationStatus,
      meta?: { mimeType?: string | null; fileSizeBytes?: number | null }
    ): Promise<ExternalAudioLink> => {
      // Step 1: Update status and verification timestamp
      const verifiedAt = status === 'VERIFIED' ? new Date().toISOString() : null;
      const stmt = db.prepare(`
        UPDATE external_audio_links
        SET verified_status = ?,
            verified_at = ?,
            mime_type = COALESCE(?, mime_type),
            file_size_bytes = COALESCE(?, file_size_bytes),
            updated_at = datetime('now')
        WHERE id = ?
      `);
      stmt.run(status, verifiedAt, meta?.mimeType ?? null, meta?.fileSizeBytes ?? null, id);

      // Step 2: Invariant Check & Milestone Auto-completion
      // If MASTER_WAV is VERIFIED, automatically check for master gatekeeper tasks and transition to DONE
      if (status === 'VERIFIED') {
        const link = await createAudioLinkRepository(db).findLinkById(id);
        if (link && link.category === 'MASTER_WAV') {
          const autoDoneStmt = db.prepare(`
            UPDATE release_tasks
            SET status = 'DONE',
                updated_at = datetime('now')
            WHERE release_id = ?
              AND is_gatekeeper = 1
              AND (LOWER(title) LIKE '%master%' OR LOWER(title) LIKE '%audio%')
              AND status != 'DONE'
          `);
          autoDoneStmt.run(link.releaseId);
        }
      }

      return (await createAudioLinkRepository(db).findLinkById(id))!;
    },

    deleteLink: async (id: string): Promise<void> => {
      const stmt = db.prepare('DELETE FROM external_audio_links WHERE id = ?');
      stmt.run(id);
    },
  };
}
