/**
 * @file use-brand-vault.ts
 * @layer Application
 * @description React hook for managing Artist and Label Brand Vault state and mutations.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  ArtistProfile,
  ArtistProfileSchema,
} from '../pipelines/brand-vault/brand-schemas';

export function useBrandVault(initialArtist?: Partial<ArtistProfile>) {
  const [artist, setArtist] = useState<Partial<ArtistProfile>>({
    name: '',
    bio: '',
    genre: '',
    subgenres: [],
    colorPalette: ['#0F172A', '#6366F1'],
    typography: { primary: 'Inter', secondary: 'Geist', weights: [400, 700] },
    toneOfVoice: '',
    socialLinks: { spotify: '', appleMusic: '', instagram: '', youtube: '', website: '' },
    ...initialArtist,
  });

  const [errors, setErrors] = useState<Record<string, string>>({});
  const [isSaving, setIsSaving] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const updateField = useCallback(<K extends keyof ArtistProfile>(field: K, value: ArtistProfile[K]) => {
    setArtist((prev: Partial<ArtistProfile>) => ({ ...prev, [field]: value }));
    setErrors((prev: Record<string, string>) => {
      const next = { ...prev };
      delete next[field as string];
      return next;
    });
    setIsSuccess(false);
  }, []);

  const updateColorPalette = useCallback((palette: string[]) => {
    updateField('colorPalette', palette);
  }, [updateField]);

  const validate = useCallback((): boolean => {
    // Fill required dummy ids for client-side form validation if not set yet
    const toValidate = {
      id: artist.id || '11111111-1111-4111-8111-111111111111',
      labelId: artist.labelId || '22222222-2222-4222-8222-222222222222',
      ...artist,
    };

    const result = ArtistProfileSchema.safeParse(toValidate);
    if (!result.success) {
      const fieldErrors: Record<string, string> = {};
      for (const issue of result.error.issues) {
        const field = issue.path[0]?.toString() || 'root';
        fieldErrors[field] = issue.message;
      }
      setErrors(fieldErrors);
      return false;
    }

    setErrors({});
    return true;
  }, [artist]);

  const save = useCallback(async (onSave?: (profile: ArtistProfile) => Promise<void>) => {
    if (!validate()) return false;

    setIsSaving(true);
    setIsSuccess(false);
    try {
      if (onSave) {
        await onSave(artist as ArtistProfile);
      }
      setIsSuccess(true);
      return true;
    } catch (err: any) {
      setErrors({ root: err?.message || 'Error al guardar el perfil del artista' });
      return false;
    } finally {
      setIsSaving(false);
    }
  }, [artist, validate]);

  return {
    artist,
    errors,
    isSaving,
    isSuccess,
    updateField,
    updateColorPalette,
    validate,
    save,
  };
}
