/**
 * @file planner-tool-badge.tsx
 * @layer Presentation
 * @description Visual badge rendering execution status, risk tier (Tier 1 safe vs Tier 2 guardrail),
 *              and parameter summary for Release Planner AI tools.
 */

'use client';

import React from 'react';
import {
  PLANNER_TOOLS_DEFINITIONS,
  PlannerToolName,
  PlannerToolDefinitionMeta,
} from '../../lib/pipelines/planner/tools/planner-tools';

export type PlannerToolStatus = 'REQUESTED' | 'CONFIRMING' | 'EXECUTING' | 'EXECUTED' | 'FAILED';

export interface PlannerToolBadgeProps {
  toolName: PlannerToolName;
  status: PlannerToolStatus;
  paramsSummary?: string;
  error?: string;
  onConfirmGuardrail?: () => void;
  className?: string;
}

const STATUS_CONFIG: Record<
  PlannerToolStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  REQUESTED: {
    label: 'Solicitada',
    bg: 'bg-zinc-100 dark:bg-zinc-800',
    text: 'text-zinc-600 dark:text-zinc-300',
    border: 'border-zinc-300 dark:border-zinc-700',
  },
  CONFIRMING: {
    label: 'Requiere Autorización',
    bg: 'bg-amber-100 dark:bg-amber-950/60',
    text: 'text-amber-800 dark:text-amber-300',
    border: 'border-amber-300 dark:border-amber-800',
  },
  EXECUTING: {
    label: 'Ejecutando',
    bg: 'bg-blue-100 dark:bg-blue-950/60',
    text: 'text-blue-800 dark:text-blue-300',
    border: 'border-blue-300 dark:border-blue-800',
  },
  EXECUTED: {
    label: 'Completada',
    bg: 'bg-emerald-100 dark:bg-emerald-950/60',
    text: 'text-emerald-800 dark:text-emerald-300',
    border: 'border-emerald-300 dark:border-emerald-800',
  },
  FAILED: {
    label: 'Fallida',
    bg: 'bg-rose-100 dark:bg-rose-950/60',
    text: 'text-rose-800 dark:text-rose-300',
    border: 'border-rose-300 dark:border-rose-800',
  },
};

export function PlannerToolBadge({
  toolName,
  status,
  paramsSummary,
  error,
  onConfirmGuardrail,
  className = '',
}: PlannerToolBadgeProps) {
  // Step 1: Look up definition and risk tier
  const def = PLANNER_TOOLS_DEFINITIONS.find((t: PlannerToolDefinitionMeta) => t.name === toolName);
  const isTier2 = def?.riskTier === 2;
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.REQUESTED;

  return (
    <div
      role="status"
      aria-label={`Herramienta de Planificador ${toolName}: ${config.label}`}
      className={`inline-flex flex-col gap-1.5 my-1.5 p-3 rounded-xl border text-xs font-mono shadow-sm ${config.bg} ${config.border} ${className}`}
      data-testid={`planner-tool-badge-${toolName}`}
    >
      <div className="flex items-center justify-between gap-3">
        <div className="flex items-center gap-2">
          <span className="font-bold text-zinc-900 dark:text-zinc-100">
            {toolName}
          </span>
          {isTier2 ? (
            <span
              className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-amber-500 text-white dark:bg-amber-600"
              title="Tier 2: Modificación de Base de Datos - Requiere confirmación humana"
            >
              Tier 2
            </span>
          ) : (
            <span
              className="px-1.5 py-0.2 rounded text-[10px] font-bold uppercase tracking-wider bg-zinc-300 dark:bg-zinc-700 text-zinc-800 dark:text-zinc-200"
              title="Tier 1: Solo lectura"
            >
              Tier 1
            </span>
          )}
        </div>

        <span
          className={`px-2 py-0.5 rounded text-[10px] uppercase font-bold border ${config.border} ${config.text}`}
        >
          {config.label}
        </span>
      </div>

      {paramsSummary && (
        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-sans truncate max-w-sm">
          {paramsSummary}
        </div>
      )}

      {status === 'CONFIRMING' && onConfirmGuardrail && (
        <div className="pt-1 flex items-center justify-end">
          <button
            type="button"
            onClick={onConfirmGuardrail}
            className="px-2.5 py-1 text-[11px] font-semibold rounded bg-amber-600 hover:bg-amber-700 text-white transition shadow-sm font-sans"
            data-testid="guardrail-confirm-btn"
          >
            Autorizar Ejecución
          </button>
        </div>
      )}

      {error && (
        <div className="text-[11px] text-rose-600 dark:text-rose-400 font-sans">
          Error: {error}
        </div>
      )}
    </div>
  );
}
