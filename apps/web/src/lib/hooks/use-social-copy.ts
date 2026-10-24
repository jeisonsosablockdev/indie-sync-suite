/**
 * @file use-social-copy.ts
 * @layer Application
 * @description Application hook managing campaign promotional copy across launch phases (T-14, T-7, T-0, T+7),
 *              live character limit validation, and clipboard copying. Zero direct JSX.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  CampaignPhase,
  SocialPlatform,
  CampaignCopyResult,
  generateCampaignCopy,
  validateCharacterLimit,
} from '../pipelines/creative/social-copy-generator';

export type { CampaignPhase, SocialPlatform, CampaignCopyResult };

export interface UseSocialCopyOptions {
  releaseTitle: string;
  artistName: string;
  genre: string;
  narrative: string;
  streamingLink?: string;
  initialPhase?: CampaignPhase;
  initialPlatform?: SocialPlatform;
}

export interface UseSocialCopyReturn {
  phase: CampaignPhase;
  setPhase: (phase: CampaignPhase) => void;
  platform: SocialPlatform;
  setPlatform: (platform: SocialPlatform) => void;
  copyResult: CampaignCopyResult;
  customText: string;
  setCustomText: (text: string) => void;
  metrics: {
    characterCount: number;
    maxAllowed: number;
    remaining: number;
    valid: boolean;
  };
  isCopied: boolean;
  copyToClipboard: () => Promise<boolean>;
  resetToTemplate: () => void;
}

/**
 * Custom application hook for campaign copywriting and social platform formatting.
 *
 * @param options - Release details and initial phase/platform
 * @returns Reactive copywriting state, metrics, and clipboard action
 */
export function useSocialCopy({
  releaseTitle,
  artistName,
  genre,
  narrative,
  streamingLink,
  initialPhase = 'T_ZERO',
  initialPlatform = 'INSTAGRAM',
}: UseSocialCopyOptions): UseSocialCopyReturn {
  // Step 1: Initialize phase and platform state
  const [phase, setPhaseState] = useState<CampaignPhase>(initialPhase);
  const [platform, setPlatformState] = useState<SocialPlatform>(initialPlatform);
  const [isCopied, setIsCopied] = useState<boolean>(false);

  // Step 2: Compute template copy based on parameters
  const templateResult = useMemo(() => {
    return generateCampaignCopy({
      releaseTitle,
      artistName,
      genre,
      narrative,
      phase,
      platform,
      streamingLink,
    });
  }, [releaseTitle, artistName, genre, narrative, phase, platform, streamingLink]);

  // Step 3: Allow user manual overrides
  const [customText, setCustomText] = useState<string>(templateResult.fullFormattedText);

  // Switching phase regenerates template text
  const setPhase = useCallback(
    (newPhase: CampaignPhase) => {
      setPhaseState(newPhase);
      const updated = generateCampaignCopy({
        releaseTitle,
        artistName,
        genre,
        narrative,
        phase: newPhase,
        platform,
        streamingLink,
      });
      setCustomText(updated.fullFormattedText);
    },
    [releaseTitle, artistName, genre, narrative, platform, streamingLink]
  );

  // Switching platform regenerates formatted text
  const setPlatform = useCallback(
    (newPlatform: SocialPlatform) => {
      setPlatformState(newPlatform);
      const updated = generateCampaignCopy({
        releaseTitle,
        artistName,
        genre,
        narrative,
        phase,
        platform: newPlatform,
        streamingLink,
      });
      setCustomText(updated.fullFormattedText);
    },
    [releaseTitle, artistName, genre, narrative, phase, streamingLink]
  );

  // Re-sync copy result with current edited text
  const copyResult = useMemo(
    () => ({
      ...templateResult,
      fullFormattedText: customText,
    }),
    [templateResult, customText]
  );

  // Step 4: Live metrics
  const metrics = useMemo(() => {
    return validateCharacterLimit(customText, platform);
  }, [customText, platform]);

  // Step 5: Clipboard copy
  const copyToClipboard = useCallback(async (): Promise<boolean> => {
    try {
      if (typeof navigator !== 'undefined' && navigator.clipboard) {
        await navigator.clipboard.writeText(customText);
        setIsCopied(true);
        setTimeout(() => setIsCopied(false), 2000);
        return true;
      }
      return false;
    } catch {
      return false;
    }
  }, [customText]);

  // Step 6: Reset to generated template
  const resetToTemplate = useCallback(() => {
    setCustomText(templateResult.fullFormattedText);
  }, [templateResult.fullFormattedText]);

  return {
    phase,
    setPhase,
    platform,
    setPlatform,
    copyResult,
    customText,
    setCustomText,
    metrics,
    isCopied,
    copyToClipboard,
    resetToTemplate,
  };
}
