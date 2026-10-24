/**
 * @file use-batch-curation.ts
 * @layer Application
 * @description Application hook managing 4-variant generation batch lifecycle, approval triage,
 *              discard actions, and task deliverable linkages. Zero direct JSX.
 */

'use client';

import { useState, useCallback } from 'react';
import { AssetStatus, AssetFormat } from '../pipelines/creative/creative-schemas';

export interface BatchVariantItem {
  id: string;
  batchId: string;
  variantIndex: number;
  previewUrl: string;
  format: AssetFormat;
  status: AssetStatus;
  contentHash: string;
}

export interface UseBatchCurationOptions {
  batchId?: string;
  initialVariants?: BatchVariantItem[];
  onAssetApproved?: (assetId: string) => void;
}

export interface UseBatchCurationReturn {
  variants: BatchVariantItem[];
  selectedVariant: BatchVariantItem | null;
  selectVariant: (id: string | null) => void;
  approveVariant: (id: string, taskId?: string) => Promise<void>;
  discardVariant: (id: string) => Promise<void>;
  regenerateBatch: () => Promise<void>;
  isTriageLoading: boolean;
}

/**
 * Custom application hook for batch curation and quick triage actions.
 *
 * @param options - Configuration including optional batchId and callbacks
 * @returns State and action handlers for 4-variant grid curation
 */
export function useBatchCuration({
  batchId = 'mock-batch-001',
  initialVariants = [],
  onAssetApproved,
}: UseBatchCurationOptions = {}): UseBatchCurationReturn {
  // Step 1: Initialize variants state
  const [variants, setVariants] = useState<BatchVariantItem[]>(initialVariants);
  const [selectedVariantId, setSelectedVariantId] = useState<string | null>(null);
  const [isTriageLoading, setIsTriageLoading] = useState<boolean>(false);

  // Step 2: Selected variant memoization
  const selectedVariant = variants.find((v) => v.id === selectedVariantId) ?? null;

  // Step 3: Approve variant handler
  const approveVariant = useCallback(
    async (id: string, _taskId?: string) => {
      setIsTriageLoading(true);
      try {
        setVariants((prev) =>
          prev.map((item) => (item.id === id ? { ...item, status: 'APPROVED' as AssetStatus } : item))
        );
        onAssetApproved?.(id);
      } finally {
        setIsTriageLoading(false);
      }
    },
    [onAssetApproved]
  );

  // Step 4: Discard variant handler
  const discardVariant = useCallback(async (id: string) => {
    setIsTriageLoading(true);
    try {
      setVariants((prev) =>
        prev.map((item) => (item.id === id ? { ...item, status: 'DISCARDED' as AssetStatus } : item))
      );
    } finally {
      setIsTriageLoading(false);
    }
  }, []);

  // Step 5: Regenerate batch handler
  const regenerateBatch = useCallback(async () => {
    setIsTriageLoading(true);
    try {
      // Simulated batch regeneration
      await new Promise((resolve) => setTimeout(resolve, 500));
    } finally {
      setIsTriageLoading(false);
    }
  }, []);

  return {
    variants,
    selectedVariant,
    selectVariant: setSelectedVariantId,
    approveVariant,
    discardVariant,
    regenerateBatch,
    isTriageLoading,
  };
}
