/**
 * @file platform-prompt-formatter.test.ts
 * @layer Domain Test
 * @description Unit tests for platform-specific prompt formatting (Midjourney, Flux, Runway, Raw Text).
 *              Verifies pure functional behavior, syntax flags, and token estimation per tdd-primal.
 */

import { describe, it, expect } from 'vitest';
import { formatPromptForPlatform } from '../../../apps/web/src/lib/pipelines/creative/platform-prompt-formatter';

describe('Domain: Platform Prompt Formatter (HU-3.6 / SPEC-03-01)', () => {
  const basePrompt = 'Vintage analog tape recorder in sound studio, warm ambient glow';

  describe('Midjourney v6 Preset Formatting (@spec REQ-HU-3.6-05)', () => {
    it('appends square aspect ratio flag (--ar 1:1) and raw style parameters for cover art', () => {
      // Arrange & Act
      const result = formatPromptForPlatform(basePrompt, 'MIDJOURNEY_V6', 'SQUARE_1_1');

      // Assert
      expect(result.platformPreset).toBe('MIDJOURNEY_V6');
      expect(result.aspectRatioFlag).toBe('--ar 1:1');
      expect(result.compiledText).toContain('--ar 1:1');
      expect(result.compiledText).toContain('--v 6.0 --style raw');
      expect(result.compiledText.startsWith(basePrompt)).toBe(true);
    });

    it('appends vertical aspect ratio flag (--ar 9:16) for canvas and vertical videos', () => {
      // Arrange & Act
      const result = formatPromptForPlatform(basePrompt, 'MIDJOURNEY_V6', 'PORTRAIT_9_16');

      // Assert
      expect(result.aspectRatioFlag).toBe('--ar 9:16');
      expect(result.compiledText).toContain('--ar 9:16');
    });

    it('appends horizontal aspect ratio flag (--ar 16:9) for banners', () => {
      // Arrange & Act
      const result = formatPromptForPlatform(basePrompt, 'MIDJOURNEY_V6', 'LANDSCAPE_16_9');

      // Assert
      expect(result.aspectRatioFlag).toBe('--ar 16:9');
      expect(result.compiledText).toContain('--ar 16:9');
    });

    it('injects negative prompt using Midjourney --no syntax when provided', () => {
      // Arrange & Act
      const result = formatPromptForPlatform(
        basePrompt,
        'MIDJOURNEY_V6',
        'SQUARE_1_1',
        'text, deformed fingers, blur'
      );

      // Assert
      expect(result.compiledText).toContain('--no text, deformed fingers, blur');
      expect(result.negativePrompt).toBe('text, deformed fingers, blur');
    });

    it('ignores negative prompt when empty string or whitespace only', () => {
      // Arrange & Act
      const result = formatPromptForPlatform(basePrompt, 'MIDJOURNEY_V6', 'SQUARE_1_1', '   ');

      // Assert
      expect(result.compiledText).not.toContain('--no');
    });
  });

  describe('Flux / Stable Diffusion Preset Formatting (@spec REQ-HU-3.6-06)', () => {
    it('formats clean prompt without midjourney flags', () => {
      // Arrange & Act
      const result = formatPromptForPlatform(basePrompt, 'FLUX_SD', 'SQUARE_1_1');

      // Assert
      expect(result.platformPreset).toBe('FLUX_SD');
      expect(result.compiledText).not.toContain('--v 6.0');
      expect(result.compiledText).not.toContain('--ar');
      expect(result.compiledText).toBe(basePrompt);
    });

    it('formats negative prompt directive using pipe conditioning delimiter', () => {
      // Arrange & Act
      const result = formatPromptForPlatform(
        basePrompt,
        'FLUX_SD',
        'SQUARE_1_1',
        'blurry, noisy, low quality'
      );

      // Assert
      expect(result.compiledText).toBe(`${basePrompt} | Negative: blurry, noisy, low quality`);
      expect(result.negativePrompt).toBe('blurry, noisy, low quality');
    });
  });

  describe('Runway / Kling Motion Preset Formatting (@spec REQ-HU-3.6-07)', () => {
    it('prepends cinematic motion camera capture directive', () => {
      // Arrange & Act
      const result = formatPromptForPlatform(basePrompt, 'RUNWAY_KLING', 'PORTRAIT_9_16');

      // Assert
      expect(result.platformPreset).toBe('RUNWAY_KLING');
      expect(result.compiledText).toContain('Cinematic slow motion, high definition video capture:');
      expect(result.compiledText).toContain(basePrompt);
    });
  });

  describe('Raw Text Preset Formatting (@spec REQ-HU-3.6-08)', () => {
    it('preserves canonical prompt text untouched for neutral LLMs', () => {
      // Arrange & Act
      const result = formatPromptForPlatform(basePrompt, 'RAW_TEXT', 'SQUARE_1_1');

      // Assert
      expect(result.platformPreset).toBe('RAW_TEXT');
      expect(result.compiledText).toBe(basePrompt);
    });
  });

  describe('Token Estimation Formula (@spec REQ-HU-3.6-09)', () => {
    it('calculates deterministic token count using Math.ceil(length / 4)', () => {
      // Arrange & Act
      // 'Short prompt' has length 12: 12 / 4 = 3
      const result12 = formatPromptForPlatform('Short prompt', 'RAW_TEXT');
      // 'Short prompt!' has length 13: ceil(13 / 4) = 4
      const result13 = formatPromptForPlatform('Short prompt!', 'RAW_TEXT');
      // '12345678' has length 8: 8 / 4 = 2
      const result8 = formatPromptForPlatform('12345678', 'RAW_TEXT');

      // Assert: Exact equality kills divisor mutation (Mutant 2)
      expect(result12.estimatedTokens).toBe(3);
      expect(result13.estimatedTokens).toBe(4);
      expect(result8.estimatedTokens).toBe(2);
    });
  });
});
