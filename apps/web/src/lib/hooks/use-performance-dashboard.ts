/**
 * @file use-performance-dashboard.ts
 * @layer Application
 * @description Application hook providing consolidated performance metrics, time-window filtering
 *              (PRE_RELEASE, DROP_WEEK, POST_RELEASE, ALL_TIME), and on-demand synchronization. Zero direct JSX.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  PerformanceMetricsSummary,
  TimeWindowFilter,
  StreamingSource,
} from '../pipelines/analytics/analytics-schemas';

export type { PerformanceMetricsSummary, TimeWindowFilter, StreamingSource };

export interface UsePerformanceDashboardOptions {
  releaseId: string;
  initialWindow?: TimeWindowFilter;
}

export interface UsePerformanceDashboardReturn {
  selectedWindow: TimeWindowFilter;
  setSelectedWindow: (window: TimeWindowFilter) => void;
  summary: PerformanceMetricsSummary | null;
  isLoading: boolean;
  error: string | null;
  refreshMetrics: () => Promise<void>;
}

/**
 * Reactive hook managing unified streaming metrics and phase-based time filters.
 *
 * @param options - Configuration including releaseId and optional initial window
 * @returns State and actions for the consolidated performance dashboard
 */
export function usePerformanceDashboard({
  releaseId,
  initialWindow = 'ALL_TIME',
}: UsePerformanceDashboardOptions): UsePerformanceDashboardReturn {
  // Step 1: Initialize filter and data states
  const [selectedWindow, setSelectedWindow] = useState<TimeWindowFilter>(initialWindow);
  const [summary, setSummary] = useState<PerformanceMetricsSummary | null>(null);
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Fetch and aggregate metrics for selected window
  const refreshMetrics = useCallback(async () => {
    if (!releaseId) {
      return;
    }

    setIsLoading(true);
    setError(null);

    try {
      // Step 2a: Mock placeholder / local repository query hook
      const simulatedSummary: PerformanceMetricsSummary = {
        totalStreams: 14250,
        totalListeners: 8900,
        totalSaves: 1240,
        streamsGrowthPct: 18.5,
        timeWindow: selectedWindow,
        topCountries: [
          { countryCode: 'MX', streams: 5800 },
          { countryCode: 'CO', streams: 3400 },
          { countryCode: 'ES', streams: 2600 },
          { countryCode: 'US', streams: 2450 },
        ],
      };

      setSummary(simulatedSummary);
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al sincronizar métricas de rendimiento');
    } finally {
      setIsLoading(false);
    }
  }, [releaseId, selectedWindow]);

  // Step 3: Trigger refresh on mount or window change asynchronously
  useEffect(() => {
    let active = true;
    if (!releaseId) return;

    const loadInitial = async () => {
      try {
        const simulatedSummary: PerformanceMetricsSummary = {
          totalStreams: 14250,
          totalListeners: 8900,
          totalSaves: 1240,
          streamsGrowthPct: 18.5,
          timeWindow: selectedWindow,
          topCountries: [
            { countryCode: 'MX', streams: 5800 },
            { countryCode: 'CO', streams: 3400 },
            { countryCode: 'ES', streams: 2600 },
            { countryCode: 'US', streams: 2450 },
          ],
        };
        if (active) {
          setSummary(simulatedSummary);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error al sincronizar métricas de rendimiento');
        }
      }
    };

    void loadInitial();

    return () => {
      active = false;
    };
  }, [releaseId, selectedWindow]);

  return {
    selectedWindow,
    setSelectedWindow,
    summary,
    isLoading,
    error,
    refreshMetrics,
  };
}
