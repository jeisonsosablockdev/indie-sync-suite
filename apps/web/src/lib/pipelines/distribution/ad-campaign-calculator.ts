/**
 * @file ad-campaign-calculator.ts
 * @layer Domain
 * @description Pure algorithmic ad campaign calculator splitting micro-budgets ($20–$100 USD)
 *              across Meta and TikTok Ads, estimating impressions, clicks, and reach. Zero network I/O, zero classes.
 */

import { AdPlatform } from './distribution-schemas';

export interface AdSplitParams {
  totalBudgetUsd: number;
  platforms: AdPlatform[];
  campaignDurationDays?: number;
}

export interface PlatformAllocation {
  platform: AdPlatform;
  budgetUsd: number;
  dailyBudgetUsd: number;
  estimatedImpressions: { min: number; max: number };
  estimatedClicks: { min: number; max: number };
}

export interface AdBudgetAllocation {
  totalBudgetUsd: number;
  durationDays: number;
  allocations: PlatformAllocation[];
}

/**
 * Pure calculation engine dividing micro-budgets among designated ad networks.
 *
 * @param params - Total budget ($20–$100 USD), selected platforms, and duration
 * @returns Fully computed budget distribution with estimated performance metrics
 */
export function calculateAdSplit(params: AdSplitParams): AdBudgetAllocation {
  // Step 1: Validate budget invariant boundaries ($20 to $100 USD)
  if (params.totalBudgetUsd < 20 || params.totalBudgetUsd > 100) {
    throw new Error(`Total budget must be between $20.00 and $100.00 USD, received: ${params.totalBudgetUsd}`);
  }

  if (params.platforms.length === 0) {
    throw new Error('At least one ad platform must be selected');
  }

  const durationDays = params.campaignDurationDays ?? 5;
  const count = params.platforms.length;
  const perPlatformBudget = Math.round((params.totalBudgetUsd / count) * 100) / 100;

  // Step 2: Calculate metrics per platform based on indie music benchmarks
  const allocations: PlatformAllocation[] = params.platforms.map((platform) => {
    const dailyBudget = Math.round((perPlatformBudget / durationDays) * 100) / 100;

    // Benchmarks: ~$5.00 - $8.00 CPM in music discovery niche
    const cpmMin = platform === 'META_ADS' ? 5.5 : 4.5;
    const cpmMax = platform === 'META_ADS' ? 8.0 : 6.5;

    const minImpressions = Math.round((perPlatformBudget / cpmMax) * 1000);
    const maxImpressions = Math.round((perPlatformBudget / cpmMin) * 1000);

    // Benchmarks: ~1.2% - 2.0% CTR for curated visual video ads
    const minClicks = Math.round(minImpressions * 0.012);
    const maxClicks = Math.round(maxImpressions * 0.020);

    return {
      platform,
      budgetUsd: perPlatformBudget,
      dailyBudgetUsd: dailyBudget,
      estimatedImpressions: { min: minImpressions, max: maxImpressions },
      estimatedClicks: { min: minClicks, max: maxClicks },
    };
  });

  // Step 3: Return complete immutable allocation
  return {
    totalBudgetUsd: params.totalBudgetUsd,
    durationDays,
    allocations,
  };
}
