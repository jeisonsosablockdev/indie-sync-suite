-- Migration 008: Portal del Artista, Open API Keys y Auditoría MCP
-- Engine: SQLite WAL mode with Foreign Keys ON

PRAGMA foreign_keys = ON;

-- Step 1: Artist Portal Sessions (Magic Links)
CREATE TABLE IF NOT EXISTS artist_portal_sessions (
    id TEXT PRIMARY KEY,
    release_id TEXT NOT NULL REFERENCES releases(id) ON DELETE CASCADE,
    artist_id TEXT NOT NULL REFERENCES artists(id) ON DELETE CASCADE,
    token_hash TEXT NOT NULL UNIQUE,
    expires_at TEXT NOT NULL,
    revoked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_artist_portal_sessions_token_hash ON artist_portal_sessions(token_hash);
CREATE INDEX IF NOT EXISTS idx_artist_portal_sessions_release_id ON artist_portal_sessions(release_id);
CREATE INDEX IF NOT EXISTS idx_artist_portal_sessions_artist_id ON artist_portal_sessions(artist_id);

-- Step 2: Portal Deliverable Reviews
CREATE TABLE IF NOT EXISTS portal_deliverable_reviews (
    id TEXT PRIMARY KEY,
    session_id TEXT NOT NULL REFERENCES artist_portal_sessions(id) ON DELETE CASCADE,
    deliverable_id TEXT NOT NULL REFERENCES task_deliverables(id) ON DELETE CASCADE,
    decision TEXT NOT NULL CHECK (decision IN ('APPROVED', 'CHANGES_REQUESTED')),
    feedback_text TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_portal_reviews_session ON portal_deliverable_reviews(session_id);
CREATE INDEX IF NOT EXISTS idx_portal_reviews_deliverable ON portal_deliverable_reviews(deliverable_id);

-- Step 3: External API Keys
CREATE TABLE IF NOT EXISTS external_api_keys (
    id TEXT PRIMARY KEY,
    label TEXT NOT NULL,
    key_prefix TEXT NOT NULL,
    key_hash TEXT NOT NULL UNIQUE,
    scopes_json TEXT NOT NULL DEFAULT '[]',
    last_used_at TEXT,
    revoked_at TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_external_api_keys_hash ON external_api_keys(key_hash);
CREATE INDEX IF NOT EXISTS idx_external_api_keys_prefix ON external_api_keys(key_prefix);

-- Step 4: MCP Protocol Audit Logs
CREATE TABLE IF NOT EXISTS mcp_audit_logs (
    id TEXT PRIMARY KEY,
    method TEXT NOT NULL,
    params_json TEXT,
    client_info TEXT,
    status TEXT NOT NULL CHECK (status IN ('SUCCESS', 'ERROR')),
    error_message TEXT,
    created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_mcp_audit_logs_created_at ON mcp_audit_logs(created_at);
CREATE INDEX IF NOT EXISTS idx_mcp_audit_logs_method ON mcp_audit_logs(method);
