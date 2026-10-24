/**
 * @file anomaly-detection-engine.ts
 * @layer Domain
 * @description Pure heuristic anomaly detection engine comparing current streaming/ad performance
 *              against 7-day rolling baselines to detect drops (>30%) and opportunity spikes (>50%).
 *              Zero network I/O, zero classes.
 */

import {
  AnomalyAlert,
  AnomalyAlertSchema,
  AnomalyMetricType,
} from './analytics-schemas';

export interface DailyMetricPoint {
  date: string; // YYYY-MM-DD
  value: number;
}

export interface MetricStreamSeries {
  releaseId: string;
  metricType: AnomalyMetricType;
  history: DailyMetricPoint[]; // Should contain up to 7 prior days
  currentPoint: DailyMetricPoint; // Today's metric point
  regionOrChannel?: string;
}

/**
 * Calculates simple arithmetic moving average over an array of numbers.
 *
 * @param values - Array of historical numbers
 * @returns Average value, or 0 if array is empty
 */
export function calculateRollingAverage(values: number[]): number {
  // Step 1: Check for empty input
  if (values.length === 0) {
    return 0;
  }

  // Step 2: Sum and divide
  const sum = values.reduce((acc, v) => acc + v, 0);
  return Number((sum / values.length).toFixed(2));
}

/**
 * Formulates tactical action suggestion based on metric type and deviation pattern.
 *
 * @param metricType - Type of metric (STREAMS, ENGAGEMENT, CONVERSIONS)
 * @param changePct - Percentage of change compared to baseline
 * @param regionOrChannel - Optional identifier of platform or country
 * @returns Actionable tactical recommendation string
 */
export function generateTacticalSuggestion(
  metricType: AnomalyMetricType,
  changePct: number,
  regionOrChannel?: string
): string {
  // Step 1: Tactical suggestions for negative drops
  if (changePct <= -30) {
    if (metricType === 'CONVERSIONS') {
      return 'Pausar creativos con CPA elevado y redistribuir presupuesto a audiencias similares.';
    }
    if (metricType === 'STREAMS') {
      return 'Activar publicación de refuerzo con fragmento acústico o behind-the-scenes en redes.';
    }
    return 'Lanzar sondeo o historia interactiva para reactivar interacciones con la audiencia.';
  }

  // Step 2: Tactical suggestions for positive spikes
  if (changePct >= 50) {
    const channelLabel = regionOrChannel ? ` en ${regionOrChannel}` : '';
    if (metricType === 'STREAMS') {
      return `Pico de reproducción detectado${channelLabel}. Compartir agradecimiento y activar anuncio de retargeting.`;
    }
    if (metricType === 'CONVERSIONS') {
      return `Alta conversión detectada${channelLabel}. Ampliar presupuesto diario para capitalizar el impulso.`;
    }
    return `Viralidad en aumento${channelLabel}. Publicar contenido de seguimiento antes de 24 horas.`;
  }

  // Step 3: Default suggestion for moderate deviations
  return 'Mantener monitoreo regular del ciclo de lanzamiento.';
}

/**
 * Analyzes a metric time series against a rolling 7-day baseline to produce anomaly alerts.
 *
 * @param series - Historical points and current value for a given release and metric
 * @returns AnomalyAlert if a drop > 30% or spike > 50% is detected, or null if within normal bounds
 */
export function detectAnomalyInSeries(series: MetricStreamSeries): AnomalyAlert | null {
  // Step 1: Extract baseline values from history (up to last 7 days)
  const historyValues = series.history.slice(-7).map((p) => p.value);
  const baseline = calculateRollingAverage(historyValues);

  // Step 2: If baseline is zero or history is insufficient, skip anomaly detection
  if (baseline <= 0 || historyValues.length === 0) {
    return null;
  }

  const current = series.currentPoint.value;
  const changePct = Number((((current - baseline) / baseline) * 100).toFixed(2));

  // Step 3: Check for risk drop (>30% below baseline)
  if (changePct <= -30) {
    const severity = changePct <= -50 ? 'CRITICAL' : 'WARNING';
    const alert: AnomalyAlert = {
      id: crypto.randomUUID(),
      releaseId: series.releaseId,
      metricType: series.metricType,
      severity,
      changePct,
      currentValue: current,
      baselineValue: baseline,
      detectedAt: new Date().toISOString(),
      tacticalSuggestion: generateTacticalSuggestion(series.metricType, changePct, series.regionOrChannel),
    };
    return AnomalyAlertSchema.parse(alert);
  }

  // Step 4: Check for opportunity spike (>50% above baseline)
  if (changePct >= 50) {
    const alert: AnomalyAlert = {
      id: crypto.randomUUID(),
      releaseId: series.releaseId,
      metricType: series.metricType,
      severity: 'OPPORTUNITY',
      changePct,
      currentValue: current,
      baselineValue: baseline,
      detectedAt: new Date().toISOString(),
      tacticalSuggestion: generateTacticalSuggestion(series.metricType, changePct, series.regionOrChannel),
    };
    return AnomalyAlertSchema.parse(alert);
  }

  // Step 5: Metric is within expected operational threshold
  return null;
}
