/**
 * @file analytics-tool-badge.tsx
 * @layer Presentation
 * @description Visual badge rendering execution status, risk tier (Tier 1 safe vs Tier 2 guardrail),
 *              and parameter summary for Analytics & Custom Dashboard AI tools in the assistant chat.
 *              Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import { BarChart3, ShieldAlert, CheckCircle2, AlertTriangle, Loader2 } from 'lucide-react';

export type AnalyticsToolName =
  | 'consultar_metricas_rendimiento'
  | 'analizar_eficiencia_pauta'
  | 'generar_panel_custom';

export type AnalyticsToolStatus =
  | 'REQUESTED'
  | 'CONFIRMING'
  | 'EXECUTING'
  | 'EXECUTED'
  | 'FAILED';

export interface AnalyticsToolBadgeProps {
  toolName: AnalyticsToolName;
  status: AnalyticsToolStatus;
  paramsSummary?: string;
  error?: string;
  onConfirmGuardrail?: () => void;
  className?: string;
}

const TOOL_METADATA: Record<
  AnalyticsToolName,
  { label: string; riskTier: 1 | 2; description: string }
> = {
  consultar_metricas_rendimiento: {
    label: 'Consultar Métricas de Rendimiento',
    riskTier: 1,
    description: 'Consulta reproducciones, oyentes y conversiones por ventana temporal',
  },
  analizar_eficiencia_pauta: {
    label: 'Analizar Eficiencia de Pauta',
    riskTier: 1,
    description: 'Calcula CPA, CPC y tasa de conversión sobre presupuesto publicitario',
  },
  generar_panel_custom: {
    label: 'Generar Panel Custom API',
    riskTier: 2,
    description: 'Configura un panel dinámico conectado a endpoint externo con Guardrail',
  },
};

const STATUS_CONFIG: Record<
  AnalyticsToolStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  REQUESTED: {
    label: 'Solicitada',
    bg: 'bg-muted/50',
    text: 'text-muted-foreground',
    border: 'border-border/60',
  },
  CONFIRMING: {
    label: 'Requiere Confirmación',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/40',
  },
  EXECUTING: {
    label: 'Ejecutando...',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/40',
  },
  EXECUTED: {
    label: 'Ejecutada',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/40',
  },
  FAILED: {
    label: 'Falló',
    bg: 'bg-red-500/10',
    text: 'text-red-500',
    border: 'border-red-500/40',
  },
};

/**
 * AnalyticsToolBadge presentation component.
 *
 * @param props - Component props including tool name, status, and handlers
 * @returns JSX Element rendering the inline tool status badge
 */
export function AnalyticsToolBadge({
  toolName,
  status,
  paramsSummary,
  error,
  onConfirmGuardrail,
  className = '',
}: AnalyticsToolBadgeProps): React.JSX.Element {
  // Step 1: Resolve metadata and status styling
  const meta = TOOL_METADATA[toolName] ?? {
    label: toolName,
    riskTier: 1 as const,
    description: 'Herramienta de analítica',
  };
  const statusCfg = STATUS_CONFIG[status];

  return (
    <div
      className={`rounded-xl border p-3.5 space-y-2 text-xs transition-colors ${statusCfg.bg} ${statusCfg.border} ${className}`}
    >
      {/* Step 2: Badge Header with Tool Name and Risk Tier */}
      <div className="flex items-center justify-between gap-2">
        <div className="flex items-center gap-2">
          <div className="p-1 rounded-md bg-background/60 border border-border/50 text-indigo-500">
            <BarChart3 className="h-3.5 w-3.5" />
          </div>
          <span className="font-bold text-foreground">{meta.label}</span>
        </div>

        <div className="flex items-center gap-1.5">
          {meta.riskTier === 2 ? (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-amber-500/20 text-amber-500 border border-amber-500/40 flex items-center gap-1"
              title="Tier 2: Requiere confirmación explícita del usuario"
            >
              <ShieldAlert className="h-3 w-3" />
              Guardrail Tier 2
            </span>
          ) : (
            <span
              className="px-2 py-0.5 rounded-full text-[10px] font-semibold bg-emerald-500/10 text-emerald-500 border border-emerald-500/30"
              title="Tier 1: Operación segura de solo lectura o cómputo local"
            >
              Safe Tier 1
            </span>
          )}

          <span className={`px-2 py-0.5 rounded-full text-[10px] font-semibold ${statusCfg.text}`}>
            {statusCfg.label}
          </span>
        </div>
      </div>

      {/* Step 3: Tool Description and Parameter Summary */}
      <p className="text-[11px] text-muted-foreground">{meta.description}</p>

      {paramsSummary && (
        <div className="p-2 rounded-lg bg-background/40 border border-border/40 font-mono text-[10px] text-foreground/80 break-all">
          {paramsSummary}
        </div>
      )}

      {/* Step 4: Guardrail Confirmation Prompt for Tier 2 */}
      {status === 'CONFIRMING' && meta.riskTier === 2 && onConfirmGuardrail && (
        <div className="pt-1.5 flex items-center justify-between gap-2 border-t border-amber-500/20">
          <span className="text-[11px] text-amber-500 font-medium">
            Se requiere autorización previa para configurar este panel.
          </span>
          <button
            type="button"
            onClick={onConfirmGuardrail}
            className="px-3 py-1 rounded-md bg-amber-500 hover:bg-amber-600 text-white font-semibold text-[11px] transition-colors"
          >
            Confirmar y Ejecutar
          </button>
        </div>
      )}

      {/* Step 5: Execution Status Indicators */}
      {status === 'EXECUTING' && (
        <div className="flex items-center gap-1.5 text-blue-500 text-[11px]">
          <Loader2 className="h-3 w-3 animate-spin" />
          <span>Procesando analítica...</span>
        </div>
      )}

      {status === 'EXECUTED' && (
        <div className="flex items-center gap-1.5 text-emerald-500 text-[11px]">
          <CheckCircle2 className="h-3 w-3" />
          <span>Métricas calculadas exitosamente</span>
        </div>
      )}

      {status === 'FAILED' && error && (
        <div className="flex items-center gap-1.5 text-red-500 text-[11px]">
          <AlertTriangle className="h-3 w-3 shrink-0" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
