/**
 * @file performance-dashboard-view.tsx
 * @layer Presentation
 * @description Centralized performance analytics dashboard displaying consolidated streaming metrics,
 *              listener growth, country distributions, and release phase time-window filters.
 *              Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import {
  TrendingUp,
  Headphones,
  Bookmark,
  RefreshCw,
  Globe,
  Radio,
  AlertCircle,
} from 'lucide-react';
import {
  usePerformanceDashboard,
  TimeWindowFilter,
} from '../../lib/hooks/use-performance-dashboard';

export interface PerformanceDashboardViewProps {
  releaseId: string;
  initialWindow?: TimeWindowFilter;
  className?: string;
}

const TIME_WINDOW_LABELS: Record<TimeWindowFilter, { label: string; description: string }> = {
  PRE_RELEASE: { label: 'Pre-Release', description: 'T-14 a T-1' },
  DROP_WEEK: { label: 'Drop Week', description: 'T-0 a T+7' },
  POST_RELEASE: { label: 'Post-Release', description: 'T+8 en adelante' },
  ALL_TIME: { label: 'Histórico', description: 'Consolidado total' },
};

/**
 * Performance dashboard presentation view displaying KPIs and audience breakdowns.
 *
 * @param props - Component properties including releaseId
 * @returns JSX Element rendering the unified dashboard
 */
export function PerformanceDashboardView({
  releaseId,
  initialWindow = 'ALL_TIME',
  className = '',
}: PerformanceDashboardViewProps): React.JSX.Element {
  // Step 1: Bind application hook
  const {
    selectedWindow,
    setSelectedWindow,
    summary,
    isLoading,
    error,
    refreshMetrics,
  } = usePerformanceDashboard({ releaseId, initialWindow });

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step 2: Header with Time-Window Filter Tabs & Refresh Action */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-xl font-bold tracking-tight text-foreground flex items-center gap-2">
            <Radio className="h-5 w-5 text-indigo-500" />
            Rendimiento del Lanzamiento
          </h2>
          <p className="text-xs text-muted-foreground">
            Métricas unificadas de streaming y alcance por fase temporal
          </p>
        </div>

        <div className="flex items-center gap-2 w-full sm:w-auto">
          <div className="flex bg-muted/50 p-1 rounded-lg border border-border/50 text-xs">
            {(Object.keys(TIME_WINDOW_LABELS) as TimeWindowFilter[]).map((windowKey) => (
              <button
                key={windowKey}
                type="button"
                onClick={() => setSelectedWindow(windowKey)}
                className={`px-3 py-1.5 rounded-md font-medium transition-colors ${
                  selectedWindow === windowKey
                    ? 'bg-background text-foreground shadow-xs'
                    : 'text-muted-foreground hover:text-foreground'
                }`}
                title={TIME_WINDOW_LABELS[windowKey].description}
              >
                {TIME_WINDOW_LABELS[windowKey].label}
              </button>
            ))}
          </div>

          <button
            type="button"
            onClick={() => void refreshMetrics()}
            disabled={isLoading}
            className="p-2 rounded-lg border border-border/50 hover:bg-muted/50 text-muted-foreground hover:text-foreground transition-colors disabled:opacity-50"
            title="Sincronizar métricas"
          >
            <RefreshCw className={`h-4 w-4 ${isLoading ? 'animate-spin' : ''}`} />
          </button>
        </div>
      </div>

      {/* Step 3: Error Feedback Banner */}
      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-500">
          <AlertCircle className="h-4 w-4 shrink-0" />
          <span>{error}</span>
        </div>
      )}

      {/* Step 4: KPI Metric Cards Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        {/* Total Streams */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Reproducciones Totales</span>
            <Radio className="h-4 w-4 text-emerald-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {isLoading ? '...' : summary ? summary.totalStreams.toLocaleString() : '0'}
          </div>
          {summary?.streamsGrowthPct !== undefined && (
            <div className="flex items-center gap-1 text-xs text-emerald-500 mt-2 font-medium">
              <TrendingUp className="h-3.5 w-3.5" />
              <span>+{summary.streamsGrowthPct}% vs período anterior</span>
            </div>
          )}
        </div>

        {/* Unique Listeners */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Oyentes Únicos</span>
            <Headphones className="h-4 w-4 text-blue-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {isLoading ? '...' : summary ? summary.totalListeners.toLocaleString() : '0'}
          </div>
          <span className="text-xs text-muted-foreground mt-2">Audiencia neta alcanzada</span>
        </div>

        {/* Track Saves */}
        <div className="p-4 rounded-xl border border-border/50 bg-card/50 flex flex-col justify-between">
          <div className="flex items-center justify-between text-muted-foreground text-xs mb-2">
            <span>Guardados en Biblioteca</span>
            <Bookmark className="h-4 w-4 text-purple-500" />
          </div>
          <div className="text-2xl font-black text-foreground">
            {isLoading ? '...' : summary ? summary.totalSaves.toLocaleString() : '0'}
          </div>
          <span className="text-xs text-muted-foreground mt-2">Intención de escucha a largo plazo</span>
        </div>
      </div>

      {/* Step 5: Top Geographic Distribution */}
      {summary && summary.topCountries.length > 0 && (
        <div className="p-4 rounded-xl border border-border/50 bg-card/30 space-y-3">
          <h3 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider flex items-center gap-2">
            <Globe className="h-4 w-4 text-indigo-500" />
            Top Países por Escuchas
          </h3>

          <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
            {summary.topCountries.map((c) => (
              <div
                key={c.countryCode}
                className="p-2.5 rounded-lg border border-border/40 bg-background/50 flex items-center justify-between text-xs"
              >
                <span className="font-mono font-bold text-foreground">{c.countryCode}</span>
                <span className="text-muted-foreground font-medium">{c.streams.toLocaleString()}</span>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
