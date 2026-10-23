/**
 * @file use-audio-link-verification.ts
 * @layer Application
 * @description React hook for managing external audio links and triggering probe verifications.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  ExternalAudioLink,
  AudioCategory,
} from '../pipelines/planner/audio-link-schemas';

export interface UseAudioLinkVerificationProps {
  initialLinks?: ExternalAudioLink[];
  onSaveLink?: (category: AudioCategory, url: string) => Promise<ExternalAudioLink>;
  onVerifyLink?: (linkId: string) => Promise<{ verified: boolean; mimeType?: string; fileSizeBytes?: number; error?: string }>;
}

export function useAudioLinkVerification({
  initialLinks = [],
  onSaveLink,
  onVerifyLink,
}: UseAudioLinkVerificationProps = {}) {
  const [links, setLinks] = useState<ExternalAudioLink[]>(initialLinks);
  const [isVerifying, setIsVerifying] = useState<Record<string, boolean>>({});
  const [errors, setErrors] = useState<Record<string, string>>({});

  const saveLink = useCallback(
    async (category: AudioCategory, url: string) => {
      if (!onSaveLink) return;
      try {
        const saved = await onSaveLink(category, url);
        setLinks(prev => {
          const index = prev.findIndex(l => l.category === category);
          if (index >= 0) {
            const next = [...prev];
            next[index] = saved;
            return next;
          }
          return [...prev, saved];
        });
        setErrors(prev => {
          const next = { ...prev };
          delete next[category];
          return next;
        });
        return saved;
      } catch (err: any) {
        setErrors(prev => ({
          ...prev,
          [category]: err.message || 'Error al guardar el enlace de audio.',
        }));
        throw err;
      }
    },
    [onSaveLink]
  );

  const verifyLink = useCallback(
    async (linkId: string, category: AudioCategory) => {
      if (!onVerifyLink) return;
      setIsVerifying(prev => ({ ...prev, [linkId]: true }));
      try {
        const result = await onVerifyLink(linkId);
        setLinks(prev =>
          prev.map(l =>
            l.id === linkId
              ? {
                  ...l,
                  verifiedStatus: result.verified ? 'VERIFIED' : 'ERROR',
                  verifiedAt: result.verified ? new Date().toISOString() : null,
                  mimeType: result.mimeType ?? l.mimeType,
                  fileSizeBytes: result.fileSizeBytes ?? l.fileSizeBytes,
                }
              : l
          )
        );
        if (!result.verified && result.error) {
          setErrors(prev => ({ ...prev, [category]: result.error! }));
        }
      } catch (err: any) {
        setErrors(prev => ({
          ...prev,
          [category]: err.message || 'Fallo en la verificación de cabeceras HTTP.',
        }));
      } finally {
        setIsVerifying(prev => ({ ...prev, [linkId]: false }));
      }
    },
    [onVerifyLink]
  );

  return {
    links,
    isVerifying,
    errors,
    saveLink,
    verifyLink,
    setLinks,
  };
}
