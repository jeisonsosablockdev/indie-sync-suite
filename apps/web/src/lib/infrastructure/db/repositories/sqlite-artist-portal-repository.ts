/**
 * @file sqlite-artist-portal-repository.ts
 * @layer Infrastructure
 * @description Pure functional SQLite repository managing Artist Portal sessions, Magic Link token
 *              hashes, and deliverable reviews using native node:sqlite DatabaseSync. Zero classes.
 */

import { DatabaseSync } from 'node:sqlite';
import {
  ArtistPortalSession,
  PortalDeliverableReview,
} from '../../../pipelines/portal/portal-schemas';

export interface ArtistPortalRepository {
  createSession: (session: ArtistPortalSession) => void;
  getSessionByTokenHash: (tokenHash: string) => ArtistPortalSession | null;
  revokeSession: (sessionId: string) => void;
  recordReview: (review: PortalDeliverableReview) => void;
  getReviewsForSession: (sessionId: string) => PortalDeliverableReview[];
  getReviewsForDeliverable: (deliverableId: string) => PortalDeliverableReview[];
}

interface RawPortalSessionRow {
  id: string;
  release_id: string;
  artist_id: string;
  token_hash: string;
  expires_at: string;
  revoked_at: string | null;
  created_at: string;
}

interface RawPortalReviewRow {
  id: string;
  session_id: string;
  deliverable_id: string;
  decision: string;
  feedback_text: string | null;
  created_at: string;
}

/**
 * Functional factory instantiating the ArtistPortalRepository using native DatabaseSync.
 *
 * @param db - Native node:sqlite DatabaseSync connection instance
 * @returns Fully typed ArtistPortalRepository API
 */
export function createArtistPortalRepository(db: DatabaseSync): ArtistPortalRepository {
  // Step 1: Prepare reusable SQL statements
  const insertSessionStmt = db.prepare(`
    INSERT INTO artist_portal_sessions (id, release_id, artist_id, token_hash, expires_at, revoked_at, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const selectSessionByHashStmt = db.prepare(`
    SELECT id, release_id, artist_id, token_hash, expires_at, revoked_at, created_at
    FROM artist_portal_sessions
    WHERE token_hash = ?
  `);

  const revokeSessionStmt = db.prepare(`
    UPDATE artist_portal_sessions
    SET revoked_at = datetime('now')
    WHERE id = ?
  `);

  const insertReviewStmt = db.prepare(`
    INSERT INTO portal_deliverable_reviews (id, session_id, deliverable_id, decision, feedback_text, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  const selectReviewsBySessionStmt = db.prepare(`
    SELECT id, session_id, deliverable_id, decision, feedback_text, created_at
    FROM portal_deliverable_reviews
    WHERE session_id = ?
    ORDER BY created_at DESC
  `);

  const selectReviewsByDeliverableStmt = db.prepare(`
    SELECT id, session_id, deliverable_id, decision, feedback_text, created_at
    FROM portal_deliverable_reviews
    WHERE deliverable_id = ?
    ORDER BY created_at DESC
  `);

  return {
    createSession: (session: ArtistPortalSession): void => {
      // Step 2: Insert session record
      insertSessionStmt.run(
        session.id,
        session.releaseId,
        session.artistId,
        session.tokenHash,
        session.expiresAt,
        session.revokedAt ?? null,
        session.createdAt ?? new Date().toISOString()
      );
    },

    getSessionByTokenHash: (tokenHash: string): ArtistPortalSession | null => {
      // Step 3: Query session by hashed token
      const row = selectSessionByHashStmt.get(tokenHash) as RawPortalSessionRow | undefined;
      if (!row) {
        return null;
      }

      return {
        id: row.id,
        releaseId: row.release_id,
        artistId: row.artist_id,
        tokenHash: row.token_hash,
        expiresAt: row.expires_at,
        revokedAt: row.revoked_at,
        createdAt: row.created_at,
      };
    },

    revokeSession: (sessionId: string): void => {
      // Step 4: Revoke session immediately
      revokeSessionStmt.run(sessionId);
    },

    recordReview: (review: PortalDeliverableReview): void => {
      // Step 5: Record artist decision and feedback
      insertReviewStmt.run(
        review.id,
        review.sessionId,
        review.deliverableId,
        review.decision,
        review.feedbackText ?? null,
        review.createdAt ?? new Date().toISOString()
      );
    },

    getReviewsForSession: (sessionId: string): PortalDeliverableReview[] => {
      // Step 6: Retrieve reviews performed within session
      const rows = selectReviewsBySessionStmt.all(sessionId) as unknown as RawPortalReviewRow[];
      return rows.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        deliverableId: r.deliverable_id,
        decision: r.decision as 'APPROVED' | 'CHANGES_REQUESTED',
        feedbackText: r.feedback_text ?? undefined,
        createdAt: r.created_at,
      }));
    },

    getReviewsForDeliverable: (deliverableId: string): PortalDeliverableReview[] => {
      // Step 7: Retrieve history of reviews for a deliverable
      const rows = selectReviewsByDeliverableStmt.all(deliverableId) as unknown as RawPortalReviewRow[];
      return rows.map((r) => ({
        id: r.id,
        sessionId: r.session_id,
        deliverableId: r.deliverable_id,
        decision: r.decision as 'APPROVED' | 'CHANGES_REQUESTED',
        feedbackText: r.feedback_text ?? undefined,
        createdAt: r.created_at,
      }));
    },
  };
}
