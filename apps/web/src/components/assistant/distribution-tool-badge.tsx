/**
 * @file distribution-tool-badge.tsx
 * @layer Presentation
 * @description Visual badge rendering execution status, risk tier (Tier 1 safe vs Tier 2 guardrail),
 *              and parameter summary for Distribution & Ads AI tools in the assistant chat. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import { Share2, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export type DistributionToolName =
  | 'programar_publicacion'
  | 'lanzar_campana_pauta'
  | 'consultar_calendario_posts';

export type DistributionToolStatus =
  | 'REQUESTED'
  | 'CONFIRMING'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED';

export interface DistributionToolBadgeProps {
  toolName: DistributionToolName;
  status: DistributionToolStatus;
  paramsSummary?: string;
  error?: string;
  onConfirmGuardrail?: () => void;
  className?: string;
}

const TOOL_METADATA: Record<
  DistributionToolName,
  { label: string; riskTier: 1 | 2; description: string }
> = {
  programar_publicacion: {
    label: 'Programar Publicación',
    riskTier: 1,
    description: 'Agenda post en canales sociales oficiales',
  },
  lanzar_campana_pauta: {
    label: 'Lanzar Pauta Programática',
    riskTier: 2,
    description: 'Activa anuncios de $20–$100 USD en Meta/TikTok Ads',
  },
  consultar_calendario_posts: {
    label: 'Consultar Calendario de Posts',
    riskTier: 1,
    description: 'Consulta publicaciones sincronizadas con T-0',
  },
};

const STATUS_CONFIG: Record<
  DistributionToolStatus,
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
    bg: 'bg-indigo-100 dark:bg-indigo-950/60',
    text: 'text-indigo-800 dark:text-indigo-300',
    border: 'border-indigo-300 dark:border-indigo-800',
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

/**
 * DistributionToolBadge presentation component.
 */
export function DistributionToolBadge({
  toolName,
  status,
  paramsSummary,
  error,
  onConfirmGuardrail,
  className = '',
}: DistributionToolBadgeProps) {
  // Step 1: Resolve metadata & configuration
  const meta = TOOL_METADATA[toolName] ?? {
    label: toolName,
    riskTier: 1,
    description: 'Herramienta de distribución multicanal',
  };
  const statusCfg = STATUS_CONFIG[status] ?? STATUS_CONFIG.REQUESTED;

  return (
    <div
      className={`rounded-xl border p-3 text-xs space-y-2 transition-all ${statusCfg.bg} ${statusCfg.border} ${className}`}
      data-testid={`distribution-tool-badge-${toolName}`}
    >
      {/* Header Row */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-1.5 font-semibold text-zinc-900 dark:text-zinc-100">
          <Share2 className="w-3.5 h-3.5 text-indigo-500" />
          <span>{meta.label}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {/* Risk Tier Badge */}
          {meta.riskTier === 2 ? (
            <span className="px-1.5 py-0.2 rounded bg-amber-200 dark:bg-amber-900/80 text-amber-900 dark:text-amber-200 text-[10px] font-bold flex items-center gap-1">
              <ShieldAlert className="w-3 h-3" /> Tier 2 (Guardrail)
            </span>
          ) : (
            <span className="px-1.5 py-0.2 rounded bg-zinc-200 dark:bg-zinc-700 text-zinc-700 dark:text-zinc-300 text-[10px] font-medium">
              Tier 1 (Safe)
            </span>
          )}

          {/* Status Badge */}
          <span
            className={`px-2 py-0.5 rounded-full font-medium text-[10px] flex items-center gap-1 ${statusCfg.text}`}
          >
            {status === 'EXECUTING' && <Loader2 className="w-2.5 h-2.5 animate-spin" />}
            {status === 'EXECUTED' && <CheckCircle2 className="w-2.5 h-2.5 text-emerald-600" />}
            {status === 'FAILED' && <AlertTriangle className="w-2.5 h-2.5 text-rose-600" />}
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Description / Summary */}
      {paramsSummary && (
        <div className="text-[11px] text-zinc-600 dark:text-zinc-400 font-mono bg-white/50 dark:bg-black/20 p-2 rounded-lg border border-black/5 dark:border-white/5">
          {paramsSummary}
        </div>
      )}

      {/* Error Details */}
      {error && (
        <div className="text-[11px] text-rose-700 dark:text-rose-400 bg-rose-50 dark:bg-rose-950/40 p-2 rounded-lg border border-rose-200 dark:border-rose-900">
          {error}
        </div>
      )}

      {/* Confirmation Button for Guardrail Tier 2 */}
      {status === 'CONFIRMING' && onConfirmGuardrail && (
        <div className="pt-1 flex justify-end">
          <button
            type="button"
            onClick={onConfirmGuardrail}
            className="px-3 py-1 text-xs font-semibold rounded-lg bg-amber-600 hover:bg-amber-500 text-white shadow-sm transition-colors"
          >
            Autorizar Ejecución
          </button>
        </div>
      )}
    </div>
  );
}
