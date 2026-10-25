/**
 * @file mcp-server-status.tsx
 * @layer Presentation
 * @description Local Model Context Protocol (MCP) server monitor: status badge,
 *              registered context resources, active AI tools catalog, and recent JSON-RPC audit logs.
 *              Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import {
  Server,
  Database,
  Wrench,
  CheckCircle2,
  RefreshCw,
  AlertCircle,
  FileCode,
  ShieldCheck,
} from 'lucide-react';
import {
  useMcpServer,
  McpResourceDefinition,
  McpToolDefinition,
  McpAuditLog,
} from '../../lib/hooks/use-mcp-server';

export interface McpServerStatusProps {
  className?: string;
}

/**
 * McpServerStatus presentation component.
 *
 * @param props - Component styling props
 * @returns JSX Element rendering the local MCP server dashboard
 */
export function McpServerStatus({ className = '' }: McpServerStatusProps): React.JSX.Element {
  // Step 1: Bind application hook
  const {
    isServerOnline,
    resources,
    tools,
    recentLogs,
    isLoading,
    error,
    refreshServerStatus,
  } = useMcpServer();

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step 2: Server Header with Online Status */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Server className="h-5 w-5 text-indigo-500" />
            Servidor MCP Local
          </h2>
          <p className="text-xs text-muted-foreground">
            Protocolo JSON-RPC 2.0 para Claude Desktop, Cursor y agentes externos
          </p>
        </div>

        <div className="flex items-center gap-2">
          <div
            className={`px-3 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${
              isServerOnline
                ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/30'
                : 'bg-red-500/10 text-red-500 border-red-500/30'
            }`}
          >
            <div
              className={`h-2 w-2 rounded-full ${
                isServerOnline ? 'bg-emerald-500 animate-pulse' : 'bg-red-500'
              }`}
            />
            <span>{isServerOnline ? 'MCP Activo (Puerto Local)' : 'Servidor Detenido'}</span>
          </div>

          <button
            type="button"
            onClick={() => void refreshServerStatus()}
            disabled={isLoading}
            className="p-1.5 rounded-lg border border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground disabled:opacity-50 transition-colors"
            title="Refrescar estado"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Step 3: Resources & Tools Catalogs Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        {/* Resources Section */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Database className="h-4 w-4 text-indigo-500" />
              <span>Recursos de Contexto ({resources.length})</span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Solo Lectura</span>
          </div>

          <div className="space-y-2">
            {resources.map((res: McpResourceDefinition) => (
              <div key={res.uri} className="p-2.5 rounded-lg bg-background/50 border border-border/40 text-xs">
                <div className="flex items-center justify-between font-mono text-[11px] font-bold text-indigo-400">
                  <span>{res.uri}</span>
                  <span className="text-[9px] text-muted-foreground">{res.mimeType}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{res.description}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Tools Section */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3">
          <div className="flex items-center justify-between border-b border-border/40 pb-2">
            <div className="flex items-center gap-1.5 text-xs font-bold text-foreground">
              <Wrench className="h-4 w-4 text-emerald-500" />
              <span>Herramientas Agénticas ({tools.length})</span>
            </div>
            <span className="text-[10px] text-muted-foreground uppercase font-mono">Ejecutables</span>
          </div>

          <div className="space-y-2">
            {tools.map((tool: McpToolDefinition) => (
              <div key={tool.name} className="p-2.5 rounded-lg bg-background/50 border border-border/40 text-xs">
                <div className="flex items-center gap-1.5 font-mono text-[11px] font-bold text-foreground">
                  <FileCode className="h-3.5 w-3.5 text-emerald-500" />
                  <span>{tool.name}</span>
                </div>
                <p className="text-[11px] text-muted-foreground mt-0.5">{tool.description}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* Step 4: MCP Protocol Audit Logs Table */}
      <div className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3">
        <div className="flex items-center justify-between border-b border-border/40 pb-2">
          <div className="flex items-center gap-2">
            <ShieldCheck className="h-4 w-4 text-indigo-500" />
            <h4 className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
              Auditoría Reciente de Llamadas RPC
            </h4>
          </div>
          <span className="text-[10px] text-muted-foreground">Persistido en SQLite</span>
        </div>

        {recentLogs.length === 0 ? (
          <p className="text-xs text-muted-foreground italic text-center py-4">
            Sin llamadas RPC registradas recientemente.
          </p>
        ) : (
          <div className="space-y-2">
            {recentLogs.map((log: McpAuditLog) => (
              <div
                key={log.id}
                className="p-2.5 rounded-lg bg-background/40 border border-border/40 flex items-center justify-between text-xs"
              >
                <div className="space-y-0.5">
                  <div className="flex items-center gap-2">
                    <span className="font-mono font-bold text-foreground">{log.method}</span>
                    <span className="text-[10px] text-muted-foreground">vía {log.clientInfo || 'cliente'}</span>
                  </div>
                  {log.paramsJson && (
                    <p className="font-mono text-[10px] text-muted-foreground truncate max-w-sm">
                      {log.paramsJson}
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  <span
                    className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                      log.status === 'SUCCESS'
                        ? 'bg-emerald-500/10 text-emerald-500'
                        : 'bg-red-500/10 text-red-500'
                    }`}
                  >
                    {log.status}
                  </span>
                  {log.status === 'SUCCESS' ? (
                    <CheckCircle2 className="h-3.5 w-3.5 text-emerald-500" />
                  ) : (
                    <AlertCircle className="h-3.5 w-3.5 text-red-500" />
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
