/**
 * @file sync-queue-monitor.tsx
 * @layer Presentation
 * @description Outbox queue monitoring dashboard table with real-time status indicators,
 *              retry counts, and dead-letter manual triggers. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import { Layers, RefreshCw, AlertTriangle, CheckCircle2, Clock, RotateCcw } from 'lucide-react';
import {
  useSyncQueue,
  SyncQueueItemState,
} from '../../lib/hooks/use-sync-queue';

export interface SyncQueueMonitorProps {
  initialItems?: SyncQueueItemState[];
}

const STATUS_ICONS: Record<
  string,
  { label: string; text: string; bg: string; icon: React.ElementType }
> = {
  PENDING: { label: 'Pendiente', text: 'text-amber-600', bg: 'bg-amber-50 dark:bg-amber-950/60', icon: Clock },
  PROCESSING: { label: 'En Proceso', text: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/60', icon: RefreshCw },
  SYNCED: { label: 'Sincronizado', text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/60', icon: CheckCircle2 },
  FAILED: { label: 'Fallido (Dead-Letter)', text: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/60', icon: AlertTriangle },
};

/**
 * SyncQueueMonitor presentation component.
 */
export function SyncQueueMonitor({ initialItems }: SyncQueueMonitorProps) {
  // Step 1: Bind application hook
  const {
    queueItems,
    pendingCount,
    failedCount,
    isLoading,
    refreshQueue,
    forceRetry,
  } = useSyncQueue({ initialItems });

  return (
    <div
      className="space-y-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6"
      data-testid="sync-queue-monitor"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-blue-50 dark:bg-blue-950/60 text-blue-600 dark:text-blue-400">
            <Layers className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Monitor de Cola Outbox & Sincronización Postiz
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Eventos pendientes: <span className="font-semibold text-zinc-800 dark:text-zinc-200">{pendingCount}</span> | Fallos activos: <span className="font-semibold text-rose-600">{failedCount}</span>
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refreshQueue()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Actualizar Cola
        </button>
      </div>

      {/* Queue Table */}
      {queueItems.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-500 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          La cola de sincronización está completamente vacía. Todos los eventos han sido procesados.
        </div>
      ) : (
        <div className="overflow-x-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
          <table className="w-full text-left text-xs">
            <thead className="bg-zinc-50 dark:bg-zinc-900 border-b border-zinc-200 dark:border-zinc-800 text-zinc-500 font-semibold uppercase text-[10px]">
              <tr>
                <th className="p-3">Agregado</th>
                <th className="p-3">Acción</th>
                <th className="p-3">Estado</th>
                <th className="p-3">Reintentos</th>
                <th className="p-3">Error / Detalle</th>
                <th className="p-3 text-right">Acción</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800">
              {queueItems.map((item) => {
                const statusCfg = STATUS_ICONS[item.status] ?? STATUS_ICONS.PENDING;
                const StatusIcon = statusCfg.icon;

                return (
                  <tr key={item.id} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-900/50 transition-colors">
                    <td className="p-3 font-mono font-medium text-zinc-800 dark:text-zinc-200">
                      {item.aggregateType} <span className="text-[10px] text-zinc-400">({item.aggregateId.slice(0, 6)})</span>
                    </td>
                    <td className="p-3 font-mono text-[11px] text-zinc-600 dark:text-zinc-400">
                      {item.action}
                    </td>
                    <td className="p-3">
                      <span
                        className={`inline-flex items-center gap-1 px-2 py-0.5 rounded text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        <StatusIcon className={`w-3 h-3 ${item.status === 'PROCESSING' ? 'animate-spin' : ''}`} />
                        {statusCfg.label}
                      </span>
                    </td>
                    <td className="p-3 font-mono text-[11px]">
                      {item.retryCount} / 3
                    </td>
                    <td className="p-3 text-zinc-500 max-w-xs truncate">
                      {item.errorMessage ? (
                        <span className="text-rose-600 dark:text-rose-400">{item.errorMessage}</span>
                      ) : (
                        '—'
                      )}
                    </td>
                    <td className="p-3 text-right">
                      {item.status === 'FAILED' && (
                        <button
                          type="button"
                          onClick={() => forceRetry(item.id)}
                          className="inline-flex items-center gap-1 text-[11px] font-semibold text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                        >
                          <RotateCcw className="w-3 h-3" />
                          Reintentar
                        </button>
                      )}
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
