/**
 * @file ad-campaign-calculator.test.ts
 * @layer Domain Test
 * @description Comprehensive unit tests for ad-campaign-calculator (HU-4.2 / SPEC-04-04).
 *              Verifies budget validation ($20–$100 USD), platform split calculations, impression & click projections.
 */

import { describe, test, expect } from 'vitest';
import {
  calculateAdSplit,
  AdSplitParams,
} from '../../../apps/web/src/lib/pipelines/distribution/ad-campaign-calculator';

describe('AdCampaignCalculator Domain Service (HU-4.2 / SPEC-04-04)', () => {
  test('calculates equal budget split and projections for dual platforms (Meta + TikTok)', () => {
    const params: AdSplitParams = {
      totalBudgetUsd: 50,
      platforms: ['META_ADS', 'TIKTOK_ADS'],
      campaignDurationDays: 5,
    };

    const result = calculateAdSplit(params);

    expect(result.totalBudgetUsd).toBe(50);
    expect(result.durationDays).toBe(5);
    expect(result.allocations).toHaveLength(2);

    const meta = result.allocations.find((a) => a.platform === 'META_ADS')!;
    const tiktok = result.allocations.find((a) => a.platform === 'TIKTOK_ADS')!;

    expect(meta.budgetUsd).toBe(25);
    expect(meta.dailyBudgetUsd).toBe(5);
    expect(meta.estimatedImpressions.min).toBeGreaterThan(0);
    expect(meta.estimatedImpressions.max).toBeGreaterThan(meta.estimatedImpressions.min);
    expect(meta.estimatedClicks.min).toBeGreaterThan(0);

    expect(tiktok.budgetUsd).toBe(25);
    expect(tiktok.dailyBudgetUsd).toBe(5);
    expect(tiktok.estimatedImpressions.min).toBeGreaterThan(0);
    expect(tiktok.estimatedImpressions.max).toBeGreaterThan(tiktok.estimatedImpressions.min);
  });

  test('calculates 100% budget allocation when single platform selected', () => {
    const params: AdSplitParams = {
      totalBudgetUsd: 30,
      platforms: ['META_ADS'],
      campaignDurationDays: 3,
    };

    const result = calculateAdSplit(params);

    expect(result.allocations).toHaveLength(1);
    expect(result.allocations[0].budgetUsd).toBe(30);
    expect(result.allocations[0].dailyBudgetUsd).toBe(10);
  });

  test('enforces lower invariant boundary ($20.00 USD minimum)', () => {
    expect(() =>
      calculateAdSplit({
        totalBudgetUsd: 19.99,
        platforms: ['META_ADS'],
      })
    ).toThrow('Total budget must be between $20.00 and $100.00 USD');
  });

  test('enforces upper invariant boundary ($100.00 USD maximum)', () => {
    expect(() =>
      calculateAdSplit({
        totalBudgetUsd: 100.01,
        platforms: ['META_ADS'],
      })
    ).toThrow('Total budget must be between $20.00 and $100.00 USD');
  });

  test('rejects empty platform selection', () => {
    expect(() =>
      calculateAdSplit({
        totalBudgetUsd: 50,
        platforms: [],
      })
    ).toThrow('At least one ad platform must be selected');
  });
});
