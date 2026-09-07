/**
 * @file sqlite-artist-repository.ts
 * @layer Infrastructure
 * @description SQLite relational persistence repository for Artist entities with JSON field transformation and FK validation.
 */

import { DatabaseSync } from 'node:sqlite';
import {
  ArtistProfile,
  ArtistProfileSchema,
} from '../../../pipelines/brand-vault/brand-schemas';

interface ArtistRow {
  id: string;
  label_id: string;
  name: string;
  bio: string | null;
  genre: string | null;
  subgenres: string | null;
  color_palette: string | null;
  typography: string | null;
  tone_of_voice: string | null;
  social_links: string | null;
  created_at: string;
  updated_at: string;
}

export class SqliteArtistRepository {
  private db: DatabaseSync;

  /**
   * Initializes SqliteArtistRepository with a native SQLite database instance.
   *
   * @param db - DatabaseSync instance
   */
  constructor(db: DatabaseSync) {
    this.db = db;
  }

  /**
   * Maps a database row into a validated domain ArtistProfile entity.
   *
   * @private
   * @param row - ArtistRow from SQLite
   * @returns Validated ArtistProfile
   */
  private rowToEntity(row: ArtistRow): ArtistProfile {
    return ArtistProfileSchema.parse({
      id: row.id,
      labelId: row.label_id,
      name: row.name,
      bio: row.bio || '',
      genre: row.genre || 'Indie',
      subgenres: row.subgenres ? JSON.parse(row.subgenres) : [],
      colorPalette: row.color_palette ? JSON.parse(row.color_palette) : undefined,
      typography: row.typography ? JSON.parse(row.typography) : undefined,
      toneOfVoice: row.tone_of_voice || '',
      socialLinks: row.social_links ? JSON.parse(row.social_links) : undefined,
      createdAt: row.created_at,
      updatedAt: row.updated_at,
    });
  }

  /**
   * Inserts a new Artist entity into SQLite.
   *
   * @param artist - Validated ArtistProfile entity
   */
  async create(artist: ArtistProfile): Promise<void> {
    const validated = ArtistProfileSchema.parse(artist);
    const now = new Date().toISOString();

    const stmt = this.db.prepare(`
      INSERT INTO artists (
        id, label_id, name, bio, genre, subgenres, color_palette, typography, tone_of_voice, social_links, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `);

    stmt.run(
      validated.id,
      validated.labelId,
      validated.name,
      validated.bio,
      validated.genre,
      JSON.stringify(validated.subgenres),
      JSON.stringify(validated.colorPalette),
      JSON.stringify(validated.typography),
      validated.toneOfVoice,
      JSON.stringify(validated.socialLinks),
      validated.createdAt || now,
      validated.updatedAt || now
    );
  }

  /**
   * Finds an Artist by unique UUID.
   *
   * @param id - Artist UUID
   * @returns ArtistProfile or null if not found
   */
  async findById(id: string): Promise<ArtistProfile | null> {
    const stmt = this.db.prepare('SELECT * FROM artists WHERE id = ?');
    const row = stmt.get(id) as ArtistRow | undefined;
    return row ? this.rowToEntity(row) : null;
  }

  /**
   * Retrieves all Artists affiliated with a specific Label.
   *
   * @param labelId - Label UUID
   * @returns Array of ArtistProfile entities
   */
  async findByLabelId(labelId: string): Promise<ArtistProfile[]> {
    const stmt = this.db.prepare('SELECT * FROM artists WHERE label_id = ? ORDER BY name ASC');
    const rows = stmt.all(labelId) as unknown as ArtistRow[];
    return rows.map(r => this.rowToEntity(r));
  }

  /**
   * Retrieves all Artist profiles.
   *
   * @returns Array of ArtistProfile entities
   */
  async findAll(): Promise<ArtistProfile[]> {
    const stmt = this.db.prepare('SELECT * FROM artists ORDER BY name ASC');
    const rows = stmt.all() as unknown as ArtistRow[];
    return rows.map(r => this.rowToEntity(r));
  }

  /**
   * Updates an existing Artist profile.
   *
   * @param id - Target Artist UUID
   * @param input - Partial update fields
   * @returns Updated ArtistProfile or null if not found
   */
  async update(id: string, input: Partial<ArtistProfile>): Promise<ArtistProfile | null> {
    const existing = await this.findById(id);
    if (!existing) return null;

    const merged = ArtistProfileSchema.parse({
      ...existing,
      ...input,
      id,
      labelId: existing.labelId,
      updatedAt: new Date().toISOString(),
    });

    const stmt = this.db.prepare(`
      UPDATE artists SET
        name = ?,
        bio = ?,
        genre = ?,
        subgenres = ?,
        color_palette = ?,
        typography = ?,
        tone_of_voice = ?,
        social_links = ?,
        updated_at = ?
      WHERE id = ?
    `);

    stmt.run(
      merged.name,
      merged.bio,
      merged.genre,
      JSON.stringify(merged.subgenres),
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
   * Deletes an Artist by ID.
   *
   * @param id - Target Artist UUID
   * @returns True if deleted, false if not found
   */
  async delete(id: string): Promise<boolean> {
    const stmt = this.db.prepare('DELETE FROM artists WHERE id = ?');
    const result = stmt.run(id);
    return Number(result.changes) > 0;
  }
}
