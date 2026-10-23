/**
 * @file release-context-builder.ts
 * @layer Domain
 * @description Hierarchical 3-level brand & release context aggregator (SPEC-2.1.1.2).
 *              Consolidates Label (Nivel 1), Artist (Nivel 2), and Release (Nivel 3).
 *              Zero classes, pure functional pattern.
 */

import { LabelProfile, ArtistProfile } from '../brand-vault/brand-schemas';
import { ReleaseConcept } from './planner-schemas';

export interface UnifiedBrandContext {
  label: {
    id: string;
    name: string;
    legalName?: string | null;
    bio?: string;
    toneOfVoice?: string;
  };
  artist: {
    id: string;
    name: string;
    genre: string;
    subgenres: string[];
    bio?: string;
    toneOfVoice?: string;
  };
  release: {
    releaseId: string;
    narrative: string;
    lyricTheme: string;
    soundMood: string;
    isrc?: string;
    upc?: string;
    targetDate: string;
    budgetUsd: number;
    snapshotFrozen: boolean;
  };
  aesthetic: {
    primaryColor: string;
    secondaryColor: string;
    typography: {
      primary: string;
      secondary?: string;
    };
  };
  promptContextText: string;
}

export interface BuildUnifiedBrandContextParams {
  label: LabelProfile;
  artist: ArtistProfile;
  releaseConcept: ReleaseConcept;
}

/**
 * Pure function aggregating the 3 strategic context tiers into a unified structure.
 *
 * @param params - Objects for Label, Artist, and ReleaseConcept.
 * @returns Fully consolidated UnifiedBrandContext entity ready for UI and AI agent prompting.
 */
export function buildUnifiedBrandContext({
  label,
  artist,
  releaseConcept,
}: BuildUnifiedBrandContextParams): UnifiedBrandContext {
  // Step 1: Resolve aesthetic palette with hierarchical fallback (Artist > Label > Defaults)
  const artistPalette = Array.isArray(artist.colorPalette) ? artist.colorPalette : [];
  const labelPalette = Array.isArray(label.colorPalette) ? label.colorPalette : [];

  const primaryColor =
    artistPalette[0] || labelPalette[0] || '#0F172A';
  const secondaryColor =
    artistPalette[1] || labelPalette[1] || '#6366F1';

  // Step 2: Resolve typography with hierarchical fallback
  const typography = {
    primary: artist.typography?.primary || label.typography?.primary || 'Inter',
    secondary: artist.typography?.secondary || label.typography?.secondary || 'Geist',
  };

  // Step 3: Assemble formatted multi-tier system prompt context for autonomous agents
  const promptContextText = [
    `[SELLO / NIVEL 1]: ${label.name}${label.legalName ? ` (${label.legalName})` : ''}`,
    label.bio ? `Biografía Sello: ${label.bio}` : null,
    label.toneOfVoice ? `Tono de Voz Sello: ${label.toneOfVoice}` : null,
    '',
    `[ARTISTA / NIVEL 2]: ${artist.name} (Género Principal: ${artist.genre})`,
    artist.subgenres.length > 0 ? `Subgéneros: ${artist.subgenres.join(', ')}` : null,
    artist.bio ? `Biografía Artista: ${artist.bio}` : null,
    artist.toneOfVoice ? `Tono de Voz Artista: ${artist.toneOfVoice}` : null,
    '',
    '[LANZAMIENTO / NIVEL 3]:',
    `Narrativa: ${releaseConcept.narrative}`,
    `Tema Lírico: ${releaseConcept.lyricTheme}`,
    `Mood Sonoro: ${releaseConcept.soundMood}`,
    `Fecha Objetivo T-0: ${releaseConcept.targetDate}`,
    `ISRC: ${releaseConcept.isrc || 'Pendiente de asignación'} | UPC: ${releaseConcept.upc || 'Pendiente de asignación'}`,
    `Presupuesto Pauta ($USD): $${(releaseConcept.budgetUsd ?? 0).toLocaleString('en-US', { minimumFractionDigits: 2 })}`,
    releaseConcept.snapshotFrozen ? 'Estado: Snapshot de producción congelado (inmutable)' : 'Estado: Modo borrador activo',
  ]
    .filter(line => line !== null)
    .join('\n');

  // Step 4: Return consolidated domain context
  return {
    label: {
      id: label.id,
      name: label.name,
      legalName: label.legalName,
      bio: label.bio,
      toneOfVoice: label.toneOfVoice,
    },
    artist: {
      id: artist.id,
      name: artist.name,
      genre: artist.genre,
      subgenres: artist.subgenres || [],
      bio: artist.bio,
      toneOfVoice: artist.toneOfVoice,
    },
    release: {
      releaseId: releaseConcept.releaseId,
      narrative: releaseConcept.narrative,
      lyricTheme: releaseConcept.lyricTheme,
      soundMood: releaseConcept.soundMood,
      isrc: releaseConcept.isrc,
      upc: releaseConcept.upc,
      targetDate: releaseConcept.targetDate,
      budgetUsd: releaseConcept.budgetUsd ?? 0,
      snapshotFrozen: Boolean(releaseConcept.snapshotFrozen),
    },
    aesthetic: {
      primaryColor,
      secondaryColor,
      typography,
    },
    promptContextText,
  };
}
