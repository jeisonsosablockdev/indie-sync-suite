-- ==============================================================================
-- @file 007_analytics_advisor.sql
-- @layer Infrastructure (Database DDL Migration)
-- @description Schema migration for Épica 5: Unified Analytics, CSV Report Ingestion,
--              Strategic Advisor Memory, and Autonomous Custom API Dashboards.
-- ==============================================================================

PRAGMA foreign_keys = ON;

-- ------------------------------------------------------------------------------
-- Step 1: Streaming Ingestion Reports
-- Invariant: Tracks ingested CSV audit records per release.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS streaming_reports (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  file_name TEXT NOT NULL,
  row_count INTEGER NOT NULL DEFAULT 0,
  source_platform TEXT NOT NULL CHECK (source_platform IN ('SPOTIFY', 'APPLE_MUSIC', 'DISTROKID', 'GENERIC_CSV')),
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 2: Consolidated Streaming Metrics
-- Invariant: Normalized time-series performance data linked to reports and releases.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS streaming_metrics (
  id TEXT PRIMARY KEY,
  report_id TEXT,
  release_id TEXT NOT NULL,
  metric_date TEXT NOT NULL,
  streams INTEGER NOT NULL DEFAULT 0 CHECK (streams >= 0),
  listeners INTEGER NOT NULL DEFAULT 0 CHECK (listeners >= 0),
  saves INTEGER NOT NULL DEFAULT 0 CHECK (saves >= 0),
  country_code TEXT NOT NULL DEFAULT 'GLOBAL',
  platform TEXT NOT NULL DEFAULT 'SPOTIFY',
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (report_id) REFERENCES streaming_reports(id) ON DELETE SET NULL,
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 3: Strategic Advisor Conversations & Memory
-- Invariant: Supports session history and GDPR-compliant hard deletes.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS advisor_conversations (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  title TEXT NOT NULL,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS advisor_messages (
  id TEXT PRIMARY KEY,
  conversation_id TEXT NOT NULL,
  sender_role TEXT NOT NULL CHECK (sender_role IN ('USER', 'ASSISTANT')),
  content TEXT NOT NULL,
  metrics_snapshot_json TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (conversation_id) REFERENCES advisor_conversations(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 4: Autonomous Custom API Dashboards & Widgets (Modo Avanzado)
-- Invariant: Dynamic schema inferred widgets with strict endpoint isolation.
-- ------------------------------------------------------------------------------
CREATE TABLE IF NOT EXISTS custom_api_dashboards (
  id TEXT PRIMARY KEY,
  release_id TEXT NOT NULL,
  name TEXT NOT NULL,
  endpoint_url TEXT NOT NULL,
  auth_header_encrypted TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  updated_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (release_id) REFERENCES releases(id) ON DELETE CASCADE
);

CREATE TABLE IF NOT EXISTS custom_dashboard_widgets (
  id TEXT PRIMARY KEY,
  dashboard_id TEXT NOT NULL,
  widget_type TEXT NOT NULL CHECK (widget_type IN ('KPI_CARD', 'TIME_SERIES', 'CATEGORY_PIE')),
  title TEXT NOT NULL,
  data_path TEXT NOT NULL,
  config_json TEXT,
  order_index INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  FOREIGN KEY (dashboard_id) REFERENCES custom_api_dashboards(id) ON DELETE CASCADE
);

-- ------------------------------------------------------------------------------
-- Step 5: Optimization Indexes
-- ------------------------------------------------------------------------------
CREATE INDEX IF NOT EXISTS idx_streaming_reports_release ON streaming_reports(release_id);
CREATE INDEX IF NOT EXISTS idx_streaming_metrics_release ON streaming_metrics(release_id);
CREATE INDEX IF NOT EXISTS idx_streaming_metrics_date ON streaming_metrics(metric_date);
CREATE INDEX IF NOT EXISTS idx_advisor_conversations_release ON advisor_conversations(release_id);
CREATE INDEX IF NOT EXISTS idx_advisor_messages_conversation ON advisor_messages(conversation_id);
CREATE INDEX IF NOT EXISTS idx_custom_dashboards_release ON custom_api_dashboards(release_id);
CREATE INDEX IF NOT EXISTS idx_custom_widgets_dashboard ON custom_dashboard_widgets(dashboard_id);
