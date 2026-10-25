/**
 * @file local-mcp-bridge.ts
 * @layer Infrastructure
 * @description Pure functional transport bridge executing Model Context Protocol (MCP) v1.0
 *              JSON-RPC 2.0 requests from local AI desktop clients (Claude, Cursor, Antigravity)
 *              and persisting structured audit logs via native node:sqlite DatabaseSync. Zero classes.
 */

import { DatabaseSync } from 'node:sqlite';
import { McpServerHandler } from '../../pipelines/mcp/mcp-server-handler';
import { McpAuditLog } from '../../pipelines/portal/portal-schemas';

export interface LocalMcpBridge {
  dispatchJsonRpc: (payload: unknown, clientInfo?: string) => Promise<unknown>;
  getAuditLogs: (limit?: number) => McpAuditLog[];
}

interface RawMcpAuditLogRow {
  id: string;
  method: string;
  params_json: string | null;
  client_info: string | null;
  status: string;
  error_message: string | null;
  created_at: string;
}

/**
 * Functional factory generating the local MCP JSON-RPC transport bridge.
 *
 * @param db - Native node:sqlite DatabaseSync connection instance
 * @param handler - Pure domain MCP server dispatcher
 * @returns LocalMcpBridge interface
 */
export function createLocalMcpBridge(
  db: DatabaseSync,
  handler: McpServerHandler
): LocalMcpBridge {
  // Step 1: Prepare audit log SQL statements
  const insertAuditStmt = db.prepare(`
    INSERT INTO mcp_audit_logs (id, method, params_json, client_info, status, error_message, created_at)
    VALUES (?, ?, ?, ?, ?, ?, ?)
  `);

  const selectRecentLogsStmt = db.prepare(`
    SELECT id, method, params_json, client_info, status, error_message, created_at
    FROM mcp_audit_logs
    ORDER BY created_at DESC
    LIMIT ?
  `);

  return {
    dispatchJsonRpc: async (payload: unknown, clientInfo = 'local-client'): Promise<unknown> => {
      // Step 2: Validate and extract method from JSON-RPC envelope
      const req = (payload && typeof payload === 'object' ? payload : {}) as Record<string, unknown>;
      const method = typeof req.method === 'string' ? req.method : 'unknown';
      const auditId = crypto.randomUUID();
      const createdAt = new Date().toISOString();

      try {
        // Step 3: Dispatch to pure domain handler
        const response = await handler.dispatch(req);

        // Step 4: Persist successful audit log
        insertAuditStmt.run(
          auditId,
          method,
          req.params ? JSON.stringify(req.params) : null,
          clientInfo,
          'SUCCESS',
          null,
          createdAt
        );

        return response;
      } catch (err: unknown) {
        // Step 5: Log error status and rethrow structured JSON-RPC error
        const errorMessage = err instanceof Error ? err.message : 'Error interno MCP';
        insertAuditStmt.run(
          auditId,
          method,
          req.params ? JSON.stringify(req.params) : null,
          clientInfo,
          'ERROR',
          errorMessage,
          createdAt
        );

        return {
          jsonrpc: '2.0',
          id: req.id ?? null,
          error: {
            code: -32603,
            message: errorMessage,
          },
        };
      }
    },

    getAuditLogs: (limit = 50): McpAuditLog[] => {
      // Step 6: Query recent audit logs for administration view
      const rows = selectRecentLogsStmt.all(limit) as unknown as RawMcpAuditLogRow[];
      return rows.map((r) => ({
        id: r.id,
        method: r.method,
        paramsJson: r.params_json,
        clientInfo: r.client_info ?? undefined,
        status: r.status as 'SUCCESS' | 'ERROR',
        errorMessage: r.error_message ?? undefined,
        createdAt: r.created_at,
      }));
    },
  };
}
