/**
 * @file csv-report-parser.test.ts
 * @layer Domain Test
 * @description Unit tests for csv-report-parser (HU-5.4 / SPEC-05-02).
 *              Verifies delimiter detection, platform dialect identification, quoted cell splitting,
 *              fault-tolerant row parsing, and error reporting.
 */

import { describe, test, expect } from 'vitest';
import {
  detectDelimiter,
  detectSourcePlatform,
  splitCsvRow,
  parseStreamingCsv,
} from '../../../apps/web/src/lib/pipelines/analytics/csv-report-parser';

describe('Streaming CSV Report Parser (SPEC-05-02)', () => {
  describe('detectDelimiter', () => {
    test('detects comma delimiter from standard header', () => {
      expect(detectDelimiter('date,streams,listeners,saves,country')).toBe(',');
    });

    test('detects semicolon delimiter from European style header', () => {
      expect(detectDelimiter('date;streams;listeners;saves;country')).toBe(';');
    });
  });

  describe('detectSourcePlatform', () => {
    test('identifies Spotify for Artists from column headers', () => {
      expect(detectSourcePlatform(['date', 'streams', 'listeners', 'saves'])).toBe('SPOTIFY');
      expect(detectSourcePlatform(['spotify_id', 'stream_count', 'date'])).toBe('SPOTIFY');
    });

    test('identifies DistroKid from store / ISRC headers', () => {
      expect(detectSourcePlatform(['sale_date', 'store', 'isrc', 'quantity'])).toBe('DISTROKID');
    });

    test('falls back to generic CSV when no specific dialect is matched', () => {
      expect(detectSourcePlatform(['fecha', 'reproducciones', 'pais'])).toBe('GENERIC_CSV');
    });
  });

  describe('splitCsvRow', () => {
    test('splits simple comma-separated row', () => {
      const cells = splitCsvRow('2026-11-15,1000,800,120,MX', ',');
      expect(cells).toEqual(['2026-11-15', '1000', '800', '120', 'MX']);
    });

    test('respects commas embedded inside double quotes', () => {
      const cells = splitCsvRow('"2026-11-15","1,000",800,"Mexico, City",MX', ',');
      expect(cells[3]).toBe('Mexico, City');
    });
  });

  describe('parseStreamingCsv', () => {
    test('parses clean Spotify CSV report content into validated rows', () => {
      const rawCsv = `date,streams,listeners,saves,country
2026-11-14,1200,850,140,MX
2026-11-15,3500,2400,420,CO
2026-11-16,2100,1600,290,ES`;

      const result = parseStreamingCsv(rawCsv);
      expect(result.detectedSource).toBe('SPOTIFY');
      expect(result.rows).toHaveLength(3);
      expect(result.errors).toHaveLength(0);
      expect(result.totalRowsRead).toBe(3);

      expect(result.rows[0].streams).toBe(1200);
      expect(result.rows[0].countryCode).toBe('MX');
      expect(result.rows[1].streams).toBe(3500);
    });

    test('tolerates and reports corrupt rows without dropping valid rows', () => {
      const rawCsv = `date,streams,listeners,saves,country
2026-11-14,1000,700,100,MX
invalid-date,bad-num,bad-num,bad-num,XX
2026-11-16,2000,1400,250,US`;

      const result = parseStreamingCsv(rawCsv);
      expect(result.rows).toHaveLength(2);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].rowIndex).toBe(3);
      expect(result.totalRowsRead).toBe(3);
    });

    test('returns empty result with error for completely empty CSV text', () => {
      const result = parseStreamingCsv('');
      expect(result.rows).toHaveLength(0);
      expect(result.errors).toHaveLength(1);
      expect(result.errors[0].message).toContain('CSV vacío');
    });
  });
});
