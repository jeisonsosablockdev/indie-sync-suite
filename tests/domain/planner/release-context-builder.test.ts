/**
 * @file release-context-builder.test.ts
 * @layer Domain Test
 * @description Unit tests for hierarchical 3-level brand & release context aggregation (SPEC-2.1.1.2).
 *              Strict TDD AAA structure and anti-tautology compliance.
 */

import { describe, test, expect } from 'vitest';
import {
  buildUnifiedBrandContext,
  UnifiedBrandContext,
} from '../../../apps/web/src/lib/pipelines/planner/release-context-builder';
import { LabelProfile, ArtistProfile } from '../../../apps/web/src/lib/pipelines/brand-vault/brand-schemas';
import { ReleaseConcept } from '../../../apps/web/src/lib/pipelines/planner/planner-schemas';

describe('Unified Brand & Release Context Aggregator (SPEC-2.1.1.2)', () => {
  const mockLabel: LabelProfile = {
    id: '10000000-0000-4000-8000-000000000001',
    name: 'Astral Echoes Records',
    legalName: 'Astral Echoes LLC',
    bio: 'Sello discográfico boutique especializado en electrónica experimental y synthwave.',
    colorPalette: ['#0B0F19', '#6366F1'],
    typography: { primary: 'Geist', weights: [400, 700] },
    toneOfVoice: 'Vanguardista, atmosférico, cinematográfico',
    socialLinks: { website: 'https://astralechoes.io' },
  };

  const mockArtist: ArtistProfile = {
    id: '20000000-0000-4000-8000-000000000001',
    labelId: '10000000-0000-4000-8000-000000000001',
    name: 'Neon Mirage',
    genre: 'Synthwave',
    bio: 'Productor de sintetizadores analógicos con raíces retro-futuristas.',
    subgenres: ['Darksynth', 'Cyberpunk', 'Chillwave'],
    colorPalette: ['#FF007F', '#00F0FF'],
    typography: { primary: 'Inter', weights: [300, 600] },
    toneOfVoice: 'Rebelde, nostálgico, enigmático',
    socialLinks: { spotify: 'https://spotify.com/artist/neonmirage' },
  };

  const mockReleaseConcept: ReleaseConcept = {
    id: '30000000-0000-4000-8000-000000000001',
    releaseId: '40000000-0000-4000-8000-000000000001',
    narrative: 'El viaje solitario de un androide que busca memorias olvidadas en Neo-Bogotá.',
    lyricTheme: 'Memoria artificial, nostalgia cibernética y soledad.',
    soundMood: 'Bajos analógicos saturados tipo Moog, arpegios rápidos a 128 BPM y pads densos.',
    isrc: 'USS1Z2600001',
    upc: '012345678905',
    targetDate: '2026-12-15T00:00:00.000Z',
    budgetUsd: 2500.0,
    snapshotFrozen: false,
  };

  test('@spec SPEC-2.1.1.2: aggregates Label (Nivel 1), Artist (Nivel 2) and Release (Nivel 3) into UnifiedBrandContext', () => {
    // Arrange & Act
    const unified: UnifiedBrandContext = buildUnifiedBrandContext({
      label: mockLabel,
      artist: mockArtist,
      releaseConcept: mockReleaseConcept,
    });

    // Assert: Level 1 inheritance
    expect(unified.label.name).toBe('Astral Echoes Records');
    expect(unified.label.legalName).toBe('Astral Echoes LLC');

    // Assert: Level 2 inheritance
    expect(unified.artist.name).toBe('Neon Mirage');
    expect(unified.artist.genre).toBe('Synthwave');
    expect(unified.aesthetic.primaryColor).toBe('#FF007F'); // Artist palette takes aesthetic priority
    expect(unified.aesthetic.secondaryColor).toBe('#00F0FF');

    // Assert: Level 3 specific concept
    expect(unified.release.narrative).toContain('Neo-Bogotá');
    expect(unified.release.soundMood).toContain('Moog');
    expect(unified.release.isrc).toBe('USS1Z2600001');
    expect(unified.release.budgetUsd).toBe(2500.0);
  });

  test('@spec SPEC-2.1.1.2: generates formatted AI prompt context including all 3 strategic tiers', () => {
    // Arrange & Act
    const unified = buildUnifiedBrandContext({
      label: mockLabel,
      artist: mockArtist,
      releaseConcept: mockReleaseConcept,
    });

    // Assert: Prompt context string contains all critical elements
    expect(unified.promptContextText).toContain('[SELLO / NIVEL 1]: Astral Echoes Records');
    expect(unified.promptContextText).toContain('[ARTISTA / NIVEL 2]: Neon Mirage');
    expect(unified.promptContextText).toContain('[LANZAMIENTO / NIVEL 3]:');
    expect(unified.promptContextText).toContain('Narrativa: El viaje solitario de un androide');
    expect(unified.promptContextText).toContain('Mood Sonoro: Bajos analógicos saturados');
  });

  test('@spec SPEC-2.1.1.2: falls back gracefully to Label aesthetic palette when Artist colorPalette is empty', () => {
    // Arrange
    const artistWithoutPalette: ArtistProfile = {
      ...mockArtist,
      colorPalette: [],
    };

    // Act
    const unified = buildUnifiedBrandContext({
      label: mockLabel,
      artist: artistWithoutPalette,
      releaseConcept: mockReleaseConcept,
    });

    // Assert: Falls back to Label primary color
    expect(unified.aesthetic.primaryColor).toBe('#0B0F19');
    expect(unified.aesthetic.secondaryColor).toBe('#6366F1');
  });
});
