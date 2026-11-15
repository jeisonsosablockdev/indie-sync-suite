/**
 * @file indie-sync-mcp-server.test.ts
 * @layer Infrastructure Test
 * @description Integration tests for standalone Indie-Sync MCP Server (ISS-007).
 *              Verifies database initialization, automatic fallback label creation,
 *              execution of mcp_crear_artista, mcp_listar_artistas, and end-to-end JSON-RPC dispatching with audit logging.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import { DatabaseSync } from 'node:sqlite';
import {
  initDatabase,
  createApplicationPorts,
} from '../../../scripts/indie-sync-mcp-server';
import { SqliteClient } from '../../../apps/web/src/lib/infrastructure/db/sqlite-client';
import { SqliteArtistRepository } from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-artist-repository';
import { SqliteLabelRepository } from '../../../apps/web/src/lib/infrastructure/db/repositories/sqlite-label-repository';

describe('Infrastructure: Standalone MCP Stdio Server (ISS-007)', () => {
  let client: SqliteClient;
  let db: DatabaseSync;
  let artistRepo: SqliteArtistRepository;
  let labelRepo: SqliteLabelRepository;

  beforeEach(() => {
    // Initialize in-memory test database with full migrations
    const setup = initDatabase(':memory:', true);
    client = setup.client;
    db = setup.db;
    artistRepo = setup.artistRepo;
    labelRepo = setup.labelRepo;
  });

  afterEach(() => {
    client.close();
  });

  test('createApplicationPorts: creates artist and auto-creates default label if none exists', async () => {
    const ports = createApplicationPorts(artistRepo, labelRepo);

    // Verify initially no labels or artists
    const initialLabels = await labelRepo.findAll();
    expect(initialLabels).toHaveLength(0);

    // Execute mcp_crear_artista
    const result = (await ports.callTool('mcp_crear_artista', {
      name: 'Cyber Horizon',
      genre: 'Darksynth',
      bio: 'Producción independiente de sintetizadores analógicos',
      colorPalette: ['#0F172A', '#E11D48'],
    })) as { success: boolean; artist: { id: string; name: string; genre: string; labelId: string } };

    expect(result.success).toBe(true);
    expect(result.artist.name).toBe('Cyber Horizon');
    expect(result.artist.genre).toBe('Darksynth');
    expect(result.artist.id).toBeDefined();

    // Verify default root label was created to maintain foreign key integrity
    const labelsAfter = await labelRepo.findAll();
    expect(labelsAfter).toHaveLength(1);
    expect(labelsAfter[0].name).toBe('Indie Sync Records');
    expect(result.artist.labelId).toBe(labelsAfter[0].id);

    // Verify artist exists in sqlite repository
    const stored = await artistRepo.findById(result.artist.id);
    expect(stored).toBeDefined();
    expect(stored?.name).toBe('Cyber Horizon');
  });

  test('createApplicationPorts: lists all registered artists in database', async () => {
    const ports = createApplicationPorts(artistRepo, labelRepo);

    // Create 2 artists
    await ports.callTool('mcp_crear_artista', {
      name: 'Artist Alpha',
      genre: 'Indie Rock',
    });
    await ports.callTool('mcp_crear_artista', {
      name: 'Artist Beta',
      genre: 'Electronic',
    });

    // List artists
    const listResult = (await ports.callTool('mcp_listar_artistas', {})) as {
      artists: { id: string; name: string; genre: string }[];
    };

    expect(listResult.artists).toHaveLength(2);
    expect(listResult.artists.map((a) => a.name)).toContain('Artist Alpha');
    expect(listResult.artists.map((a) => a.name)).toContain('Artist Beta');
  });

  test('end-to-end dispatch: initializes protocol, registers artist, and logs to SQLite mcp_audit_logs', async () => {
    const { bridge } = initDatabase(':memory:', true);

    // Step 1: Initialize MCP session
    const initResponse = (await bridge.dispatchJsonRpc(
      { jsonrpc: '2.0', id: 1, method: 'initialize' },
      'Antigravity'
    )) as {
      result: { protocolVersion: string; serverInfo: { name: string } };
    };

    expect(initResponse.result.protocolVersion).toBe('2024-11-05');
    expect(initResponse.result.serverInfo.name).toBe('indie-sync-suite');

    // Step 2: Call mcp_crear_artista
    const createResponse = (await bridge.dispatchJsonRpc(
      {
        jsonrpc: '2.0',
        id: 2,
        method: 'tools/call',
        params: {
          name: 'mcp_crear_artista',
          arguments: {
            name: 'Neon Symphony',
            genre: 'Synthpop',
          },
        },
      },
      'Antigravity'
    )) as {
      result: { content: { type: string; text: string }[] };
    };

    expect(createResponse.result.content[0].text).toContain('Neon Symphony');

    // Step 3: Check SQLite audit log
    const auditLogs = bridge.getAuditLogs();
    expect(auditLogs.length).toBeGreaterThanOrEqual(2);
    expect(auditLogs[0].method).toBe('tools/call');
    expect(auditLogs[0].status).toBe('SUCCESS');
    expect(auditLogs[0].clientInfo).toBe('Antigravity');
  });
});
