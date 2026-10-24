/**
 * @file anomaly-detection-engine.test.ts
 * @layer Domain Test
 * @description Unit tests for the pure heuristic anomaly detection engine (HU-5.6 / SPEC-05-05).
 *              Verifies 7-day rolling average calculations, tactical suggestions,
 *              risk drops (>30%), opportunity spikes (>50%), and normal thresholds.
 */

import { describe, test, expect } from 'vitest';
import {
  calculateRollingAverage,
  generateTacticalSuggestion,
  detectAnomalyInSeries,
  MetricStreamSeries,
} from '../../../apps/web/src/lib/pipelines/analytics/anomaly-detection-engine';

describe('Domain: AnomalyDetectionEngine (SPEC-05-05)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';

  describe('calculateRollingAverage', () => {
    test('returns 0 for empty values array', () => {
      expect(calculateRollingAverage([])).toBe(0);
    });

    test('computes precise average over array of values', () => {
      const values = [1000, 1100, 1050, 950, 1000, 1050, 1000];
      // sum = 7150 / 7 = 1021.4285... -> 1021.43
      expect(calculateRollingAverage(values)).toBe(1021.43);
    });
  });

  describe('generateTacticalSuggestion', () => {
    test('suggests budget redistribution on severe conversion drop', () => {
      const suggestion = generateTacticalSuggestion('CONVERSIONS', -35);
      expect(suggestion).toContain('Pausar creativos con CPA elevado');
    });

    test('suggests BTS content on severe streams drop', () => {
      const suggestion = generateTacticalSuggestion('STREAMS', -40);
      expect(suggestion).toContain('behind-the-scenes');
    });

    test('suggests retargeting ad on positive stream spike with region channel', () => {
      const suggestion = generateTacticalSuggestion('STREAMS', 65, 'Spotify Colombia');
      expect(suggestion).toContain('Spotify Colombia');
      expect(suggestion).toContain('retargeting');
    });

    test('suggests scaling budget on high conversion spike', () => {
      const suggestion = generateTacticalSuggestion('CONVERSIONS', 55, 'Meta Ads');
      expect(suggestion).toContain('Meta Ads');
      expect(suggestion).toContain('Ampliar presupuesto');
    });

    test('returns default monitoring note for moderate changes', () => {
      const suggestion = generateTacticalSuggestion('STREAMS', 15);
      expect(suggestion).toBe('Mantener monitoreo regular del ciclo de lanzamiento.');
    });
  });

  describe('detectAnomalyInSeries', () => {
    test('returns null when baseline history is empty or zero', () => {
      const series: MetricStreamSeries = {
        releaseId,
        metricType: 'STREAMS',
        history: [],
        currentPoint: { date: '2026-10-24', value: 1500 },
      };
      expect(detectAnomalyInSeries(series)).toBeNull();
    });

    test('returns null when change is within normal operational bounds (-10%)', () => {
      const series: MetricStreamSeries = {
        releaseId,
        metricType: 'STREAMS',
        history: [
          { date: '2026-10-17', value: 1000 },
          { date: '2026-10-18', value: 1000 },
          { date: '2026-10-19', value: 1000 },
          { date: '2026-10-20', value: 1000 },
          { date: '2026-10-21', value: 1000 },
          { date: '2026-10-22', value: 1000 },
          { date: '2026-10-23', value: 1000 },
        ],
        currentPoint: { date: '2026-10-24', value: 920 }, // -8% change
      };
      expect(detectAnomalyInSeries(series)).toBeNull();
    });

    test('detects WARNING risk drop when drop is between 30% and 50%', () => {
      const series: MetricStreamSeries = {
        releaseId,
        metricType: 'STREAMS',
        history: [
          { date: '2026-10-17', value: 1000 },
          { date: '2026-10-18', value: 1000 },
          { date: '2026-10-19', value: 1000 },
          { date: '2026-10-20', value: 1000 },
          { date: '2026-10-21', value: 1000 },
          { date: '2026-10-22', value: 1000 },
          { date: '2026-10-23', value: 1000 },
        ],
        currentPoint: { date: '2026-10-24', value: 650 }, // -35% drop
      };

      const alert = detectAnomalyInSeries(series);
      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('WARNING');
      expect(alert?.changePct).toBe(-35);
      expect(alert?.baselineValue).toBe(1000);
      expect(alert?.currentValue).toBe(650);
      expect(alert?.tacticalSuggestion).toBeDefined();
    });

    test('detects CRITICAL risk drop when drop is greater than 50%', () => {
      const series: MetricStreamSeries = {
        releaseId,
        metricType: 'CONVERSIONS',
        history: [
          { date: '2026-10-17', value: 200 },
          { date: '2026-10-18', value: 200 },
          { date: '2026-10-19', value: 200 },
          { date: '2026-10-20', value: 200 },
          { date: '2026-10-21', value: 200 },
          { date: '2026-10-22', value: 200 },
          { date: '2026-10-23', value: 200 },
        ],
        currentPoint: { date: '2026-10-24', value: 80 }, // -60% drop
      };

      const alert = detectAnomalyInSeries(series);
      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('CRITICAL');
      expect(alert?.changePct).toBe(-60);
      expect(alert?.tacticalSuggestion).toContain('Pausar creativos con CPA elevado');
    });

    test('detects OPPORTUNITY spike when metric surges above 50%', () => {
      const series: MetricStreamSeries = {
        releaseId,
        metricType: 'STREAMS',
        history: [
          { date: '2026-10-17', value: 1000 },
          { date: '2026-10-18', value: 1000 },
          { date: '2026-10-19', value: 1000 },
          { date: '2026-10-20', value: 1000 },
          { date: '2026-10-21', value: 1000 },
          { date: '2026-10-22', value: 1000 },
          { date: '2026-10-23', value: 1000 },
        ],
        currentPoint: { date: '2026-10-24', value: 1800 }, // +80% spike
        regionOrChannel: 'TikTok Viral',
      };

      const alert = detectAnomalyInSeries(series);
      expect(alert).not.toBeNull();
      expect(alert?.severity).toBe('OPPORTUNITY');
      expect(alert?.changePct).toBe(80);
      expect(alert?.tacticalSuggestion).toContain('TikTok Viral');
      expect(alert?.tacticalSuggestion).toContain('retargeting');
    });
  });
});
