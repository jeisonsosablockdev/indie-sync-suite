/**
 * @file mcp-server-status.test.tsx
 * @layer Presentation Test
 * @description UI component tests for McpServerStatus (HU-6.4 / SPEC-06-03).
 *              Verifies online status indicator, context resources catalog,
 *              agent tools list, and JSON-RPC audit logs table.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { McpServerStatus } from '../../apps/web/src/components/assistant/mcp-server-status';

describe('Presentation: McpServerStatus (SPEC-06-03)', () => {
  test('renders server monitor header and online badge', () => {
    render(<McpServerStatus />);

    expect(screen.getByText('Servidor MCP Local')).toBeDefined();
    expect(
      screen.getByText('Protocolo JSON-RPC 2.0 para Claude Desktop, Cursor y agentes externos')
    ).toBeDefined();
    expect(screen.getByText('MCP Activo (Puerto Local)')).toBeDefined();
  });

  test('renders resources and tools catalogs with correct counts', () => {
    render(<McpServerStatus />);

    expect(screen.getByText('Recursos de Contexto (3)')).toBeDefined();
    expect(screen.getByText('brand://vault/active')).toBeDefined();
    expect(screen.getByText('releases://active')).toBeDefined();
    expect(screen.getByText('metrics://summary/latest')).toBeDefined();

    expect(screen.getByText('Herramientas Agénticas (3)')).toBeDefined();
    expect(screen.getByText('mcp_crear_tarea')).toBeDefined();
    expect(screen.getByText('mcp_aprobar_entregable')).toBeDefined();
    expect(screen.getByText('mcp_consultar_metricas')).toBeDefined();
  });

  test('renders recent JSON-RPC audit logs', async () => {
    render(<McpServerStatus />);

    await waitFor(() => {
      expect(screen.getByText('Auditoría Reciente de Llamadas RPC')).toBeDefined();
      expect(screen.getByText('resources/read')).toBeDefined();
      expect(screen.getByText('vía Claude Desktop')).toBeDefined();
      expect(screen.getByText('tools/call')).toBeDefined();
      expect(screen.getByText('vía Cursor AI')).toBeDefined();
    });
  });

  test('refreshes server status when clicking refresh button', async () => {
    render(<McpServerStatus />);

    const refreshBtn = screen.getByTitle('Refrescar estado');
    fireEvent.click(refreshBtn);

    await waitFor(() => {
      expect(screen.getByText('MCP Activo (Puerto Local)')).toBeDefined();
    });
  });
});
