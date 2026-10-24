/**
 * @file social-copy-generator.test.ts
 * @layer Domain Test
 * @description Unit tests for social-copy-generator (HU-3.3 / SPEC-03-04).
 *              Verifies campaign copy generation by phase, platform limits, and hashtag formatting.
 */

import { describe, test, expect } from 'vitest';
import {
  generateCampaignCopy,
  validateCharacterLimit,
  PLATFORM_LIMITS,
  CampaignCopyInput,
} from '../../../apps/web/src/lib/pipelines/creative/social-copy-generator';

describe('Domain: social-copy-generator (HU-3.3 / SPEC-03-04)', () => {
  const baseInput: CampaignCopyInput = {
    releaseTitle: 'Neon Odyssey',
    artistName: 'Luna Astral',
    genre: 'Synthwave / Retrowave',
    narrative: 'A journey through a neon-lit cyberpunk metropolis in search of human connection.',
    phase: 'T_ZERO',
    platform: 'INSTAGRAM',
  };

  test('@spec REQ-HU-3.3-01: generates release day (T_ZERO) copy with streaming link fallback', () => {
    // Act
    const result = generateCampaignCopy(baseInput);

    // Assert
    expect(result.headline).toContain('¡YA DISPONIBLE!');
    expect(result.headline).toContain('Neon Odyssey');
    expect(result.headline).toContain('Luna Astral');
    expect(result.callToAction).toContain('Spotify, Apple Music y todas las plataformas');
    expect(result.isWithinLimits).toBe(true);
    expect(result.characterCount).toBeLessThanOrEqual(PLATFORM_LIMITS.INSTAGRAM);
    expect(result.hashtags).toContain('#lunaastral');
    expect(result.hashtags).toContain('#synthwaveretrowave');
    expect(result.hashtags).toContain('#IndieMusic');
  });

  test('@spec REQ-HU-3.3-02: generates release day (T_ZERO) copy with explicit streaming link', () => {
    // Arrange
    const inputWithLink: CampaignCopyInput = {
      ...baseInput,
      streamingLink: 'https://distrokid.com/hyperfollow/luna/neon-odyssey',
    };

    // Act
    const result = generateCampaignCopy(inputWithLink);

    // Assert
    expect(result.callToAction).toContain('https://distrokid.com/hyperfollow/luna/neon-odyssey');
    expect(result.fullFormattedText).toContain('https://distrokid.com/hyperfollow/luna/neon-odyssey');
  });

  test('@spec REQ-HU-3.3-03: generates T-14 teaser copy targeting pre-save anticipation', () => {
    // Arrange
    const input: CampaignCopyInput = {
      ...baseInput,
      phase: 'T_MINUS_14',
    };

    // Act
    const result = generateCampaignCopy(input);

    // Assert
    expect(result.headline).toContain('Próximamente: "Neon Odyssey"');
    expect(result.body).toContain('dos semanas');
    expect(result.body).toContain(input.narrative);
    expect(result.callToAction).toContain('Pre-Save');
  });

  test('@spec REQ-HU-3.3-04: generates T-7 countdown copy focusing on 7-day milestone', () => {
    // Arrange
    const input: CampaignCopyInput = {
      ...baseInput,
      phase: 'T_MINUS_7',
    };

    // Act
    const result = generateCampaignCopy(input);

    // Assert
    expect(result.headline).toContain('7 días para el estreno');
    expect(result.body).toContain('Synthwave / Retrowave');
    expect(result.callToAction).toContain('cuenta regresiva');
  });

  test('@spec REQ-HU-3.3-05: generates T+7 post-release gratitude copy', () => {
    // Arrange
    const input: CampaignCopyInput = {
      ...baseInput,
      phase: 'T_PLUS_7',
    };

    // Act
    const result = generateCampaignCopy(input);

    // Assert
    expect(result.headline).toContain('1 semana con "Neon Odyssey"');
    expect(result.body).toContain('Gracias por cada escucha');
    expect(result.callToAction).toContain('línea favorita');
  });

  test('@spec REQ-HU-3.3-06: respects Twitter/X 280 character limit with condensed format', () => {
    // Arrange
    const input: CampaignCopyInput = {
      ...baseInput,
      platform: 'TWITTER_X',
    };

    // Act
    const result = generateCampaignCopy(input);

    // Assert
    expect(result.maxCharacters).toBe(280);
    expect(result.characterCount).toBeLessThanOrEqual(280);
    expect(result.isWithinLimits).toBe(true);
    // Twitter format embeds top 3 hashtags in fullFormattedText
    expect(result.fullFormattedText.match(/#/g)?.length).toBe(3);
    expect(result.hashtags.length).toBe(5);
  });

  test('@spec REQ-HU-3.3-07: validates character limit correctly within bounds and beyond bounds', () => {
    // Within limits
    const valid = validateCharacterLimit('Short text', 'TWITTER_X');
    expect(valid.valid).toBe(true);
    expect(valid.characterCount).toBe(10);
    expect(valid.maxAllowed).toBe(280);
    expect(valid.remaining).toBe(270);

    // Over limits
    const longText = 'a'.repeat(300);
    const invalid = validateCharacterLimit(longText, 'TWITTER_X');
    expect(invalid.valid).toBe(false);
    expect(invalid.characterCount).toBe(300);
    expect(invalid.maxAllowed).toBe(280);
    expect(invalid.remaining).toBe(-20);
  });
});
