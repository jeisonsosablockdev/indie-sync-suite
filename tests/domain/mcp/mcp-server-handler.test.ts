/**
 * @file mcp-server-handler.test.ts
 * @layer Domain Test
 * @description Comprehensive unit tests for Model Context Protocol (MCP) server dispatcher (ISS-007).
 *              Verifies JSON-RPC 2.0 protocol envelopes, initialize, ping, resources,
 *              tools/list (including mcp_crear_artista & mcp_listar_artistas),
 *              tools/call validation with Zod, and standard error conventions (-32601, -32602).
 */

import { describe, test, expect, vi } from 'vitest';
import {
  createMcpServerHandler,
  McpServerPorts,
  MCP_RESOURCES_CATALOG,
  MCP_TOOLS_CATALOG,
} from '../../../apps/web/src/lib/pipelines/mcp/mcp-server-handler';

describe('Domain: McpServerHandler (ISS-007)', () => {
  const mockPorts: McpServerPorts = {
    readResource: vi.fn().mockResolvedValue({
      uri: 'brand://vault/active',
      mimeType: 'application/json',
      text: '{"name":"Indie Sync Records","toneOfVoice":"Empowering"}',
    }),
    callTool: vi.fn().mockImplementation(async (toolName: string, args: Record<string, unknown>) => {
      if (toolName === 'mcp_crear_artista') {
        if (!args.name || !args.genre) {
          throw new Error('Parámetros obligatorios faltantes: name y genre');
        }
        return {
          id: 'art-uuid-1',
          name: args.name,
          genre: args.genre,
          bio: args.bio ?? '',
          colorPalette: args.colorPalette ?? ['#18181B', '#6366F1'],
        };
      }
      if (toolName === 'mcp_listar_artistas') {
        return [
          { id: 'art-uuid-1', name: 'Solaris Duo', genre: 'Synthwave' },
        ];
      }
      return { taskId: 't-100', status: 'CREATED' };
    }),
  };

  // --- PROTOCOL TESTS (initialize & ping) ---

  test('dispatches initialize method returning protocol version and serverInfo', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 10,
      method: 'initialize',
    });

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(10);
    expect(response.result).toBeDefined();

    const result = response.result as {
      protocolVersion: string;
      capabilities: { tools: Record<string, unknown>; resources: Record<string, unknown> };
      serverInfo: { name: string; version: string };
    };
    expect(result.protocolVersion).toBe('2024-11-05');
    expect(result.serverInfo.name).toBe('indie-sync-suite');
    expect(result.capabilities.tools).toBeDefined();
    expect(result.capabilities.resources).toBeDefined();
  });

  test('dispatches ping method returning empty result object', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 11,
      method: 'ping',
    });

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(11);
    expect(response.result).toEqual({});
  });

  // --- RESOURCES CATALOG TESTS ---

  test('lists registered resources catalog', () => {
    const handler = createMcpServerHandler(mockPorts);
    const resources = handler.listResources();

    expect(resources).toEqual(MCP_RESOURCES_CATALOG);
    expect(resources.length).toBe(3);
    expect(resources.map((r) => r.uri)).toContain('brand://vault/active');
  });

  test('dispatches resources/read request and invokes port', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 2,
      method: 'resources/read',
      params: { uri: 'brand://vault/active' },
    });

    expect(mockPorts.readResource).toHaveBeenCalledWith('brand://vault/active');
    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(2);

    const contents = (response.result as { contents: { text: string }[] }).contents;
    expect(contents).toHaveLength(1);
    expect(contents[0].text).toContain('Indie Sync Records');
  });

  test('returns -32602 error when resources/read is missing uri param', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 3,
      method: 'resources/read',
      params: {},
    });

    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32602);
    expect(response.error?.message).toContain('Parámetro URI obligatorio');
  });

  // --- TOOLS CATALOG TESTS (mcp_crear_artista & mcp_listar_artistas) ---

  test('lists registered tools catalog including mcp_crear_artista and mcp_listar_artistas', () => {
    const handler = createMcpServerHandler(mockPorts);
    const tools = handler.listTools();

    expect(tools).toEqual(MCP_TOOLS_CATALOG);
    expect(tools.length).toBe(5);
    expect(tools.map((t) => t.name)).toContain('mcp_crear_artista');
    expect(tools.map((t) => t.name)).toContain('mcp_listar_artistas');
    expect(tools.map((t) => t.name)).toContain('mcp_crear_tarea');
    expect(tools.map((t) => t.name)).toContain('mcp_aprobar_entregable');
    expect(tools.map((t) => t.name)).toContain('mcp_consultar_metricas');

    // Verify mcp_crear_artista schema requires name and genre
    const crearArtistaTool = tools.find((t) => t.name === 'mcp_crear_artista');
    expect(crearArtistaTool).toBeDefined();
    const schema = crearArtistaTool!.inputSchema as { required: string[] };
    expect(schema.required).toContain('name');
    expect(schema.required).toContain('genre');
  });

  test('dispatches tools/call for mcp_crear_artista with valid parameters', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 20,
      method: 'tools/call',
      params: {
        name: 'mcp_crear_artista',
        arguments: {
          name: 'Neon Horizon',
          genre: 'Synthwave',
          bio: 'Dúo de sintetizadores analógicos',
          colorPalette: ['#0F172A', '#06B6D4'],
        },
      },
    });

    expect(mockPorts.callTool).toHaveBeenCalledWith('mcp_crear_artista', {
      name: 'Neon Horizon',
      genre: 'Synthwave',
      bio: 'Dúo de sintetizadores analógicos',
      colorPalette: ['#0F172A', '#06B6D4'],
    });

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(20);

    const content = (response.result as { content: { type: string; text: string }[] }).content;
    expect(content).toHaveLength(1);
    expect(content[0].text).toContain('Neon Horizon');
    expect(content[0].text).toContain('Synthwave');
  });

  test('returns -32602 error when mcp_crear_artista fails parameter validation', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 21,
      method: 'tools/call',
      params: {
        name: 'mcp_crear_artista',
        arguments: {
          bio: 'Missing name and genre',
        },
      },
    });

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(21);
    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32602);
    expect(response.error?.message).toContain('name');
  });

  test('dispatches tools/call for mcp_listar_artistas', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 22,
      method: 'tools/call',
      params: {
        name: 'mcp_listar_artistas',
        arguments: {},
      },
    });

    expect(mockPorts.callTool).toHaveBeenCalledWith('mcp_listar_artistas', {});
    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(22);

    const content = (response.result as { content: { type: string; text: string }[] }).content;
    expect(content).toHaveLength(1);
    expect(content[0].text).toContain('Solaris Duo');
  });

  test('returns -32602 error when tools/call is missing name param', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 6,
      method: 'tools/call',
      params: {},
    });

    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32602);
    expect(response.error?.message).toContain('Parámetro name obligatorio');
  });

  test('returns -32601 error for unknown method', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 7,
      method: 'unknown/method',
    });

    expect(response.error).toBeDefined();
    expect(response.error?.code).toBe(-32601);
    expect(response.error?.message).toContain('Método desconocido');
  });
});
