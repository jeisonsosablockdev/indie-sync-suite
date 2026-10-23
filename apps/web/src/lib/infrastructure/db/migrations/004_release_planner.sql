-- ==============================================================================
-- @file 004_release_planner.sql
-- @layer Infrastructure (Database DDL Migration)
-- @description Schema migration for Épica 2: Release Planner Engine, phases,
--              tasks, DAG dependencies, external audio links, deliverables,
--              feedback audit trails, and atomic undo snapshots.
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- Step 1: Release Concepts (Contexto Nivel 3)
-- Invariant: Exactly one concept per release, with immutable snapshot freeze flag.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS release_concepts (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL UNIQUE,
  narrative TEXT NOT NULL,
  lyric_theme TEXT NOT NULL,
  sound_mood TEXT NOT NULL,
  isrc TEXT,
  upc TEXT,
  target_date TEXT NOT NULL,
  budget_usd REAL NOT NULL DEFAULT 0.0 CHECK (budget_usd >= 0),
  snapshot_frozen INTEGER NOT NULL DEFAULT 0 CHECK (snapshot_frozen IN (0, 1)),
  frozen_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 2: Release Phases (Pre-Release, Live-Release, Post-Release)
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS release_phases (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  phase_type TEXT NOT NULL CHECK (phase_type IN ('PRE_RELEASE', 'LIVE_RELEASE', 'POST_RELEASE')),
  name TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 3: Release Tasks (Cronograma e Hitos)
-- Invariant: Offset in days is relative to T-0 (negative = pre, positive = post).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS release_tasks (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  phase_id TEXT NOT NULL,
  parent_task_id TEXT,
  title TEXT NOT NULL,
  description TEXT,
  assigned_role TEXT NOT NULL DEFAULT 'LABEL_MANAGER' CHECK (assigned_role IN ('LABEL_MANAGER', 'ARTIST', 'COLLABORATOR')),
  due_date TEXT NOT NULL,
  offset_days INTEGER NOT NULL,
  is_gatekeeper INTEGER NOT NULL DEFAULT 0 CHECK (is_gatekeeper IN (0, 1)),
  status TEXT NOT NULL DEFAULT 'TODO' CHECK (status IN ('TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED')),
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE,
  FOREIGN KEY(phase_id) REFERENCES release_phases(id) ON DELETE CASCADE,
  FOREIGN KEY(parent_task_id) REFERENCES release_tasks(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------------------------
-- Step 4: Task Dependencies (DAG - Grafo Acíclico Dirigido)
-- Invariant: Composite primary key enforces edge uniqueness. Reverse index added.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_dependencies (
  task_id TEXT NOT NULL,
  prerequisite_task_id TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  PRIMARY KEY (task_id, prerequisite_task_id),
  FOREIGN KEY(task_id) REFERENCES release_tasks(id) ON DELETE CASCADE,
  FOREIGN KEY(prerequisite_task_id) REFERENCES release_tasks(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_task_deps_prereq ON task_dependencies(prerequisite_task_id);

-- ------------------------------------------------------------------------------
-- Step 5: External Audio Links Enhancement
-- Invariant: Unique constraint enforces exactly one active link per category per release.
-- ------------------------------------------------------------------------------
ALTER TABLE external_audio_links ADD COLUMN category TEXT NOT NULL DEFAULT 'MASTER_WAV' CHECK (category IN ('MASTER_WAV', 'INSTRUMENTAL', 'STEMS', 'ACAPELLA'));
ALTER TABLE external_audio_links ADD COLUMN verified_status TEXT NOT NULL DEFAULT 'UNVERIFIED' CHECK (verified_status IN ('UNVERIFIED', 'VERIFIED', 'ERROR'));
ALTER TABLE external_audio_links ADD COLUMN verified_at TEXT;
ALTER TABLE external_audio_links ADD COLUMN mime_type TEXT;
ALTER TABLE external_audio_links ADD COLUMN file_size_bytes INTEGER;
ALTER TABLE external_audio_links ADD COLUMN updated_at TEXT NOT NULL DEFAULT (datetime('now'));

CREATE UNIQUE INDEX IF NOT EXISTS uq_external_audio_release_cat ON external_audio_links(release_id, category);

-- ------------------------------------------------------------------------------
-- Step 6: Task Deliverables & Feedback Audit Trail
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS task_deliverables (
  id TEXT PRIMARY KEY,
  task_id TEXT NOT NULL,
  title TEXT NOT NULL,
  asset_url TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'IN_REVIEW', 'APPROVED', 'REJECTED')),
  rejection_reason TEXT,
  reviewed_at TEXT,
  reviewed_by TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(task_id) REFERENCES release_tasks(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS deliverable_feedbacks (
  id TEXT PRIMARY KEY,
  deliverable_id TEXT NOT NULL,
  author_role TEXT NOT NULL CHECK (author_role IN ('LABEL_MANAGER', 'ARTIST')),
  comment TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(deliverable_id) REFERENCES task_deliverables(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 7: Atomic Undo Stack (Schedule Snapshots)
-- Invariant: Valid snapshot allows single-step atomic rollback of cascade recalculations.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS schedule_undo_snapshots (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  snapshot_json TEXT NOT NULL,
  is_valid INTEGER NOT NULL DEFAULT 1 CHECK (is_valid IN (0, 1)),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY(release_id) REFERENCES releases(id) ON DELETE CASCADE
);

CREATE INDEX IF NOT EXISTS idx_undo_release_valid ON schedule_undo_snapshots(release_id, is_valid);

-- ------------------------------------------------------------------------------
-- Step 8: Query Optimization Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_tasks_release_phase ON release_tasks(release_id, phase_id);
CREATE INDEX IF NOT EXISTS idx_tasks_gatekeeper ON release_tasks(release_id, is_gatekeeper);
CREATE INDEX IF NOT EXISTS idx_deliverables_task ON task_deliverables(task_id, status);
