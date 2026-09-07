-- apps/web/src/lib/infrastructure/db/migrations/003_action_log.sql
-- Layer: Infrastructure (Layer 4)
-- Purpose: Immutable action audit log table for autonomous agent tool executions and human guardrail authorizations

CREATE TABLE IF NOT EXISTS action_log (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  params_snapshot TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  status TEXT NOT NULL, -- REQUESTED, CONFIRMED, REJECTED, EXECUTED, FAILED
  confirmed_by TEXT,
  result_snapshot TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  executed_at TEXT
);

CREATE INDEX IF NOT EXISTS idx_action_log_tool_created ON action_log(tool_name, created_at);
CREATE INDEX IF NOT EXISTS idx_action_log_status ON action_log(status);
