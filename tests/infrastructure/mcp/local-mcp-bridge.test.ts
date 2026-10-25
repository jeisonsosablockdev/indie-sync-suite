/**
 * @file local-mcp-bridge.test.ts
 * @layer Infrastructure Test
 * @description Integration tests for LocalMcpBridge (HU-6.4 / SPEC-06-03).
 *              Verifies JSON-RPC 2.0 dispatch, SQLite audit logging (`mcp_audit_logs`),
 *              and internal error code handling (-32603).
 */

import { describe, test, expect, beforeEach } from 'vitest';
import path from 'node:path';
import { DatabaseSync } from 'node:sqlite';
import { runMigrations } from '../../../apps/web/src/lib/infrastructure/db/migrator';
import {
  createLocalMcpBridge,
  LocalMcpBridge,
} from '../../../apps/web/src/lib/infrastructure/mcp/local-mcp-bridge';
import {
  createMcpServerHandler,
  McpServerPorts,
} from '../../../apps/web/src/lib/pipelines/mcp/mcp-server-handler';

describe('Infrastructure: LocalMcpBridge (SPEC-06-03)', () => {
  let db: DatabaseSync;
  let bridge: LocalMcpBridge;

  beforeEach(() => {
    db = new DatabaseSync(':memory:');
    db.exec('PRAGMA foreign_keys = ON;');
    db.exec('PRAGMA journal_mode = WAL;');

    const migrationsDir = path.resolve(
      __dirname,
      '../../../apps/web/src/lib/infrastructure/db/migrations'
    );
    runMigrations(db, migrationsDir);

    const mockPorts: McpServerPorts = {
      readResource: async (uri: string) => ({
        uri,
        mimeType: 'application/json',
        text: '{"status":"ok"}',
      }),
      callTool: async () => ({ result: 'tool_success' }),
    };

    const handler = createMcpServerHandler(mockPorts);
    bridge = createLocalMcpBridge(db, handler);
  });

  test('dispatches JSON-RPC request and logs SUCCESS to SQLite audit table', async () => {
    const payload = {
      jsonrpc: '2.0',
      id: 101,
      method: 'tools/list',
    };

    const response = (await bridge.dispatchJsonRpc(payload, 'Claude Desktop')) as {
      jsonrpc: string;
      id: number;
      result: { tools: unknown[] };
    };

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(101);
    expect(response.result.tools).toBeDefined();

    // Verify audit log record
    const logs = bridge.getAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].method).toBe('tools/list');
    expect(logs[0].clientInfo).toBe('Claude Desktop');
    expect(logs[0].status).toBe('SUCCESS');
    expect(logs[0].errorMessage).toBeUndefined();
  });

  test('catches internal exception, logs ERROR to SQLite and returns -32603', async () => {
    const throwingPorts: McpServerPorts = {
      readResource: async () => {
        throw new Error('Database connection failed');
      },
      callTool: async () => null,
    };

    const faultyHandler = createMcpServerHandler(throwingPorts);
    const faultyBridge = createLocalMcpBridge(db, faultyHandler);

    const payload = {
      jsonrpc: '2.0',
      id: 102,
      method: 'resources/read',
      params: { uri: 'brand://vault/active' },
    };

    const response = (await faultyBridge.dispatchJsonRpc(payload, 'Antigravity')) as {
      jsonrpc: string;
      id: number;
      error: { code: number; message: string };
    };

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(102);
    expect(response.error.code).toBe(-32603);
    expect(response.error.message).toContain('Database connection failed');

    // Verify error in audit log
    const logs = faultyBridge.getAuditLogs();
    expect(logs).toHaveLength(1);
    expect(logs[0].method).toBe('resources/read');
    expect(logs[0].clientInfo).toBe('Antigravity');
    expect(logs[0].status).toBe('ERROR');
    expect(logs[0].errorMessage).toContain('Database connection failed');
  });

  test('queries recent audit logs with custom limit', async () => {
    // Dispatch 3 calls
    await bridge.dispatchJsonRpc({ jsonrpc: '2.0', id: 1, method: 'tools/list' });
    await bridge.dispatchJsonRpc({ jsonrpc: '2.0', id: 2, method: 'resources/list' });
    await bridge.dispatchJsonRpc({ jsonrpc: '2.0', id: 3, method: 'tools/list' });

    const logsLimit2 = bridge.getAuditLogs(2);
    expect(logsLimit2).toHaveLength(2);

    const allLogs = bridge.getAuditLogs();
    expect(allLogs).toHaveLength(3);
  });
});
