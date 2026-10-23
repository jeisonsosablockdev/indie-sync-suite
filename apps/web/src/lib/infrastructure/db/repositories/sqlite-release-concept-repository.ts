/**
 * @file sqlite-release-concept-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for Release Concepts (Contexto Nivel 3) and immutable snapshot freeze.
 *              Functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';
import { ReleaseConcept } from '../../../pipelines/planner/planner-schemas';

export interface ReleaseConceptRepository {
  findByReleaseId: (releaseId: string) => Promise<ReleaseConcept | null>;
  upsert: (concept: Omit<ReleaseConcept, 'createdAt' | 'updatedAt'>) => Promise<ReleaseConcept>;
  freezeSnapshot: (releaseId: string) => Promise<void>;
}

export function createReleaseConceptRepository(db: DatabaseSync): ReleaseConceptRepository {
  return {
    findByReleaseId: async (releaseId: string): Promise<ReleaseConcept | null> => {
      const stmt = db.prepare(`
        SELECT id, release_id as releaseId, narrative, lyric_theme as lyricTheme,
               sound_mood as soundMood, isrc, upc, target_date as targetDate,
               budget_usd as budgetUsd, snapshot_frozen as snapshotFrozen,
               frozen_at as frozenAt, created_at as createdAt, updated_at as updatedAt
        FROM release_concepts
        WHERE release_id = ?
      `);
      const row = stmt.get(releaseId) as any;
      if (!row) return null;
      return {
        ...row,
        snapshotFrozen: Boolean(row.snapshotFrozen),
      };
    },

    upsert: async (concept): Promise<ReleaseConcept> => {
      // Step 1: Invariant check - cannot modify frozen concepts
      const checkStmt = db.prepare('SELECT snapshot_frozen FROM release_concepts WHERE release_id = ?');
      const existing = checkStmt.get(concept.releaseId) as any;
      if (existing && existing.snapshot_frozen === 1) {
        throw new Error('Cannot modify frozen release concept: El concepto de este lanzamiento ya ha sido congelado para producción.');
      }

      // Step 2: Atomic upsert
      const stmt = db.prepare(`
        INSERT INTO release_concepts (
          id, release_id, narrative, lyric_theme, sound_mood, isrc, upc,
          target_date, budget_usd, snapshot_frozen, frozen_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?, ?, ?,
          ?, ?, ?, ?, datetime('now')
        )
        ON CONFLICT(release_id) DO UPDATE SET
          narrative = excluded.narrative,
          lyric_theme = excluded.lyric_theme,
          sound_mood = excluded.sound_mood,
          isrc = excluded.isrc,
          upc = excluded.upc,
          target_date = excluded.target_date,
          budget_usd = excluded.budget_usd,
          updated_at = datetime('now')
      `);

      stmt.run(
        concept.id,
        concept.releaseId,
        concept.narrative,
        concept.lyricTheme,
        concept.soundMood,
        concept.isrc || null,
        concept.upc || null,
        concept.targetDate,
        concept.budgetUsd ?? 0,
        concept.snapshotFrozen ? 1 : 0,
        concept.frozenAt ?? null
      );

      return (await createReleaseConceptRepository(db).findByReleaseId(concept.releaseId))!;
    },

    freezeSnapshot: async (releaseId: string): Promise<void> => {
      // Step 1: Invariant check - concept must exist to be frozen
      const existing = await createReleaseConceptRepository(db).findByReleaseId(releaseId);
      if (!existing) {
        throw new Error(`Release concept not found: No se puede congelar un concepto inexistente para el release ${releaseId}.`);
      }

      const stmt = db.prepare(`
        UPDATE release_concepts
        SET snapshot_frozen = 1,
            frozen_at = datetime('now'),
            updated_at = datetime('now')
        WHERE release_id = ?
      `);
      stmt.run(releaseId);
    },
  };
}
