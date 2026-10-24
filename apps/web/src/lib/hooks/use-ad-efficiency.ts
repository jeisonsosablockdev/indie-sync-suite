/**
 * @file use-ad-efficiency.ts
 * @layer Application
 * @description Application hook managing reactive ad spend efficiency calculations (CPA, CPC, CR%),
 *              variant comparisons, and top performer identification. Zero direct JSX.
 */

'use client';

import { useState, useMemo, useCallback } from 'react';
import {
  calculateAdEfficiency,
  rankCreativeVariants,
  CreativeVariantSpend,
  RankedCreativeVariant,
} from '../pipelines/analytics/ad-efficiency-calculator';
import {
  AdEfficiencyMetrics,
  EfficiencyRating,
} from '../pipelines/analytics/analytics-schemas';

export type {
  AdEfficiencyMetrics,
  CreativeVariantSpend,
  RankedCreativeVariant,
  EfficiencyRating,
};

export interface UseAdEfficiencyOptions {
  releaseId: string;
  initialVariants?: CreativeVariantSpend[];
}

export interface UseAdEfficiencyReturn {
  variants: CreativeVariantSpend[];
  rankedVariants: RankedCreativeVariant[];
  globalMetrics: AdEfficiencyMetrics;
  topPerformer: RankedCreativeVariant | null;
  addVariant: (variant: CreativeVariantSpend) => void;
  removeVariant: (variantId: string) => void;
}

/**
 * Reactive hook for tracking ad campaign spend, calculating unit economics, and ranking creatives.
 *
 * @param options - Configuration including releaseId and optional initial variant list
 * @returns State, computed metrics, and actions for ad spend efficiency
 */
export function useAdEfficiency({
  releaseId: _releaseId,
  initialVariants = [],
}: UseAdEfficiencyOptions): UseAdEfficiencyReturn {
  // Step 1: Initialize list of ad variants
  const [variants, setVariants] = useState<CreativeVariantSpend[]>(initialVariants);

  // Step 2: Compute ranked variants reactively
  const rankedVariants = useMemo<RankedCreativeVariant[]>(() => {
    return rankCreativeVariants(variants);
  }, [variants]);

  // Step 3: Identify current top performing creative
  const topPerformer = useMemo<RankedCreativeVariant | null>(() => {
    return rankedVariants.find((v) => v.isTopPerformer) ?? null;
  }, [rankedVariants]);

  // Step 4: Calculate aggregated global metrics across all variants
  const globalMetrics = useMemo<AdEfficiencyMetrics>(() => {
    const totalSpendUsd = variants.reduce((acc, v) => acc + v.totalSpendUsd, 0);
    const conversions = variants.reduce((acc, v) => acc + v.conversions, 0);
    const totalClicks = variants.reduce((acc, v) => acc + v.totalClicks, 0);

    return calculateAdEfficiency({
      totalSpendUsd,
      conversions,
      totalClicks,
    });
  }, [variants]);

  // Step 5: Add a new variant
  const addVariant = useCallback((variant: CreativeVariantSpend) => {
    setVariants((prev) => [...prev, variant]);
  }, []);

  // Step 6: Remove an existing variant by ID
  const removeVariant = useCallback((variantId: string) => {
    setVariants((prev) => prev.filter((v) => v.variantId !== variantId));
  }, []);

  return {
    variants,
    rankedVariants,
    globalMetrics,
    topPerformer,
    addVariant,
    removeVariant,
  };
}
