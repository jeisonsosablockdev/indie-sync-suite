-- apps/web/src/lib/infrastructure/db/migrations/001_initial_schema.sql
-- Layer: Infrastructure (Layer 4)
-- Purpose: Initial relational schema for Indie-Sync Suite (Labels, Artists, Releases, Tasks, Audio Links, Outbox Queue)
-- Architectural Invariant: Enforce SQLite WAL mode, foreign key cascades, and outbox indexes.

CREATE TABLE IF NOT EXISTS labels (
  id TEXT PRIMARY KEY,
  name TEXT NOT NULL,
  country TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS artists (
  id TEXT PRIMARY KEY,
  label_id TEXT NOT NULL,
  name TEXT NOT NULL,
  bio TEXT,
  genre TEXT,
  subgenres TEXT, -- JSON array
  color_palette TEXT, -- JSON array of hex codes
  typography TEXT, -- JSON object
  tone_of_voice TEXT,
  social_links TEXT, -- JSON object
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (label_id) REFERENCES labels (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS releases (
  id TEXT PRIMARY KEY,
  artist_id TEXT NOT NULL,
  title TEXT NOT NULL,
  release_date TEXT NOT NULL,
  archetype TEXT NOT NULL, -- single, ep, album, remix
  status TEXT NOT NULL DEFAULT 'draft',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (artist_id) REFERENCES artists (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS tasks (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  phase TEXT NOT NULL, -- pre_release, release_day, post_release
  title TEXT NOT NULL,
  description TEXT,
  due_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'todo', -- todo, in_progress, in_review, done, blocked
  parent_task_id TEXT,
  is_gatekeeper INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (release_id) REFERENCES releases (id) ON DELETE CASCADE,
  FOREIGN KEY (parent_task_id) REFERENCES tasks (id) ON DELETE SET NULL
);

CREATE TABLE IF NOT EXISTS external_audio_links (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  provider TEXT NOT NULL, -- drive, dropbox, soundcloud, other
  url TEXT NOT NULL,
  verified INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (release_id) REFERENCES releases (id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS cloud_sync_queue (
  id TEXT PRIMARY KEY,
  aggregate_type TEXT NOT NULL, -- label, artist, release, task
  aggregate_id TEXT NOT NULL,
  action TEXT NOT NULL, -- CREATE, UPDATE, DELETE
  payload TEXT NOT NULL, -- JSON snapshot
  status TEXT NOT NULL DEFAULT 'PENDING', -- PENDING, PROCESSING, SYNCED, FAILED
  retry_count INTEGER NOT NULL DEFAULT 0,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  synced_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_artists_label ON artists(label_id);
CREATE INDEX IF NOT EXISTS idx_releases_artist ON releases(artist_id);
CREATE INDEX IF NOT EXISTS idx_tasks_release_phase ON tasks(release_id, phase);
CREATE INDEX IF NOT EXISTS idx_outbox_pending ON cloud_sync_queue(status, created_at);
