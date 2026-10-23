/**
 * @file sqlite-label-repository.ts
 * @layer Infrastructure
 * @description SQLite relational persistence repository for Label entities with JSON field transformation.
 */

import { DatabaseSync } from 'node:sqlite';
import {
  LabelProfile,
  LabelProfileSchema,
  UpdateLabelInput,
} from '../../../pipelines/brand-vault/brand-schemas';

interface LabelRow {
  id: string;
  name: string;
  country: string | null;
  bio: string | null;
  color_palette: string | null;
  typography: string | null;
  tone_of_voice: string | null;
  social_links: string | null;
  created_at: string;
  updated_at: string;
}

export class SqliteLabelRepository {
  private db: DatabaseSync;

  /**
   * Initializes SqliteLabelRepository with a native SQLite database instance.
   *
   * @param db - DatabaseSync instance
   */
  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /**
   * Maps a database row into a validated domain LabelProfile entity.
   *
   * @private
   * @param row - LabelRow from SQLite
   * @returns Validated LabelProfile
   */
  private rowToEntity(row: LabelRow): LabelProfile {
    return LabelProfileSchema.parse({
      id: row.id,
      name: row.name,
      legalName: row.country || undefined,
      bio: row.bio || '',
      colorPalette: row.color_palette ? JSON.parse(row.color_palette) : undefined,
      typography: row.typography ? JSON.parse(row.typography) : undefined,
      toneOfVoice: row.tone_of_voice || '',
      socialLinks: row.social_links ? JSON.parse(row.social_links) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * Inserts a new Label entity into SQLite.
   *
   * @param label - Validated LabelProfile entity
   */
  async create(label: LabelProfile): Promise<void> {
    const validated = LabelProfileSchema.parse(label);
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO labels (
        id, name, country, bio, color_palette, typography, tone_of_voice, social_links, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.id,
      validated.name,
      validated.legalName || null,
      validated.bio,
      JSON.stringify(validated.colorPalette),
      JSON.stringify(validated.typography),
      validated.toneOfVoice,
      JSON.stringify(validated.socialLinks),
      validated.createdAt || now,
      validated.updatedAt || now
    );
  }

  /**
   * Finds a Label by unique UUID.
   *
   * @param id - Label UUID
   * @returns LabelProfile or null if not found
   */
  async findById(id: string): Promise<LabelProfile | null> {
    const stmt = this.db.prepare('SELECT * FROM labels WHERE id = ?');
    const row = stmt.get(id) as LabelRow | undefined;
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Retrieves all Label profiles.
   *
   * @returns Array of LabelProfile domain entities
   */
  async findAll(): Promise<LabelProfile[]> {
    const stmt = this.db.prepare('SELECT * FROM labels ORDER BY name ASC');
    const rows = stmt.all() as unknown as LabelRow[];
    return rows.map(r => this.rowToEntity(r));
  }

  /**
   * Updates an existing Label's fields.
   *
   * @param id - Target Label UUID
   * @param input - Partial update fields
   * @returns Updated LabelProfile or null if not found
   */
  async update(id: string, input: Partial<LabelProfile>): Promise<LabelProfile | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = LabelProfileSchema.parse({
      ...existing,
      ...input,
      id,
      updatedAt: new Date().toISOString(),
    });

    const stmt = this.db.prepare(`
      UPDATE labels SET
        name = ?,
        country = ?,
        bio = ?,
        color_palette = ?,
        typography = ?,
        tone_of_voice = ?,
        social_links = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.name,
      merged.legalName || null,
      merged.bio,
      JSON.stringify(merged.colorPalette),
      JSON.stringify(merged.typography),
      merged.toneOfVoice,
      JSON.stringify(merged.socialLinks),
      merged.updatedAt || new Date().toISOString(),
      id
    );

    return merged;
  }

  /**
   * Deletes a Label by ID (cascading deletes to nested Artists via FK).
   *
   * @param id - Target Label UUID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM labels WHERE id = ?');
    const result = stmt.run(id);
    return Number(result.changes) > 0;
  }
}
