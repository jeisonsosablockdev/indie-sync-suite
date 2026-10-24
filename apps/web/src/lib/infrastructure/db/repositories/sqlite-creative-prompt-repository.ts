/**
 * @file sqlite-creative-prompt-repository.ts
 * @layer Infrastructure
 * @description SQLite repository for Creative Master Prompts, modular breakdown,
 *              platform presets, and version history. Pure functional factory pattern, zero classes.
 */

import { DatabaseSync } from 'node:sqlite';

export type PlatformPreset = 'MIDJOURNEY_V6' | 'FLUX_SD' | 'RUNWAY_KLING' | 'RAW_TEXT';
export type AspectRatio = 'SQUARE_1_1' | 'PORTRAIT_9_16' | 'LANDSCAPE_16_9';

/**
 * Persisted relational representation of a Creative Master Prompt.
 */
export interface CreativePromptRecord {
  id: string;
  releaseId: string;
  promptText: string;
  negativePrompt?: string | null;
  platformPreset: PlatformPreset;
  aspectRatio: AspectRatio;
  version: number;
  subject: string;
  palette?: string | null;
  lighting?: string | null;
  camera?: string | null;
  createdAt?: string;
  updatedAt?: string;
}

/**
 * Input DTO for creating a new creative master prompt.
 */
export interface CreatePromptInput {
  id: string;
  releaseId: string;
  promptText: string;
  negativePrompt?: string | null;
  platformPreset: PlatformPreset;
  aspectRatio: AspectRatio;
  version?: number;
  subject: string;
  palette?: string | null;
  lighting?: string | null;
  camera?: string | null;
}

/**
 * Input DTO for updating an existing creative prompt.
 */
export interface UpdatePromptInput {
  promptText?: string;
  negativePrompt?: string | null;
  platformPreset?: PlatformPreset;
  aspectRatio?: AspectRatio;
  version?: number;
  subject?: string;
  palette?: string | null;
  lighting?: string | null;
  camera?: string | null;
}

/**
 * Functional repository contract for creative prompt management.
 */
export interface CreativePromptRepository {
  createPrompt: (input: CreatePromptInput) => Promise<CreativePromptRecord>;
  getPromptById: (id: string) => Promise<CreativePromptRecord | null>;
  listPromptsByReleaseId: (releaseId: string) => Promise<CreativePromptRecord[]>;
  updatePrompt: (id: string, updates: UpdatePromptInput) => Promise<CreativePromptRecord>;
  deletePrompt: (id: string) => Promise<boolean>;
}

interface SqlitePromptRow {
  id: string;
  release_id: string;
  prompt_text: string;
  negative_prompt: string | null;
  platform_preset: PlatformPreset;
  aspect_ratio: AspectRatio;
  version: number;
  subject: string;
  palette: string | null;
  lighting: string | null;
  camera: string | null;
  created_at: string;
  updated_at: string;
}

function mapRowToRecord(row: SqlitePromptRow): CreativePromptRecord {
  return {
    id: row.id,
    releaseId: row.release_id,
    promptText: row.prompt_text,
    negativePrompt: row.negative_prompt,
    platformPreset: row.platform_preset,
    aspectRatio: row.aspect_ratio,
    version: row.version,
    subject: row.subject,
    palette: row.palette,
    lighting: row.lighting,
    camera: row.camera,
    createdAt: row.created_at,
    updatedAt: row.updated_at,
  };
}

/**
 * Functional factory instantiating the SQLite Creative Prompt Repository.
 *
 * @param db - Native DatabaseSync instance
 * @returns Fully typed CreativePromptRepository implementation
 */
export function createCreativePromptRepository(db: DatabaseSync): CreativePromptRepository {
  return {
    createPrompt: async (input: CreatePromptInput): Promise<CreativePromptRecord> => {
      // Step 1: Prepare insert statement
      const stmt = db.prepare(`
        INSERT INTO creative_prompts (
          id, release_id, prompt_text, negative_prompt, platform_preset,
          aspect_ratio, version, subject, palette, lighting, camera,
          created_at, updated_at
        ) VALUES (
          ?, ?, ?, ?, ?,
          ?, ?, ?, ?, ?, ?,
          datetime('now'), datetime('now')
        )
      `);

      // Step 2: Execute insertion
      stmt.run(
        input.id,
        input.releaseId,
        input.promptText,
        input.negativePrompt ?? null,
        input.platformPreset,
        input.aspectRatio,
        input.version ?? 1,
        input.subject,
        input.palette ?? null,
        input.lighting ?? null,
        input.camera ?? null
      );

      // Step 3: Fetch newly created record
      const selectStmt = db.prepare(`
        SELECT id, release_id, prompt_text, negative_prompt, platform_preset,
               aspect_ratio, version, subject, palette, lighting, camera,
               created_at, updated_at
        FROM creative_prompts
        WHERE id = ?
      `);
      const row = selectStmt.get(input.id) as unknown as SqlitePromptRow | undefined;
      if (!row) {
        throw new Error(`Failed to create creative prompt: record not found for id ${input.id}`);
      }
      return mapRowToRecord(row);
    },

    getPromptById: async (id: string): Promise<CreativePromptRecord | null> => {
      // Step 1: Query prompt by id
      const stmt = db.prepare(`
        SELECT id, release_id, prompt_text, negative_prompt, platform_preset,
               aspect_ratio, version, subject, palette, lighting, camera,
               created_at, updated_at
        FROM creative_prompts
        WHERE id = ?
      `);
      const row = stmt.get(id) as unknown as SqlitePromptRow | undefined;
      if (!row) return null;
      return mapRowToRecord(row);
    },

    listPromptsByReleaseId: async (releaseId: string): Promise<CreativePromptRecord[]> => {
      // Step 1: Query all prompts for given release
      const stmt = db.prepare(`
        SELECT id, release_id, prompt_text, negative_prompt, platform_preset,
               aspect_ratio, version, subject, palette, lighting, camera,
               created_at, updated_at
        FROM creative_prompts
        WHERE release_id = ?
        ORDER BY version DESC, created_at DESC
      `);
      const rows = stmt.all(releaseId) as unknown as SqlitePromptRow[];
      return rows.map(mapRowToRecord);
    },

    updatePrompt: async (id: string, updates: UpdatePromptInput): Promise<CreativePromptRecord> => {
      // Step 1: Verify prompt existence
      const checkStmt = db.prepare(`SELECT id, version FROM creative_prompts WHERE id = ?`);
      const existing = checkStmt.get(id) as unknown as { id: string; version: number } | undefined;
      if (!existing) {
        throw new Error(`Creative prompt with id ${id} not found`);
      }

      // Step 2: Build dynamic update statement
      const setClauses: string[] = ['updated_at = datetime(\'now\')'];
      const values: (string | number | null)[] = [];

      if (updates.promptText !== undefined) {
        setClauses.push('prompt_text = ?');
        values.push(updates.promptText);
      }
      if (updates.negativePrompt !== undefined) {
        setClauses.push('negative_prompt = ?');
        values.push(updates.negativePrompt);
      }
      if (updates.platformPreset !== undefined) {
        setClauses.push('platform_preset = ?');
        values.push(updates.platformPreset);
      }
      if (updates.aspectRatio !== undefined) {
        setClauses.push('aspect_ratio = ?');
        values.push(updates.aspectRatio);
      }
      if (updates.version !== undefined) {
        setClauses.push('version = ?');
        values.push(updates.version);
      } else {
        setClauses.push('version = version + 1');
      }
      if (updates.subject !== undefined) {
        setClauses.push('subject = ?');
        values.push(updates.subject);
      }
      if (updates.palette !== undefined) {
        setClauses.push('palette = ?');
        values.push(updates.palette);
      }
      if (updates.lighting !== undefined) {
        setClauses.push('lighting = ?');
        values.push(updates.lighting);
      }
      if (updates.camera !== undefined) {
        setClauses.push('camera = ?');
        values.push(updates.camera);
      }

      values.push(id);

      const updateSql = `
        UPDATE creative_prompts
        SET ${setClauses.join(', ')}
        WHERE id = ?
      `;
      db.prepare(updateSql).run(...values);

      // Step 3: Return updated record
      const fetchStmt = db.prepare(`
        SELECT id, release_id, prompt_text, negative_prompt, platform_preset,
               aspect_ratio, version, subject, palette, lighting, camera,
               created_at, updated_at
        FROM creative_prompts
        WHERE id = ?
      `);
      const updatedRow = fetchStmt.get(id) as unknown as SqlitePromptRow;
      return mapRowToRecord(updatedRow);
    },

    deletePrompt: async (id: string): Promise<boolean> => {
      // Step 1: Execute delete
      const stmt = db.prepare(`DELETE FROM creative_prompts WHERE id = ?`);
      const result = stmt.run(id);
      return Number(result.changes) > 0;
    },
  };
}
