/**
 * @file json-schema-inferrer.test.ts
 * @layer Domain Test
 * @description Unit tests for JSON schema inferrer engine (HU-5.3 & HU-6.1 v5 / SPEC-05-06).
 *              Verifies widget recommendations (KPI cards, time-series, category pies)
 *              derived from arbitrary JSON structures.
 */

import { describe, test, expect } from 'vitest';
import {
  isDateLikeString,
  inferWidgetsFromPayload,
} from '../../../apps/web/src/lib/pipelines/analytics/json-schema-inferrer';

describe('Domain: JsonSchemaInferrer (SPEC-05-06)', () => {
  describe('isDateLikeString', () => {
    test('identifies YYYY-MM-DD format as date-like', () => {
      expect(isDateLikeString('2026-10-24')).toBe(true);
    });

    test('identifies ISO-8601 timestamps as date-like', () => {
      expect(isDateLikeString('2026-10-24T12:00:00.000Z')).toBe(true);
    });

    test('rejects arbitrary non-date strings', () => {
      expect(isDateLikeString('streams_count')).toBe(false);
      expect(isDateLikeString('12345')).toBe(false);
    });
  });

  describe('inferWidgetsFromPayload', () => {
    test('returns empty array for non-object or null payloads', () => {
      expect(inferWidgetsFromPayload(null)).toEqual([]);
      expect(inferWidgetsFromPayload(undefined)).toEqual([]);
      expect(inferWidgetsFromPayload('string_payload')).toEqual([]);
      expect(inferWidgetsFromPayload(12345)).toEqual([]);
    });

    test('infers TIME_SERIES and CATEGORY_PIE from Array payloads', () => {
      const payload = [
        { date: '2026-10-01', streams: 1200, country: 'MX' },
        { date: '2026-10-02', streams: 1540, country: 'CO' },
      ];

      const widgets = inferWidgetsFromPayload(payload);
      expect(widgets.length).toBe(2);

      const timeSeries = widgets.find((w) => w.type === 'TIME_SERIES');
      expect(timeSeries).toBeDefined();
      expect(timeSeries?.title).toContain('streams');
      expect(timeSeries?.dataPath).toBe('[].streams');

      const pie = widgets.find((w) => w.type === 'CATEGORY_PIE');
      expect(pie).toBeDefined();
      expect(pie?.title).toContain('country');
      expect(pie?.dataPath).toBe('[].country');
    });

    test('infers KPI_CARD widgets from flat object dictionary', () => {
      const payload = {
        totalListeners: 45000,
        totalSpendUsd: 250.5,
        artistId: 'art-123', // ID should be ignored
        status: 'active', // String should not be KPI
      };

      const widgets = inferWidgetsFromPayload(payload);
      expect(widgets.length).toBe(2);

      const listenersWidget = widgets.find((w) => w.dataPath === 'totalListeners');
      expect(listenersWidget).toBeDefined();
      expect(listenersWidget?.type).toBe('KPI_CARD');
      expect(listenersWidget?.title).toBe('Total Listeners');
      expect(listenersWidget?.unit).toBeUndefined();

      const spendWidget = widgets.find((w) => w.dataPath === 'totalSpendUsd');
      expect(spendWidget).toBeDefined();
      expect(spendWidget?.type).toBe('KPI_CARD');
      expect(spendWidget?.unit).toBe('USD');
    });

    test('infers nested TIME_SERIES from object containing array of records', () => {
      const payload = {
        dailyActivity: [
          { timestamp: '2026-10-24T00:00:00Z', plays: 890 },
          { timestamp: '2026-10-24T01:00:00Z', plays: 1040 },
        ],
      };

      const widgets = inferWidgetsFromPayload(payload);
      expect(widgets.length).toBe(1);
      expect(widgets[0].type).toBe('TIME_SERIES');
      expect(widgets[0].dataPath).toBe('dailyActivity[].plays');
    });
  });
});
