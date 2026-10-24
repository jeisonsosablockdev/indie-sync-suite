/**
 * @file anomaly-alert-banner.tsx
 * @layer Presentation
 * @description Proactive anomaly notification banner highlighting performance drops (>30%)
 *              or opportunity spikes (>50%) with 1-click tactical resolution. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React, { useState } from 'react';
import {
  AlertTriangle,
  TrendingUp,
  Zap,
  X,
  CheckCircle2,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  useAnomalyDetector,
  AnomalyAlert,
  AnomalySeverity,
} from '../../lib/hooks/use-anomaly-detector';

export interface AnomalyAlertBannerProps {
  releaseId: string;
  initialAlerts?: AnomalyAlert[];
  onActionExecuted?: (alertId: string) => void;
  className?: string;
}

const SEVERITY_CONFIG: Record<
  AnomalySeverity,
  { bg: string; border: string; text: string; icon: React.ReactNode }
> = {
  CRITICAL: {
    bg: 'bg-red-500/10',
    border: 'border-red-500/30',
    text: 'text-red-500',
    icon: <AlertTriangle className="h-4 w-4 text-red-500 shrink-0" />,
  },
  WARNING: {
    bg: 'bg-amber-500/10',
    border: 'border-amber-500/30',
    text: 'text-amber-500',
    icon: <AlertTriangle className="h-4 w-4 text-amber-500 shrink-0" />,
  },
  OPPORTUNITY: {
    bg: 'bg-emerald-500/10',
    border: 'border-emerald-500/30',
    text: 'text-emerald-500',
    icon: <TrendingUp className="h-4 w-4 text-emerald-500 shrink-0" />,
  },
};

/**
 * AnomalyAlertBanner presentation component.
 *
 * @param props - Component props including releaseId and optional initial alerts
 * @returns JSX Element rendering pro-active warning cards
 */
export function AnomalyAlertBanner({
  releaseId,
  initialAlerts = [],
  onActionExecuted,
  className = '',
}: AnomalyAlertBannerProps): React.JSX.Element | null {
  // Step 1: Bind application hook
  const {
    activeAlerts,
    executeTacticalAction,
    dismissAlert,
  } = useAnomalyDetector({ releaseId, initialAlerts });

  const [executingId, setExecutingId] = useState<string | null>(null);

  if (activeAlerts.length === 0) {
    return null;
  }

  // Step 2: Handle 1-click tactical resolution
  const handleExecute = async (alertId: string) => {
    setExecutingId(alertId);
    const ok = await executeTacticalAction(alertId);
    if (ok) {
      onActionExecuted?.(alertId);
    }
    setExecutingId(null);
  };

  return (
    <div className={`space-y-2.5 ${className}`}>
      {/* Step 3: Map active alerts */}
      {activeAlerts.map((alert) => {
        const config = SEVERITY_CONFIG[alert.severity];
        const isExecuting = executingId === alert.id;

        return (
          <div
            key={alert.id}
            className={`p-3.5 rounded-xl border flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs transition-colors ${config.bg} ${config.border}`}
          >
            <div className="flex items-start gap-2.5 flex-1">
              {config.icon}
              <div className="space-y-0.5">
                <div className="flex items-center gap-2">
                  <span className={`font-bold uppercase tracking-wider text-[10px] ${config.text}`}>
                    {alert.severity === 'OPPORTUNITY' ? 'Oportunidad de Crecimiento' : 'Alerta de Rendimiento'}
                  </span>
                  <span className="font-mono text-muted-foreground text-[10px]">
                    {alert.changePct > 0 ? `+${alert.changePct}%` : `${alert.changePct}%`} vs media 7 días
                  </span>
                </div>
                <p className="text-foreground font-medium flex items-center gap-1.5">
                  <Sparkles className="h-3 w-3 text-indigo-400 shrink-0" />
                  {alert.tacticalSuggestion}
                </p>
              </div>
            </div>

            {/* Step 4: 1-Click Action & Dismiss Buttons */}
            <div className="flex items-center gap-2 w-full sm:w-auto justify-end shrink-0 pt-2 sm:pt-0 border-t sm:border-t-0 border-border/20">
              <button
                type="button"
                onClick={() => void handleExecute(alert.id)}
                disabled={isExecuting}
                className="px-3 py-1.5 rounded-lg bg-foreground text-background hover:bg-foreground/90 font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
              >
                {isExecuting ? (
                  <>
                    <Loader2 className="h-3 w-3 animate-spin" />
                    <span>Aplicando...</span>
                  </>
                ) : (
                  <>
                    <Zap className="h-3 w-3" />
                    <span>Aplicar Táctica</span>
                  </>
                )}
              </button>

              <button
                type="button"
                onClick={() => dismissAlert(alert.id)}
                className="p-1.5 rounded-lg text-muted-foreground hover:text-foreground hover:bg-background/40 transition-colors"
                title="Descartar alerta"
              >
                <X className="h-4 w-4" />
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
