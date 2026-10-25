/**
 * @file mcp-server-handler.test.ts
 * @layer Domain Test
 * @description Unit tests for pure Model Context Protocol (MCP) server dispatcher (HU-6.4 / SPEC-06-03).
 *              Verifies JSON-RPC 2.0 protocol envelopes, resources/list, resources/read,
 *              tools/list, tools/call, and error code conventions (-32601, -32602).
 */

import { describe, test, expect, vi } from 'vitest';
import {
  createMcpServerHandler,
  McpServerPorts,
  MCP_RESOURCES_CATALOG,
  MCP_TOOLS_CATALOG,
} from '../../../apps/web/src/lib/pipelines/mcp/mcp-server-handler';

describe('Domain: McpServerHandler (SPEC-06-03)', () => {
  const mockPorts: McpServerPorts = {
    readResource: vi.fn().mockResolvedValue({
      uri: 'brand://vault/active',
      mimeType: 'application/json',
      text: '{"labelName":"Aether Wave Records"}',
    }),
    callTool: vi.fn().mockResolvedValue({
      taskId: 't-100',
      status: 'CREATED',
    }),
  };

  test('lists registered resources catalog', () => {
    const handler = createMcpServerHandler(mockPorts);
    const resources = handler.listResources();

    expect(resources).toEqual(MCP_RESOURCES_CATALOG);
    expect(resources.length).toBe(3);
    expect(resources.map((r) => r.uri)).toContain('brand://vault/active');
  });

  test('lists registered tools catalog', () => {
    const handler = createMcpServerHandler(mockPorts);
    const tools = handler.listTools();

    expect(tools).toEqual(MCP_TOOLS_CATALOG);
    expect(tools.length).toBe(3);
    expect(tools.map((t) => t.name)).toContain('mcp_crear_tarea');
    expect(tools.map((t) => t.name)).toContain('mcp_aprobar_entregable');
    expect(tools.map((t) => t.name)).toContain('mcp_consultar_metricas');
  });

  test('dispatches resources/list request', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 1,
      method: 'resources/list',
    });

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(1);
    expect((response.result as { resources: unknown[] }).resources).toHaveLength(3);
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
    expect(contents[0].text).toContain('Aether Wave Records');
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

  test('dispatches tools/list request', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 4,
      method: 'tools/list',
    });

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(4);
    expect((response.result as { tools: unknown[] }).tools).toHaveLength(3);
  });

  test('dispatches tools/call request and invokes port', async () => {
    const handler = createMcpServerHandler(mockPorts);
    const response = await handler.dispatch({
      jsonrpc: '2.0',
      id: 5,
      method: 'tools/call',
      params: {
        name: 'mcp_crear_tarea',
        arguments: { releaseId: 'r-1', title: 'Nueva Tarea', dueDate: '2026-11-01' },
      },
    });

    expect(mockPorts.callTool).toHaveBeenCalledWith('mcp_crear_tarea', {
      releaseId: 'r-1',
      title: 'Nueva Tarea',
      dueDate: '2026-11-01',
    });

    expect(response.jsonrpc).toBe('2.0');
    expect(response.id).toBe(5);

    const content = (response.result as { content: { type: string; text: string }[] }).content;
    expect(content).toHaveLength(1);
    expect(content[0].text).toContain('t-100');
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
