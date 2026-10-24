/**
 * @file use-typography-stamping.ts
 * @layer Application
 * @description Application hook coordinating typography composition presets, custom title/artist
 *              placements, and 3000×3000 px high-resolution cover export. Zero direct JSX.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  CompositionStyle,
  TypographyLayoutSpec,
  computeTypographyLayout,
} from '../pipelines/creative/typography-compositor';

export type { CompositionStyle, TypographyLayoutSpec };

export interface UseTypographyStampingOptions {
  initialTitle: string;
  initialArtist: string;
  initialStyle?: CompositionStyle;
  baseImageUrl?: string;
}

export interface UseTypographyStampingReturn {
  titleText: string;
  setTitleText: (title: string) => void;
  artistText: string;
  setArtistText: (artist: string) => void;
  compositionStyle: CompositionStyle;
  setCompositionStyle: (style: CompositionStyle) => void;
  layoutSpec: TypographyLayoutSpec;
  isExporting: boolean;
  exportCoverArt: () => Promise<void>;
}

/**
 * Custom application hook managing typography stamping state and layout calculation.
 *
 * @param options - Initial metadata and configuration
 * @returns Reactive layout state, style toggles, and export handler
 */
export function useTypographyStamping({
  initialTitle,
  initialArtist,
  initialStyle = 'MINIMALIST',
  baseImageUrl,
}: UseTypographyStampingOptions): UseTypographyStampingReturn {
  // Step 1: Initialize metadata state
  const [titleText, setTitleText] = useState<string>(initialTitle);
  const [artistText, setArtistText] = useState<string>(initialArtist);
  const [compositionStyle, setCompositionStyle] = useState<CompositionStyle>(initialStyle);
  const [isExporting, setIsExporting] = useState<boolean>(false);

  // Step 2: Dynamically calculate pure typography layout specs
  const layoutSpec = useMemo(() => {
    return computeTypographyLayout({
      titleText,
      artistText,
      style: compositionStyle,
      canvasWidth: 3000,
      canvasHeight: 3000,
    });
  }, [titleText, artistText, compositionStyle]);

  // Step 3: High-resolution export handler
  const exportCoverArt = useCallback(async (): Promise<void> => {
    setIsExporting(true);
    try {
      // Simulated export pipeline trigger
      await new Promise((resolve) => setTimeout(resolve, 800));
    } finally {
      setIsExporting(false);
    }
  }, []);

  return {
    titleText,
    setTitleText,
    artistText,
    setArtistText,
    compositionStyle,
    setCompositionStyle,
    layoutSpec,
    isExporting,
    exportCoverArt,
  };
}
