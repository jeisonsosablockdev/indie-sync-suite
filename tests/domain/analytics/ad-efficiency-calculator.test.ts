/**
 * @file ad-efficiency-calculator.test.ts
 * @layer Domain Test
 * @description Unit tests for ad-efficiency-calculator (HU-5.5 / SPEC-05-03).
 *              Verifies pure mathematical CPA/CPC/CR% calculations, division-by-zero protection,
 *              efficiency ratings, and creative variant rankings.
 */

import { describe, test, expect } from 'vitest';
import {
  calculateAdEfficiency,
  determineEfficiencyRating,
  rankCreativeVariants,
  CreativeVariantSpend,
} from '../../../apps/web/src/lib/pipelines/analytics/ad-efficiency-calculator';

describe('Ad Campaign Efficiency Calculator (SPEC-05-03)', () => {
  describe('calculateAdEfficiency', () => {
    test('calculates CPA, CPC, and conversion rate for standard campaign inputs', () => {
      const result = calculateAdEfficiency({
        totalSpendUsd: 50.0,
        conversions: 100,
        totalClicks: 500,
      });

      expect(result.totalSpendUsd).toBe(50.0);
      expect(result.conversions).toBe(100);
      expect(result.totalClicks).toBe(500);
      expect(result.cpa).toBe(0.5);
      expect(result.cpc).toBe(0.1);
      expect(result.conversionRatePct).toBe(20.0);
      expect(result.efficiencyRating).toBe('EXCELLENT');
    });

    test('handles division by zero safely when conversions or clicks are zero', () => {
      const zeroResult = calculateAdEfficiency({
        totalSpendUsd: 25.0,
        conversions: 0,
        totalClicks: 0,
      });

      expect(zeroResult.cpa).toBe(0);
      expect(zeroResult.cpc).toBe(0);
      expect(zeroResult.conversionRatePct).toBe(0);
      expect(zeroResult.efficiencyRating).toBe('NEEDS_OPTIMIZATION');
    });

    test('handles zero spend baseline gracefully', () => {
      const zeroSpend = calculateAdEfficiency({
        totalSpendUsd: 0,
        conversions: 0,
        totalClicks: 0,
      });

      expect(zeroSpend.cpa).toBe(0);
      expect(zeroSpend.efficiencyRating).toBe('HEALTHY');
    });
  });

  describe('determineEfficiencyRating', () => {
    test('assigns EXCELLENT when CPA <= $0.50', () => {
      expect(determineEfficiencyRating(0.35, 30, 85)).toBe('EXCELLENT');
    });

    test('assigns HEALTHY when CPA between $0.51 and $1.50', () => {
      expect(determineEfficiencyRating(1.1, 40, 36)).toBe('HEALTHY');
    });

    test('assigns NEEDS_OPTIMIZATION when CPA > $1.50', () => {
      expect(determineEfficiencyRating(2.8, 50, 18)).toBe('NEEDS_OPTIMIZATION');
    });
  });

  describe('rankCreativeVariants', () => {
    test('ranks variants by lowest CPA and marks top performer', () => {
      const variants: CreativeVariantSpend[] = [
        {
          variantId: 'var-b',
          variantName: 'Teaser Video B (TikTok 9:16)',
          totalSpendUsd: 20.0,
          conversions: 20,
          totalClicks: 200,
        }, // CPA = 1.00
        {
          variantId: 'var-a',
          variantName: 'Cover Art 3000px (Meta 1:1)',
          totalSpendUsd: 30.0,
          conversions: 100,
          totalClicks: 500,
        }, // CPA = 0.30
      ];

      const ranked = rankCreativeVariants(variants);
      expect(ranked).toHaveLength(2);

      // var-a is top performer (CPA $0.30 < $1.00)
      expect(ranked[0].variantId).toBe('var-a');
      expect(ranked[0].isTopPerformer).toBe(true);
      expect(ranked[0].cpa).toBe(0.3);

      expect(ranked[1].variantId).toBe('var-b');
      expect(ranked[1].isTopPerformer).toBe(false);
      expect(ranked[1].cpa).toBe(1.0);
    });

    test('returns empty array when no variants provided', () => {
      expect(rankCreativeVariants([])).toEqual([]);
    });
  });
});
