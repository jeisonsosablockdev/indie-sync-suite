/**
 * @file use-artist-portal.ts
 * @layer Application
 * @description Application hook managing the lightweight mobile Artist Portal session,
 *              master audio streaming link, deliverable reviews, and 1-tap feedback submissions. Zero direct JSX.
 */

'use client';

import { useState, useCallback, useEffect } from 'react';
import {
  PortalReviewDecision,
  PortalDeliverableReview,
} from '../pipelines/portal/portal-schemas';

export type { PortalReviewDecision, PortalDeliverableReview };

export interface PortalDeliverableItem {
  id: string;
  title: string;
  type: 'AUDIO' | 'COVER_ART' | 'VIDEO' | 'COPY';
  previewUrl?: string;
  status: 'PENDING' | 'APPROVED' | 'CHANGES_REQUESTED';
}

export interface UseArtistPortalOptions {
  token: string;
}

export interface UseArtistPortalReturn {
  isValidToken: boolean;
  isLoading: boolean;
  artistName: string;
  releaseTitle: string;
  audioMasterUrl: string | null;
  deliverables: PortalDeliverableItem[];
  isSubmitting: boolean;
  error: string | null;
  submitReview: (
    deliverableId: string,
    decision: PortalReviewDecision,
    feedback?: string
  ) => Promise<boolean>;
}

/**
 * Reactive application hook for the lightweight mobile Artist Portal.
 *
 * @param options - Configuration containing Magic Link signed token
 * @returns State and review submission actions
 */
export function useArtistPortal({ token }: UseArtistPortalOptions): UseArtistPortalReturn {
  // Step 1: Initialize portal session states
  const [isValidToken, setIsValidToken] = useState<boolean>(Boolean(token));
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [artistName, setArtistName] = useState<string>('Artista');
  const [releaseTitle, setReleaseTitle] = useState<string>('Nuevo Lanzamiento');
  const [audioMasterUrl, setAudioMasterUrl] = useState<string | null>(null);
  const [deliverables, setDeliverables] = useState<PortalDeliverableItem[]>([]);
  const [isSubmitting, setIsSubmitting] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Validate token and load deliverables on mount
  useEffect(() => {
    let active = true;

    if (!token) {
      return;
    }

    const loadSession = async () => {
      setIsLoading(true);
      setError(null);

      try {
        // Step 2a: Simulated session hydration
        if (active) {
          setArtistName('Luna Violet');
          setReleaseTitle('Ecos de Medianoche');
          setAudioMasterUrl('https://audio.example.com/master.mp3');
          setDeliverables([
            {
              id: 'd1',
              title: 'Master Audio (WAV 24-bit)',
              type: 'AUDIO',
              previewUrl: 'https://audio.example.com/master.mp3',
              status: 'PENDING',
            },
            {
              id: 'd2',
              title: 'Arte de Portada Oficial 1:1',
              type: 'COVER_ART',
              previewUrl: 'https://images.example.com/cover.jpg',
              status: 'PENDING',
            },
            {
              id: 'd3',
              title: 'Copy Oficial de Lanzamiento',
              type: 'COPY',
              status: 'PENDING',
            },
          ]);
        }
      } catch (err: unknown) {
        if (active) {
          setError(err instanceof Error ? err.message : 'Error al cargar sesión del portal');
        }
      } finally {
        if (active) {
          setIsLoading(false);
        }
      }
    };

    void loadSession();

    return () => {
      active = false;
    };
  }, [token]);

  // Step 3: Handle deliverable approval or adjustment request
  const submitReview = useCallback(
    async (
      deliverableId: string,
      decision: PortalReviewDecision,
      _feedback?: string
    ): Promise<boolean> => {
      setIsSubmitting(true);
      setError(null);

      try {
        // Step 3a: Update deliverable review locally
        setDeliverables((prev) =>
          prev.map((d) => (d.id === deliverableId ? { ...d, status: decision } : d))
        );
        return true;
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al registrar respuesta');
        return false;
      } finally {
        setIsSubmitting(false);
      }
    },
    []
  );

  return {
    isValidToken,
    isLoading,
    artistName,
    releaseTitle,
    audioMasterUrl,
    deliverables,
    isSubmitting,
    error,
    submitReview,
  };
}
