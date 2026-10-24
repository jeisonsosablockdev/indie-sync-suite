-- ==============================================================================
-- @file 005_creative_pipeline.sql
-- @layer Infrastructure (Database DDL Migration)
-- @description Schema migration for Épica 3: Creative Pipeline Multimedia &
--              Asset Vault (creative_prompts, generation_batches,
--              creative_assets, typography_presets).
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- Step 1: Creative Master Prompts (Prompt Studio & Text-Only Workflow)
-- Invariant: Stores structured visual prompt parameters and compiled strings.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creative_prompts (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  prompt_text TEXT NOT NULL,
  negative_prompt TEXT,
  platform_preset TEXT NOT NULL CHECK (platform_preset IN ('MIDJOURNEY_V6', 'FLUX_SD', 'RUNWAY_KLING', 'RAW_TEXT')),
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('SQUARE_1_1', 'PORTRAIT_9_16', 'LANDSCAPE_16_9')),
  version INTEGER NOT NULL DEFAULT 1,
  subject TEXT NOT NULL,
  palette TEXT,
  lighting TEXT,
  camera TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 2: Generation Batches (4-Variant Exploration & Triage)
-- Invariant: Tracks batch requests and links approved assets to release tasks.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS generation_batches (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  prompt_id TEXT NOT NULL,
  task_id TEXT,
  status TEXT NOT NULL DEFAULT 'PENDING' CHECK (status IN ('PENDING', 'GENERATING', 'COMPLETED', 'FAILED')),
  variant_count INTEGER NOT NULL DEFAULT 4,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE,
  FOREIGN KEY(prompt_id) REFERENCES creative_prompts(id) ON DELETE CASCADE,
  FOREIGN KEY(task_id) REFERENCES release_tasks(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------------------------
-- Step 3: Creative Assets (Central Asset Vault & Content Hashing)
-- Invariant: Immutable content_hash (SHA-256) ensures asset integrity.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS creative_assets (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  batch_id TEXT,
  deliverable_id TEXT,
  prompt_id TEXT,
  format TEXT NOT NULL CHECK (format IN ('COVER_1_1', 'STORY_9_16', 'BANNER_16_9', 'SOCIAL_COPY')),
  aspect_ratio TEXT NOT NULL CHECK (aspect_ratio IN ('SQUARE_1_1', 'PORTRAIT_9_16', 'LANDSCAPE_16_9', 'NA')),
  width INTEGER NOT NULL,
  height INTEGER NOT NULL,
  storage_path TEXT NOT NULL,
  content_hash TEXT NOT NULL,
  mime_type TEXT NOT NULL,
  file_size_bytes INTEGER NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'APPROVED', 'REJECTED', 'DISCARDED')),
  metadata_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE,
  FOREIGN KEY(batch_id) REFERENCES generation_batches(id) ON DELETE SET NULL,
  FOREIGN KEY(deliverable_id) REFERENCES task_deliverables(id) ON DELETE SET NULL,
  FOREIGN KEY(prompt_id) REFERENCES creative_prompts(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------------------------
-- Step 4: Typography Presets (3000px Vector Stamping Layouts)
-- Invariant: Stores deterministic layout specs for cover art composition.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS typography_presets (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  title_text TEXT NOT NULL,
  artist_text TEXT NOT NULL,
  title_font_family TEXT NOT NULL,
  title_font_size REAL NOT NULL,
  title_color TEXT NOT NULL,
  artist_font_family TEXT NOT NULL,
  artist_font_size REAL NOT NULL,
  artist_color TEXT NOT NULL,
  composition_style TEXT NOT NULL CHECK (composition_style IN ('MINIMALIST', 'EDITORIAL', 'BOLD_IMPACT', 'VINTAGE_VINYL')),
  canvas_width INTEGER NOT NULL DEFAULT 3000,
  canvas_height INTEGER NOT NULL DEFAULT 3000,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 5: Optimization Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_prompts_release ON creative_prompts(release_id);
CREATE INDEX IF NOT EXISTS idx_batches_release ON generation_batches(release_id);
CREATE INDEX IF NOT EXISTS idx_batches_prompt ON generation_batches(prompt_id);
CREATE INDEX IF NOT EXISTS idx_assets_release ON creative_assets(release_id);
CREATE INDEX IF NOT EXISTS idx_assets_hash ON creative_assets(content_hash);
CREATE INDEX IF NOT EXISTS idx_assets_batch ON creative_assets(batch_id);
CREATE INDEX IF NOT EXISTS idx_assets_deliverable ON creative_assets(deliverable_id);
CREATE INDEX IF NOT EXISTS idx_typography_release ON typography_presets(release_id);
