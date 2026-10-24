/**
 * @file use-creative-studio.ts
 * @layer Application
 * @description Primary application hook orchestrating the creative multimedia studio workflow,
 *              format selection, generation tabs, and pipeline state. Zero direct JSX.
 */

'use client';

import { useState, useCallback } from 'react';
import { AssetFormat, AspectRatio } from '../pipelines/creative/creative-schemas';

export type CreativeStudioTab =
  | 'PROMPT_STUDIO'
  | 'BATCH_GENERATION'
  | 'TYPOGRAPHY'
  | 'SOCIAL_COPY'
  | 'VAULT';

export interface UseCreativeStudioOptions {
  releaseId: string;
  initialFormat?: AssetFormat;
  initialTab?: CreativeStudioTab;
}

export interface UseCreativeStudioReturn {
  activeTab: CreativeStudioTab;
  setActiveTab: (tab: CreativeStudioTab) => void;
  selectedFormat: AssetFormat;
  setSelectedFormat: (format: AssetFormat) => void;
  aspectRatio: AspectRatio;
  isGenerating: boolean;
  error: string | null;
  startBatchGeneration: (customPrompt?: string) => Promise<void>;
}

/**
 * Maps AssetFormat to geometric AspectRatio.
 */
function resolveAspectRatio(format: AssetFormat): AspectRatio {
  switch (format) {
    case 'COVER_1_1':
      return 'SQUARE_1_1';
    case 'STORY_9_16':
      return 'PORTRAIT_9_16';
    case 'BANNER_16_9':
      return 'LANDSCAPE_16_9';
    case 'SOCIAL_COPY':
    default:
      return 'NA';
  }
}

/**
 * Custom application hook for orchestrating the Creative Studio.
 *
 * @param options - Configuration including releaseId and initial state
 * @returns State and action handlers for the creative studio view
 */
export function useCreativeStudio({
  releaseId,
  initialFormat = 'COVER_1_1',
  initialTab = 'PROMPT_STUDIO',
}: UseCreativeStudioOptions): UseCreativeStudioReturn {
  // Step 1: Initialize local studio state
  const [activeTab, setActiveTab] = useState<CreativeStudioTab>(initialTab);
  const [selectedFormat, setSelectedFormat] = useState<AssetFormat>(initialFormat);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Derive current aspect ratio
  const aspectRatio = resolveAspectRatio(selectedFormat);

  // Step 3: Define batch generation action
  const startBatchGeneration = useCallback(
    async (_customPrompt?: string) => {
      // Step 3.1: Set loading state
      setIsGenerating(true);
      setError(null);

      try {
        // Step 3.2: Simulated generation orchestrator trigger
        await new Promise((resolve) => setTimeout(resolve, 300));
        setActiveTab('BATCH_GENERATION');
      } catch (err: unknown) {
        const message = err instanceof Error ? err.message : 'Error desconocido al generar variantes';
        setError(message);
      } finally {
        setIsGenerating(false);
      }
    },
    []
  );

  return {
    activeTab,
    setActiveTab,
    selectedFormat,
    setSelectedFormat,
    aspectRatio,
    isGenerating,
    error,
    startBatchGeneration,
  };
}
