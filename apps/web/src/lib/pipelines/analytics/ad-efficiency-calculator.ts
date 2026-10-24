/**
 * @file ad-efficiency-calculator.ts
 * @layer Domain
 * @description Pure mathematical calculation engine for ad campaign efficiency:
 *              CPA (Cost per Acquisition/Pre-save), CPC (Cost per Click), Conversion Rate (%),
 *              and creative variant ranking. Zero network I/O, zero classes.
 */

import {
  AdEfficiencyMetrics,
  AdEfficiencyMetricsSchema,
  EfficiencyRating,
} from './analytics-schemas';

export interface CampaignSpendInput {
  totalSpendUsd: number;
  conversions: number;
  totalClicks: number;
}

export interface CreativeVariantSpend extends CampaignSpendInput {
  variantId: string;
  variantName: string;
  creativeAssetId?: string;
}

export interface RankedCreativeVariant extends CreativeVariantSpend {
  cpa: number;
  cpc: number;
  conversionRatePct: number;
  isTopPerformer: boolean;
  efficiencyRating: EfficiencyRating;
}

/**
 * Derives efficiency rating from CPA and spend levels.
 *
 * @param cpa - Cost per acquisition in USD
 * @param spend - Total spend in USD
 * @param conversions - Number of conversions
 * @returns EfficiencyRating classification
 */
export function determineEfficiencyRating(
  cpa: number,
  spend: number,
  conversions: number
): EfficiencyRating {
  // Step 1: If no spend has been incurred yet, baseline is healthy
  if (spend <= 0) {
    return 'HEALTHY';
  }

  // Step 2: If money was spent without generating conversions, optimization needed
  if (conversions === 0) {
    return 'NEEDS_OPTIMIZATION';
  }

  // Step 3: Evaluate CPA benchmarks
  if (cpa <= 0.5) {
    return 'EXCELLENT';
  }

  if (cpa <= 1.5) {
    return 'HEALTHY';
  }

  return 'NEEDS_OPTIMIZATION';
}

/**
 * Calculates deterministic ad efficiency metrics with safe division-by-zero protection.
 *
 * @param input - Raw spend, conversion, and click inputs
 * @returns Validated AdEfficiencyMetrics object
 */
export function calculateAdEfficiency(input: CampaignSpendInput): AdEfficiencyMetrics {
  // Step 1: Extract and sanitize raw inputs
  const spend = Math.max(0, input.totalSpendUsd);
  const conversions = Math.max(0, Math.floor(input.conversions));
  const clicks = Math.max(0, Math.floor(input.totalClicks));

  // Step 2: Calculate CPA safely
  const cpa = conversions > 0 ? Number((spend / conversions).toFixed(2)) : 0;

  // Step 3: Calculate CPC safely
  const cpc = clicks > 0 ? Number((spend / clicks).toFixed(2)) : 0;

  // Step 4: Calculate Conversion Rate percentage safely
  const conversionRatePct =
    clicks > 0 ? Number(((conversions / clicks) * 100).toFixed(2)) : 0;

  // Step 5: Assign rating
  const efficiencyRating = determineEfficiencyRating(cpa, spend, conversions);

  // Step 6: Validate and return final metrics schema
  return AdEfficiencyMetricsSchema.parse({
    totalSpendUsd: spend,
    conversions,
    totalClicks: clicks,
    cpa,
    cpc,
    conversionRatePct,
    efficiencyRating,
  });
}

/**
 * Compares and ranks multiple creative ad variants to determine top performers.
 *
 * @param variants - Array of creative variants with spend and conversion data
 * @returns Array of variants ranked from most efficient to least efficient
 */
export function rankCreativeVariants(
  variants: CreativeVariantSpend[]
): RankedCreativeVariant[] {
  // Step 1: Handle empty case
  if (variants.length === 0) {
    return [];
  }

  // Step 2: Compute individual metrics for each variant
  const calculated = variants.map((v) => {
    const metrics = calculateAdEfficiency(v);
    return {
      ...v,
      cpa: metrics.cpa,
      cpc: metrics.cpc,
      conversionRatePct: metrics.conversionRatePct,
      efficiencyRating: metrics.efficiencyRating,
      isTopPerformer: false,
    };
  });

  // Step 3: Sort by lowest CPA (with positive conversions), or highest conversion rate
  calculated.sort((a, b) => {
    if (a.conversions > 0 && b.conversions > 0) {
      return a.cpa - b.cpa;
    }
    if (a.conversions > 0 && b.conversions === 0) {
      return -1;
    }
    if (a.conversions === 0 && b.conversions > 0) {
      return 1;
    }
    return b.conversionRatePct - a.conversionRatePct;
  });

  // Step 4: Mark top performer if at least one conversion was achieved
  if (calculated.length > 0 && calculated[0].conversions > 0) {
    calculated[0].isTopPerformer = true;
  }

  // Step 5: Return ranked variants
  return calculated;
}
