/**
 * @file analytics-schemas.test.ts
 * @layer Domain Test
 * @description Unit tests for analytics Zod schemas and invariant contracts (HU-5.1 / SPEC-05-01).
 *              Verifies time-window filters, streaming CSV rows, KPI summaries, and anomaly alert schemas.
 */

import { describe, test, expect } from 'vitest';
import {
  TimeWindowFilterSchema,
  StreamingCsvRowSchema,
  PerformanceMetricsSummarySchema,
  AdEfficiencyMetricsSchema,
  AnomalyAlertSchema,
} from '../../../apps/web/src/lib/pipelines/analytics/analytics-schemas';

describe('Analytics Zod Schemas & Invariant Contracts (SPEC-05-01)', () => {
  describe('TimeWindowFilterSchema', () => {
    test('accepts valid time-window filters', () => {
      expect(TimeWindowFilterSchema.parse('PRE_RELEASE')).toBe('PRE_RELEASE');
      expect(TimeWindowFilterSchema.parse('DROP_WEEK')).toBe('DROP_WEEK');
      expect(TimeWindowFilterSchema.parse('POST_RELEASE')).toBe('POST_RELEASE');
      expect(TimeWindowFilterSchema.parse('ALL_TIME')).toBe('ALL_TIME');
    });

    test('rejects invalid filter names', () => {
      expect(() => TimeWindowFilterSchema.parse('INVALID_WINDOW')).toThrow();
    });
  });

  describe('StreamingCsvRowSchema', () => {
    test('validates correctly formatted row with non-negative metrics', () => {
      const validRow = {
        metricDate: '2026-11-15',
        streams: 1250,
        listeners: 800,
        saves: 150,
        countryCode: 'MX',
        platform: 'SPOTIFY',
      };

      const parsed = StreamingCsvRowSchema.parse(validRow);
      expect(parsed.metricDate).toBe('2026-11-15');
      expect(parsed.streams).toBe(1250);
      expect(parsed.countryCode).toBe('MX');
    });

    test('rejects negative numbers for streams or listeners', () => {
      expect(() =>
        StreamingCsvRowSchema.parse({
          metricDate: '2026-11-15',
          streams: -5,
          listeners: 10,
          saves: 0,
        })
      ).toThrow('Streams debe ser un número entero no negativo');
    });

    test('rejects malformed date strings', () => {
      expect(() =>
        StreamingCsvRowSchema.parse({
          metricDate: '15/11/2026',
          streams: 100,
          listeners: 80,
          saves: 10,
        })
      ).toThrow('Formato de fecha debe ser YYYY-MM-DD');
    });
  });

  describe('PerformanceMetricsSummarySchema', () => {
    test('validates complete performance metrics summary', () => {
      const summary = {
        totalStreams: 50000,
        totalListeners: 32000,
        totalSaves: 4500,
        streamsGrowthPct: 22.4,
        timeWindow: 'DROP_WEEK',
        topCountries: [
          { countryCode: 'MX', streams: 25000 },
          { countryCode: 'CO', streams: 15000 },
        ],
      };

      const parsed = PerformanceMetricsSummarySchema.parse(summary);
      expect(parsed.totalStreams).toBe(50000);
      expect(parsed.topCountries).toHaveLength(2);
      expect(parsed.timeWindow).toBe('DROP_WEEK');
    });
  });

  describe('AdEfficiencyMetricsSchema & AnomalyAlertSchema', () => {
    test('validates ad efficiency metrics and rating', () => {
      const metrics = {
        totalSpendUsd: 50.0,
        conversions: 200,
        totalClicks: 800,
        cpa: 0.25,
        cpc: 0.0625,
        conversionRatePct: 25.0,
        efficiencyRating: 'EXCELLENT',
      };

      const parsed = AdEfficiencyMetricsSchema.parse(metrics);
      expect(parsed.cpa).toBe(0.25);
      expect(parsed.efficiencyRating).toBe('EXCELLENT');
    });

    test('validates anomaly alert structure', () => {
      const alert = {
        id: '11111111-1111-4111-8111-111111111111',
        releaseId: '22222222-2222-4222-8222-222222222222',
        metricType: 'STREAMS',
        severity: 'CRITICAL',
        changePct: -38.5,
        currentValue: 620,
        baselineValue: 1008,
        detectedAt: '2026-11-16T12:00:00.000Z',
        tacticalSuggestion: 'Reasignar $15 al anuncio B con mayor tasa de conversión en TikTok Ads.',
      };

      const parsed = AnomalyAlertSchema.parse(alert);
      expect(parsed.changePct).toBe(-38.5);
      expect(parsed.severity).toBe('CRITICAL');
    });
  });
});
