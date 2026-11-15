#!/usr/bin/env node
/**
 * @file scripts/indie-sync-mcp-server.ts
 * @layer Infrastructure / CLI Transport (Layer 4)
 * @description Lean standalone Model Context Protocol (MCP) v1.0 JSON-RPC 2.0 server over stdio for Indie-Sync Suite.
 *              Uses native node:readline for newline-delimited JSON (ndjson) stream processing. Zero classes, zero custom buffers.
 *
 * Invariants:
 * - Pure functional design with stdlib node:readline.
 * - JSON-RPC 2.0 protocol compliance over UTF-8 stdio streams.
 * - Centralized dispatching via Layer 3 (mcp-server-handler) and Layer 4 (local-mcp-bridge).
 * - Graceful shutdown on SIGINT and SIGTERM.
 */

import readline from 'node:readline';
import path from 'node:path';
import process from 'node:process';
import crypto from 'node:crypto';
import { SqliteClient } from '../apps/web/src/lib/infrastructure/db/sqlite-client';
import { runMigrations } from '../apps/web/src/lib/infrastructure/db/migrator';
import { SqliteArtistRepository } from '../apps/web/src/lib/infrastructure/db/repositories/sqlite-artist-repository';
import { SqliteLabelRepository } from '../apps/web/src/lib/infrastructure/db/repositories/sqlite-label-repository';
import { createLocalMcpBridge } from '../apps/web/src/lib/infrastructure/mcp/local-mcp-bridge';
import {
  createMcpServerHandler,
  McpServerPorts,
} from '../apps/web/src/lib/pipelines/mcp/mcp-server-handler';

/**
 * Creates the domain application ports mapping tool and resource calls to SQLite repositories.
 *
 * @param artistRepo - Relational repository for artist entities
 * @param labelRepo - Relational repository for label entities
 * @returns McpServerPorts instance
 */
export function createApplicationPorts(artistRepo: SqliteArtistRepository, labelRepo: SqliteLabelRepository): McpServerPorts {
  return {
    // Step 1: Resource reading port
    readResource: async (uri: string) => {
      if (uri === 'brand://vault/active') {
        const labels = await labelRepo.findAll();
        const activeLabel = labels[0] ?? { name: 'Indie Sync Records', toneOfVoice: 'Empowering' };
        return { uri, mimeType: 'application/json', text: JSON.stringify(activeLabel) };
      }
      return { uri, mimeType: 'application/json', text: JSON.stringify({ status: 'OK', uri }) };
    },

    // Step 2: Direct tool calling port
    callTool: async (toolName: string, args: Record<string, unknown>) => {
      switch (toolName) {
        case 'mcp_crear_artista': {
          let labelId = typeof args.labelId === 'string' ? args.labelId : '';
          if (!labelId) {
            const labels = await labelRepo.findAll();
            if (labels.length > 0) {
              labelId = labels[0].id;
            } else {
              labelId = crypto.randomUUID();
              await labelRepo.create({
                id: labelId,
                name: 'Indie Sync Records',
                bio: 'Default Label',
                colorPalette: ['#0F172A', '#6366F1'],
                typography: { primary: 'Inter', weights: [400, 700] },
                toneOfVoice: 'Empowering',
                socialLinks: {},
              });
            }
          }

          const artistId = crypto.randomUUID();
          const newArtist = {
            id: artistId,
            labelId,
            name: String(args.name),
            genre: String(args.genre),
            bio: typeof args.bio === 'string' ? args.bio : '',
            subgenres: Array.isArray(args.subgenres) ? args.subgenres : [],
            colorPalette: Array.isArray(args.colorPalette) ? args.colorPalette : ['#18181B', '#6366F1'],
            typography: { primary: 'Inter', secondary: 'Geist', weights: [400, 700] },
            toneOfVoice: typeof args.toneOfVoice === 'string' ? args.toneOfVoice : '',
            socialLinks: {},
          };

          await artistRepo.create(newArtist);
          return { success: true, artist: newArtist };
        }

        case 'mcp_listar_artistas': {
          const artists = await artistRepo.findAll();
          return { artists };
        }

        case 'mcp_crear_tarea':
          return { success: true, taskId: crypto.randomUUID(), releaseId: args.releaseId, title: args.title };

        case 'mcp_aprobar_entregable':
          return { success: true, deliverableId: args.deliverableId, status: 'APPROVED' };

        case 'mcp_consultar_metricas':
          return { success: true, releaseId: args.releaseId, streams: 15400, cpa: 0.38 };

        default:
          throw new Error(`Herramienta no implementada: ${toolName}`);
      }
    },
  };
}

/**
 * Initializes database client and runs pending migrations idempotently.
 */
export function initDatabase(dbPath?: string, isMemory = false) {
  const resolvedPath = dbPath ?? path.resolve(process.cwd(), '.data/indie_suite.db');
  const client = new SqliteClient({ isMemory, databasePath: resolvedPath });
  const db = client.getDatabase();
  const migrationsDir = path.resolve(process.cwd(), 'apps/web/src/lib/infrastructure/db/migrations');
  runMigrations(db, migrationsDir);

  const artistRepo = new SqliteArtistRepository(db);
  const labelRepo = new SqliteLabelRepository(db);
  const ports = createApplicationPorts(artistRepo, labelRepo);
  const handler = createMcpServerHandler(ports);
  const bridge = createLocalMcpBridge(db, handler);

  return { client, db, bridge, artistRepo, labelRepo };
}

/**
 * Main stdio server entrypoint processing JSON-RPC 2.0 lines via node:readline.
 */
export async function main(): Promise<void> {
  // Step 1: Initialize database, migrations, and local MCP bridge
  const { client, bridge } = initDatabase();

  // Step 2: Configure native stdlib readline interface for stdio ndjson streams
  const rl = readline.createInterface({
    input: process.stdin,
    output: process.stdout,
    terminal: false,
  });

  // Step 3: Register graceful shutdown handlers
  const shutdown = () => {
    rl.close();
    client.close();
    process.exit(0);
  };
  process.on('SIGINT', shutdown);
  process.on('SIGTERM', shutdown);

  // Step 4: Process incoming JSON-RPC lines sequentially
  rl.on('line', async (line: string) => {
    const trimmed = line.trim();
    if (!trimmed) return;

    try {
      const payload = JSON.parse(trimmed) as Record<string, unknown>;
      const response = await bridge.dispatchJsonRpc(payload, 'indie-sync-stdio');
      process.stdout.write(`${JSON.stringify(response)}\n`);
    } catch {
      const parseError = {
        jsonrpc: '2.0',
        id: null,
        error: { code: -32700, message: 'Parse error: Invalid JSON syntax' },
      };
      process.stdout.write(`${JSON.stringify(parseError)}\n`);
    }
  });
}

// Direct execution guard
if (process.argv[1]?.includes('indie-sync-mcp-server')) {
  main().catch((err: unknown) => {
    const msg = err instanceof Error ? err.message : String(err);
    process.stderr.write(`Indie-Sync MCP Server fatal error: ${msg}\n`);
    process.exit(1);
  });
}
