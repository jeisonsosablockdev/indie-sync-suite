/**
 * @file analytics-schemas.ts
 * @layer Domain
 * @description Invariant Zod schemas and TypeScript types for streaming metrics, CSV ingestion,
 *              ad efficiency calculations, anomalies, and dynamic API widgets. Zero network I/O, zero classes.
 */

import { z } from 'zod';

// ==============================================================================
// Step 1: Enums & Value Objects
// ==============================================================================

export const TimeWindowFilterSchema = z.enum([
  'PRE_RELEASE', // T-14 to T-1
  'DROP_WEEK',   // T-0 to T+7
  'POST_RELEASE',// T+8 onwards
  'ALL_TIME',    // Historical consolidation
]);
export type TimeWindowFilter = z.infer<typeof TimeWindowFilterSchema>;

export const StreamingSourceSchema = z.enum([
  'SPOTIFY',
  'APPLE_MUSIC',
  'DISTROKID',
  'GENERIC_CSV',
]);
export type StreamingSource = z.infer<typeof StreamingSourceSchema>;

export const AnomalySeveritySchema = z.enum(['CRITICAL', 'WARNING', 'OPPORTUNITY']);
export type AnomalySeverity = z.infer<typeof AnomalySeveritySchema>;

export const AnomalyMetricTypeSchema = z.enum(['STREAMS', 'ENGAGEMENT', 'CONVERSIONS']);
export type AnomalyMetricType = z.infer<typeof AnomalyMetricTypeSchema>;

export const EfficiencyRatingSchema = z.enum(['EXCELLENT', 'HEALTHY', 'NEEDS_OPTIMIZATION']);
export type EfficiencyRating = z.infer<typeof EfficiencyRatingSchema>;

// ==============================================================================
// Step 2: Streaming CSV & Metrics Schemas
// ==============================================================================

export const StreamingCsvRowSchema = z.object({
  metricDate: z.string().regex(/^\d{4}-\d{2}-\d{2}/, 'Formato de fecha debe ser YYYY-MM-DD'),
  streams: z.number().int().nonnegative('Streams debe ser un número entero no negativo'),
  listeners: z.number().int().nonnegative('Listeners debe ser un número entero no negativo'),
  saves: z.number().int().nonnegative('Saves debe ser un número entero no negativo'),
  countryCode: z.string().default('GLOBAL'),
  platform: z.string().default('SPOTIFY'),
});
export type StreamingCsvRow = z.infer<typeof StreamingCsvRowSchema>;

export const PerformanceMetricsSummarySchema = z.object({
  totalStreams: z.number().int().nonnegative(),
  totalListeners: z.number().int().nonnegative(),
  totalSaves: z.number().int().nonnegative(),
  streamsGrowthPct: z.number().optional(),
  timeWindow: TimeWindowFilterSchema,
  topCountries: z.array(
    z.object({
      countryCode: z.string(),
      streams: z.number().int().nonnegative(),
    })
  ),
});
export type PerformanceMetricsSummary = z.infer<typeof PerformanceMetricsSummarySchema>;

// ==============================================================================
// Step 3: Ad Efficiency & Anomaly Schemas
// ==============================================================================

export const AdEfficiencyMetricsSchema = z.object({
  totalSpendUsd: z.number().nonnegative(),
  conversions: z.number().int().nonnegative(),
  totalClicks: z.number().int().nonnegative(),
  cpa: z.number().nonnegative(),
  cpc: z.number().nonnegative(),
  conversionRatePct: z.number().nonnegative(),
  efficiencyRating: EfficiencyRatingSchema,
});
export type AdEfficiencyMetrics = z.infer<typeof AdEfficiencyMetricsSchema>;

export const AnomalyAlertSchema = z.object({
  id: z.string().uuid(),
  releaseId: z.string().uuid(),
  metricType: AnomalyMetricTypeSchema,
  severity: AnomalySeveritySchema,
  changePct: z.number(),
  currentValue: z.number(),
  baselineValue: z.number(),
  detectedAt: z.string().datetime(),
  tacticalSuggestion: z.string().min(5),
});
export type AnomalyAlert = z.infer<typeof AnomalyAlertSchema>;

// ==============================================================================
// Step 4: Advisor & Custom Dashboard Schemas
// ==============================================================================

export const AdvisorMessageSchema = z.object({
  id: z.string().uuid(),
  conversationId: z.string().uuid(),
  senderRole: z.enum(['USER', 'ASSISTANT']),
  content: z.string().min(1),
  metricsSnapshotJson: z.string().nullable().optional(),
  createdAt: z.string().datetime().optional(),
});
export type AdvisorMessage = z.infer<typeof AdvisorMessageSchema>;

export const InferredWidgetTypeSchema = z.enum(['KPI_CARD', 'TIME_SERIES', 'CATEGORY_PIE']);
export type InferredWidgetType = z.infer<typeof InferredWidgetTypeSchema>;

export const InferredWidgetConfigSchema = z.object({
  type: InferredWidgetTypeSchema,
  title: z.string(),
  dataPath: z.string(),
  unit: z.string().optional(),
});
export type InferredWidgetConfig = z.infer<typeof InferredWidgetConfigSchema>;
