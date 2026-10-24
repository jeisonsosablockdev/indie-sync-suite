-- ==============================================================================
-- @file 006_distribution_postiz.sql
-- @layer Infrastructure (Database DDL Migration)
-- @description Schema migration for Épica 4: Multichannel Distribution & Programmatic Ads
--              (social_connections, scheduled_posts, ad_campaigns, outbox indexes).
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- Step 1: Connected Social & Ad Accounts (OAuth Hub)
-- Invariant: Unique connection per label, platform, and account.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS social_connections (
  id TEXT PRIMARY KEY,
  label_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('INSTAGRAM', 'TIKTOK', 'TWITTER_X', 'YOUTUBE', 'FACEBOOK', 'META_ADS', 'TIKTOK_ADS')),
  account_name TEXT NOT NULL,
  account_id TEXT NOT NULL,
  health_status TEXT NOT NULL CHECK (health_status IN ('CONNECTED', 'EXPIRED', 'DISCONNECTED')),
  access_token_encrypted TEXT,
  token_expires_at TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (label_id) REFERENCES labels(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 2: Multichannel Scheduled Posts
-- Invariant: Anchored to release_id and optional creative_asset deliverable.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS scheduled_posts (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  asset_id TEXT,
  platform TEXT NOT NULL,
  post_text TEXT NOT NULL,
  scheduled_time TEXT NOT NULL,
  media_url TEXT,
  media_hash TEXT,
  postiz_post_id TEXT,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'QUEUED', 'PUBLISHED', 'FAILED')),
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE,
  FOREIGN KEY (asset_id) REFERENCES creative_assets(id) ON DELETE SET NULL
);

-- ------------------------------------------------------------------------------
-- Step 3: Programmatic Micro-Ad Campaigns ($20–$100 USD)
-- Invariant: Strict budget boundaries ($20.00 to $100.00 USD).
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS ad_campaigns (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  platform TEXT NOT NULL CHECK (platform IN ('META_ADS', 'TIKTOK_ADS')),
  budget_usd REAL NOT NULL CHECK (budget_usd >= 20.0 AND budget_usd <= 100.0),
  destination_url TEXT NOT NULL,
  target_audience TEXT NOT NULL,
  start_date TEXT NOT NULL,
  end_date TEXT NOT NULL,
  status TEXT NOT NULL DEFAULT 'DRAFT' CHECK (status IN ('DRAFT', 'PENDING_APPROVAL', 'ACTIVE', 'COMPLETED', 'FAILED')),
  external_campaign_id TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 4: Optimization Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_social_connections_label ON social_connections(label_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_release ON scheduled_posts(release_id);
CREATE INDEX IF NOT EXISTS idx_scheduled_posts_time ON scheduled_posts(scheduled_time, status);
CREATE INDEX IF NOT EXISTS idx_ad_campaigns_release ON ad_campaigns(release_id);
