/**
 * @file use-mcp-server.ts
 * @layer Application
 * @description Application hook providing real-time visibility into local MCP server status,
 *              registered resources (`brand://`, `releases://`), active tools, and recent audit logs. Zero direct JSX.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  McpResourceDefinition,
  McpToolDefinition,
  MCP_RESOURCES_CATALOG,
  MCP_TOOLS_CATALOG,
} from '../pipelines/mcp/mcp-server-handler';
import { McpAuditLog } from '../pipelines/portal/portal-schemas';

export type { McpResourceDefinition, McpToolDefinition, McpAuditLog };

export interface UseMcpServerReturn {
  isServerOnline: boolean;
  resources: McpResourceDefinition[];
  tools: McpToolDefinition[];
  recentLogs: McpAuditLog[];
  isLoading: boolean;
  error: string | null;
  refreshServerStatus: () => Promise<void>;
}

/**
 * Reactive application hook for monitoring the local Model Context Protocol server.
 *
 * @returns State and actions for local MCP server status and audit logs
 */
export function useMcpServer(): UseMcpServerReturn {
  // Step 1: Initialize states
  const [isServerOnline, setIsServerOnline] = useState<boolean>(true);
  const [resources, setResources] = useState<McpResourceDefinition[]>(MCP_RESOURCES_CATALOG);
  const [tools, setTools] = useState<McpToolDefinition[]>(MCP_TOOLS_CATALOG);
  const [recentLogs, setRecentLogs] = useState<McpAuditLog[]>([]);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Refresh server status and logs
  const refreshServerStatus = useCallback(async () => {
    setIsLoading(true);
    setError(null);

    try {
      // Step 2a: Mock placeholder / local repository audit logs
      const sampleLogs: McpAuditLog[] = [
        {
          id: 'log-1',
          method: 'resources/read',
          paramsJson: '{"uri":"brand://vault/active"}',
          clientInfo: 'Claude Desktop',
          status: 'SUCCESS',
          createdAt: new Date().toISOString(),
        },
        {
          id: 'log-2',
          method: 'tools/call',
          paramsJson: '{"name":"mcp_consultar_metricas"}',
          clientInfo: 'Cursor AI',
          status: 'SUCCESS',
          createdAt: new Date(Date.now() - 120000).toISOString(),
        },
      ];

      setRecentLogs(sampleLogs);
      setIsServerOnline(true);
      setResources(MCP_RESOURCES_CATALOG);
      setTools(MCP_TOOLS_CATALOG);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar estado MCP');
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Step 3: Load initial logs asynchronously on mount
  useEffect(() => {
    let active = true;

    const loadInitial = async () => {
      try {
        const sampleLogs: McpAuditLog[] = [
          {
            id: 'log-1',
            method: 'resources/read',
            paramsJson: '{"uri":"brand://vault/active"}',
            clientInfo: 'Claude Desktop',
            status: 'SUCCESS',
            createdAt: new Date().toISOString(),
          },
          {
            id: 'log-2',
            method: 'tools/call',
            paramsJson: '{"name":"mcp_consultar_metricas"}',
            clientInfo: 'Cursor AI',
            status: 'SUCCESS',
            createdAt: new Date(Date.now() - 120000).toISOString(),
          },
        ];
        if (active) {
          setRecentLogs(sampleLogs);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error al cargar logs iniciales');
        }
      }
    };

    void loadInitial();

    return () => {
      active = false;
    };
  }, []);

  return {
    isServerOnline,
    resources,
    tools,
    recentLogs,
    isLoading,
    error,
    refreshServerStatus,
  };
}
