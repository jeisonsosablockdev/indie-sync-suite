/**
 * @file gatekeeper-alert-banner.tsx
 * @layer Presentation
 * @description Real-time alert banner alerting about overdue Gatekeeper tasks or DSP distribution window violations.
 */

'use client';

import React from 'react';
import {
  BlockedGatekeeperResult,
  DspWindowEvaluation,
} from '../../lib/pipelines/planner/gatekeeper-engine';

export interface GatekeeperAlertBannerProps {
  overdueAlerts: BlockedGatekeeperResult[];
  dspEvaluation?: DspWindowEvaluation | null;
}

export function GatekeeperAlertBanner({
  overdueAlerts,
  dspEvaluation,
}: GatekeeperAlertBannerProps) {
  const hasAlerts = overdueAlerts.length > 0 || (dspEvaluation?.isViolated ?? false);

  if (!hasAlerts) return null;

  return (
    <div
      className="w-full rounded-xl border border-rose-300 dark:border-rose-900/60 bg-rose-50/70 dark:bg-rose-950/30 p-4 space-y-3 animate-fade-in shadow-sm"
      role="alert"
      data-testid="gatekeeper-alert-banner"
    >
      <div className="flex items-center gap-2">
        <span className="text-lg">⚠️</span>
        <h4 className="text-sm font-bold text-rose-900 dark:text-rose-200">
          Atención Requerida: Riesgo en la Cadena Crítica de Lanzamiento
        </h4>
      </div>

      {/* DSP Delivery Window Violation */}
      {dspEvaluation?.isViolated && (
        <div className="text-xs text-rose-800 dark:text-rose-300 bg-rose-100/60 dark:bg-rose-900/30 p-3 rounded-lg border border-rose-200 dark:border-rose-800/40 space-y-1">
          <p className="font-semibold">
            🚨 Violación de Ventana DSP ({dspEvaluation.deficitDays} días de déficit)
          </p>
          <p>
            {dspEvaluation.actionMessage ||
              'La entrega de metadatos o master audio excede el margen mínimo de 7 días antes de T-0 requerido por distribuidoras.'}
          </p>
        </div>
      )}

      {/* Overdue Gatekeepers */}
      {overdueAlerts.length > 0 && (
        <div className="space-y-1.5 pt-1">
          <span className="text-[11px] font-bold uppercase tracking-wider text-rose-700 dark:text-rose-400">
            Hitos Gatekeeper Vencidos:
          </span>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
            {overdueAlerts.map(alert => (
              <div
                key={alert.task.id}
                className="text-xs p-2 rounded bg-white/60 dark:bg-zinc-900/60 border border-rose-200 dark:border-rose-900/40 flex items-center justify-between"
              >
                <span className="font-medium text-zinc-900 dark:text-zinc-100 truncate pr-2">
                  {alert.task.title}
                </span>
                <span className="text-rose-600 dark:text-rose-400 font-mono text-[11px] shrink-0">
                  {alert.overdueDays}d tarde
                </span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
