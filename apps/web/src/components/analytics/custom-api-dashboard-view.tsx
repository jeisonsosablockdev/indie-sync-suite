/**
 * @file custom-api-dashboard-view.tsx
 * @layer Presentation
 * @description Advanced Mode dynamic dashboard view rendering inferred widgets (KPI cards,
 *              time series, category distributions) from custom external REST endpoints.
 *              Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React, { useState } from 'react';
import {
  PlugZap,
  LayoutDashboard,
  LineChart,
  PieChart,
  Hash,
  Loader2,
  Check,
  Save,
  AlertCircle,
  ExternalLink,
} from 'lucide-react';
import {
  useCustomApiDashboard,
  InferredWidgetConfig,
} from '../../lib/hooks/use-custom-api-dashboard';

export interface CustomApiDashboardViewProps {
  initialEndpointUrl?: string;
  onDashboardSaved?: () => void;
  className?: string;
}

/**
 * CustomApiDashboardView presentation component.
 *
 * @param props - Component props including optional initial endpoint
 * @returns JSX Element rendering the dynamic API widget grid
 */
export function CustomApiDashboardView({
  initialEndpointUrl = '',
  onDashboardSaved,
  className = '',
}: CustomApiDashboardViewProps): React.JSX.Element {
  // Step 1: Bind application hook
  const {
    endpointUrl,
    setEndpointUrl,
    inferredWidgets,
    isTesting,
    isSaving,
    error,
    testAndInferEndpoint,
    saveDashboard,
  } = useCustomApiDashboard({ initialEndpointUrl });

  const [dashboardName, setDashboardName] = useState<string>('Mi Panel Personalizado');
  const [saveSuccess, setSaveSuccess] = useState<boolean>(false);

  // Step 2: Handle connection test
  const handleTestConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    await testAndInferEndpoint();
  };

  // Step 3: Handle dashboard configuration save
  const handleSave = async () => {
    const ok = await saveDashboard(dashboardName);
    if (ok) {
      setSaveSuccess(true);
      onDashboardSaved?.();
      setTimeout(() => setSaveSuccess(false), 3000);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step 4: Endpoint Connection Bar */}
      <div className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <PlugZap className="h-5 w-5 text-indigo-500" />
            <h3 className="text-sm font-bold text-foreground">Conexión a Endpoint REST Externo</h3>
          </div>
          <span className="text-[10px] uppercase font-bold text-muted-foreground bg-muted/60 px-2 py-0.5 rounded-sm">
            Modo Avanzado
          </span>
        </div>

        <form onSubmit={handleTestConnection} className="flex flex-col sm:flex-row gap-2">
          <input
            type="url"
            value={endpointUrl}
            onChange={(e) => setEndpointUrl(e.target.value)}
            placeholder="https://api.tu-servicio.com/v1/metrics"
            disabled={isTesting}
            className="flex-1 bg-background/60 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
          />
          <button
            type="submit"
            disabled={isTesting || !endpointUrl.trim()}
            className="px-4 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors shrink-0"
          >
            {isTesting ? (
              <>
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                <span>Inspeccionando...</span>
              </>
            ) : (
              <>
                <ExternalLink className="h-3.5 w-3.5" />
                <span>Conectar e Inferir</span>
              </>
            )}
          </button>
        </form>

        {error && (
          <div className="p-2.5 bg-red-500/10 border border-red-500/30 rounded-lg flex items-center gap-2 text-xs text-red-500">
            <AlertCircle className="h-4 w-4 shrink-0" />
            <span>{error}</span>
          </div>
        )}
      </div>

      {/* Step 5: Inferred Widgets Grid */}
      {inferredWidgets.length > 0 && (
        <div className="space-y-4">
          <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 border-b border-border/40 pb-3">
            <div className="flex items-center gap-2">
              <LayoutDashboard className="h-4 w-4 text-indigo-500" />
              <input
                type="text"
                value={dashboardName}
                onChange={(e) => setDashboardName(e.target.value)}
                className="bg-transparent font-bold text-sm text-foreground focus:outline-hidden focus:border-b border-indigo-500"
              />
            </div>

            <button
              type="button"
              onClick={() => void handleSave()}
              disabled={isSaving}
              className="px-3.5 py-1.5 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50 transition-colors"
            >
              {saveSuccess ? (
                <>
                  <Check className="h-3.5 w-3.5" />
                  <span>¡Guardado!</span>
                </>
              ) : (
                <>
                  <Save className="h-3.5 w-3.5" />
                  <span>Guardar Panel</span>
                </>
              )}
            </button>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
            {inferredWidgets.map((widget: InferredWidgetConfig, idx: number) => (
              <div
                key={idx}
                className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-2 flex flex-col justify-between"
              >
                <div className="flex items-center justify-between text-muted-foreground text-xs">
                  <span className="font-medium">{widget.title}</span>
                  {widget.type === 'KPI_CARD' && <Hash className="h-4 w-4 text-emerald-500" />}
                  {widget.type === 'TIME_SERIES' && <LineChart className="h-4 w-4 text-blue-500" />}
                  {widget.type === 'CATEGORY_PIE' && <PieChart className="h-4 w-4 text-purple-500" />}
                </div>

                <div className="py-2">
                  <span className="text-[11px] font-mono text-muted-foreground bg-muted/50 px-2 py-0.5 rounded-sm">
                    {widget.dataPath}
                  </span>
                  {widget.unit && (
                    <span className="ml-1.5 text-[10px] text-muted-foreground font-semibold">
                      ({widget.unit})
                    </span>
                  )}
                </div>

                <div className="text-[11px] text-muted-foreground flex items-center gap-1">
                  <span>Tipo inferido:</span>
                  <span className="font-semibold text-foreground">{widget.type}</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
