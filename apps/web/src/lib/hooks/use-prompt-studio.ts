/**
 * @file use-prompt-studio.ts
 * @layer Application
 * @description Application hook managing the Prompt Studio lifecycle: compiling 3-level brand prompts,
 *              interactive editing, preset formatting, and 1-click clipboard copying. Zero direct JSX.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { AspectRatio } from '../pipelines/creative/creative-schemas';
import {
  PlatformPreset,
  PromptBreakdown,
  FormattedPromptOutput,
} from '../pipelines/creative/prompt-schemas';
import {
  buildCreativePrompt,
  compilePromptToString,
  CreativeBrandContext,
} from '../pipelines/creative/creative-prompt-builder';
import { formatPromptForPlatform } from '../pipelines/creative/platform-prompt-formatter';

export type { PlatformPreset, PromptBreakdown, FormattedPromptOutput };

export interface UsePromptStudioOptions {
  releaseId: string;
  initialContext?: CreativeBrandContext;
  initialPreset?: PlatformPreset;
  aspectRatio?: AspectRatio;
}

export interface UsePromptStudioReturn {
  breakdown: PromptBreakdown;
  updateBreakdownField: <K extends keyof PromptBreakdown>(field: K, value: PromptBreakdown[K]) => void;
  rawPromptText: string;
  setRawPromptText: (text: string) => void;
  negativePrompt: string;
  setNegativePrompt: (negative: string) => void;
  platformPreset: PlatformPreset;
  setPlatformPreset: (preset: PlatformPreset) => void;
  formattedOutput: FormattedPromptOutput;
  isCopied: boolean;
  copyToClipboard: () => Promise<boolean>;
  resetToBrandContext: () => void;
}

const DEFAULT_BREAKDOWN: PromptBreakdown = {
  subject: 'Minimalist conceptual album art portrait',
  style: 'indie contemporary art photography, atmospheric depth',
  lighting: 'cinematic chiaroscuro, natural golden hour backlight',
  camera: 'shot on 35mm film, 8k resolution, Leica lens clarity',
  palette: ['#0F172A', '#38BDF8'],
  negativeDirectives: ['deformed', 'low resolution', 'watermark', 'blurry', 'stock photo'],
};

/**
 * Custom application hook for interactive Master Prompt compilation and editing.
 *
 * @param options - Configuration options for the prompt studio
 * @returns Fully reactive prompt state, formatted platform output, and clipboard action
 */
export function usePromptStudio({
  releaseId,
  initialContext,
  initialPreset = 'MIDJOURNEY_V6',
  aspectRatio = 'SQUARE_1_1',
}: UsePromptStudioOptions): UsePromptStudioReturn {
  // Step 1: Initialize baseline breakdown from brand context or fallback
  const initialBreakdown = useMemo(() => {
    if (initialContext) {
      return buildCreativePrompt(initialContext);
    }
    return DEFAULT_BREAKDOWN;
  }, [initialContext]);

  const [breakdown, setBreakdown] = useState<PromptBreakdown>(initialBreakdown);
  const [rawPromptText, setRawPromptText] = useState<string>(() =>
    compilePromptToString(initialBreakdown)
  );
  const [negativePrompt, setNegativePrompt] = useState<string>(
    initialBreakdown.negativeDirectives.join(', ')
  );
  const [platformPreset, setPlatformPreset] = useState<PlatformPreset>(initialPreset);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Step 2: Field update handler that re-syncs raw compiled text
  const updateBreakdownField = useCallback(
    <K extends keyof PromptBreakdown>(field: K, value: PromptBreakdown[K]) => {
      setBreakdown((prev) => {
        const next = { ...prev, [field]: value };
        setRawPromptText(compilePromptToString(next));
        if (field === 'negativeDirectives' && Array.isArray(value)) {
          setNegativePrompt(value.join(', '));
        }
        return next;
      });
    },
    []
  );

  // Step 3: Compute platform-formatted prompt output
  const formattedOutput = useMemo(() => {
    return formatPromptForPlatform(rawPromptText, platformPreset, aspectRatio, negativePrompt);
  }, [rawPromptText, platformPreset, aspectRatio, negativePrompt]);

  // Step 4: 1-click clipboard copy
  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(formattedOutput.compiledText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [formattedOutput.compiledText]);

  // Step 5: Reset to brand defaults
  const resetToBrandContext = useCallback(() => {
    setBreakdown(initialBreakdown);
    setRawPromptText(compilePromptToString(initialBreakdown));
    setNegativePrompt(initialBreakdown.negativeDirectives.join(', '));
  }, [initialBreakdown]);

  return {
    breakdown,
    updateBreakdownField,
    rawPromptText,
    setRawPromptText,
    negativePrompt,
    setNegativePrompt,
    platformPreset,
    setPlatformPreset,
    formattedOutput,
    isCopied,
    copyToClipboard,
    resetToBrandContext,
  };
}
