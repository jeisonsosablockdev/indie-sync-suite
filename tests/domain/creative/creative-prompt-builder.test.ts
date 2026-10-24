/**
 * @file creative-prompt-builder.test.ts
 * @layer Domain Test
 * @description Unit tests for pure functional compilation of 3-level brand context into visual prompts.
 *              Validates strict brand anchoring, palette injection, and deterministic prompt synthesis per tdd-primal.
 */

import { describe, it, expect } from 'vitest';
import {
  buildCreativePrompt,
  compilePromptToString,
  CreativeBrandContext,
} from '../../../apps/web/src/lib/pipelines/creative/creative-prompt-builder';

describe('Domain: Creative Prompt Builder (HU-3.6 / SPEC-03-01)', () => {
  const fullContext: CreativeBrandContext = {
    labelName: 'Neon Wave Records',
    labelTone: 'Visionary, bold and atmospheric',
    artistName: 'Solaris Echo',
    genre: 'Synthwave / Dream Pop',
    visualIdentity: 'analog CRT textures, magenta sunset neon highlights',
    colorPalette: ['#FF2A85', '#00F0FF', '#0D0221'],
    releaseTitle: 'Midnight Horizons',
    narrative: 'A midnight cruise through coastal highways escaping an electric storm',
    lyricTheme: 'Nostalgia, longing and rebirth',
    soundMood: 'Melancholic yet driving and energetic',
  };

  describe('buildCreativePrompt Context Ingestion (@spec REQ-HU-3.6-10)', () => {
    it('synthesizes visual subject containing artist, release title, sound mood and narrative', () => {
      // Act
      const breakdown = buildCreativePrompt(fullContext);

      // Assert
      expect(breakdown.subject).toContain(fullContext.artistName);
      expect(breakdown.subject).toContain(fullContext.releaseTitle);
      expect(breakdown.subject).toContain(fullContext.soundMood);
      expect(breakdown.subject).toContain(fullContext.narrative);
    });

    it('anchors aesthetic style to artist genre, visual identity and label ethos (Level 1 + 2)', () => {
      // Act
      const breakdown = buildCreativePrompt(fullContext);

      // Assert: Verify Level 2 identity and Level 1 ethos
      expect(breakdown.style).toContain(fullContext.genre);
      expect(breakdown.style).toContain('analog CRT textures');
      expect(breakdown.style).toContain(`curatorial ethos: ${fullContext.labelTone}`);
    });

    it('injects artist color palette when present', () => {
      // Act
      const breakdown = buildCreativePrompt(fullContext);

      // Assert
      expect(breakdown.palette).toEqual(['#FF2A85', '#00F0FF', '#0D0221']);
    });

    it('provides fallback color palette when artist palette is empty array or undefined', () => {
      // Arrange
      const emptyPaletteContext: CreativeBrandContext = {
        ...fullContext,
        colorPalette: [],
      };
      const undefinedPaletteContext: CreativeBrandContext = {
        ...fullContext,
        colorPalette: undefined,
      };

      // Act
      const breakdownEmpty = buildCreativePrompt(emptyPaletteContext);
      const breakdownUndefined = buildCreativePrompt(undefinedPaletteContext);

      // Assert: Both boundary cases fall back to canonical high-contrast defaults
      expect(breakdownEmpty.palette).toEqual(['#1A1A1A', '#E5E5E5']);
      expect(breakdownUndefined.palette).toEqual(['#1A1A1A', '#E5E5E5']);
    });

    it('provides default artistic style photography when visual identity is omitted', () => {
      // Arrange
      const noVisualIdentityContext: CreativeBrandContext = {
        ...fullContext,
        visualIdentity: undefined,
      };

      // Act
      const breakdown = buildCreativePrompt(noVisualIdentityContext);

      // Assert
      expect(breakdown.style).toContain('album cover photography, artistic conceptual composition');
      expect(breakdown.style).toContain(fullContext.genre);
    });
  });

  describe('compilePromptToString Serialization (@spec REQ-HU-3.6-11)', () => {
    it('collapses breakdown into a single unified comma-separated prompt string', () => {
      // Arrange
      const breakdown = buildCreativePrompt(fullContext);

      // Act
      const compiled = compilePromptToString(breakdown);

      // Assert
      expect(typeof compiled).toBe('string');
      expect(compiled).toContain(fullContext.releaseTitle);
      expect(compiled).toContain(breakdown.lighting);
      expect(compiled).toContain(breakdown.camera);
      expect(compiled).toContain('color tones: #FF2A85, #00F0FF, #0D0221');
    });

    it('omits color tones segment when palette array is empty', () => {
      // Arrange
      const breakdown = {
        subject: 'Violin soloist in grand auditorium',
        style: 'Classical realism portrait',
        lighting: 'Warm stage spotlight',
        camera: '50mm prime lens',
        palette: [],
        negativeDirectives: [],
      };

      // Act
      const compiled = compilePromptToString(breakdown);

      // Assert
      expect(compiled).not.toContain('color tones:');
      expect(compiled).toContain('Violin soloist in grand auditorium, Classical realism portrait');
    });
  });
});
