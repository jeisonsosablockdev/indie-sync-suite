/**
 * @file typography-compositor.test.ts
 * @layer Domain Test
 * @description Unit tests for typography-compositor (HU-3.4 / SPEC-03-05).
 *              Verifies layout geometric calculations, style presets, alignment, and 3000px scaling.
 */

import { describe, test, expect } from 'vitest';
import {
  computeTypographyLayout,
  TypographyLayoutInput,
} from '../../../apps/web/src/lib/pipelines/creative/typography-compositor';

describe('Domain: typography-compositor (HU-3.4 / SPEC-03-05)', () => {
  const baseInput: TypographyLayoutInput = {
    titleText: 'Midnight Echoes',
    artistText: 'Astral Project',
    style: 'MINIMALIST',
  };

  test('@spec REQ-HU-3.4-01: defaults to 3000x3000px square canvas for high-resolution cover standard', () => {
    // Act
    const layout = computeTypographyLayout(baseInput);

    // Assert
    expect(layout.canvasWidth).toBe(3000);
    expect(layout.canvasHeight).toBe(3000);
    expect(layout.style).toBe('MINIMALIST');
  });

  test('@spec REQ-HU-3.4-02: computes MINIMALIST layout with bottom-left anchor and subtle hierarchy', () => {
    // Act
    const layout = computeTypographyLayout(baseInput);

    // Assert
    expect(layout.titlePlacement.alignment).toBe('left');
    expect(layout.titlePlacement.x).toBe(3000 * 0.08);
    expect(layout.titlePlacement.y).toBe(3000 * 0.88);
    expect(layout.titlePlacement.fontSize).toBe(110);
    expect(layout.titlePlacement.fontFamily).toContain('Inter');

    expect(layout.artistPlacement.alignment).toBe('left');
    expect(layout.artistPlacement.x).toBe(3000 * 0.08);
    expect(layout.artistPlacement.y).toBe(3000 * 0.93);
    expect(layout.artistPlacement.fontSize).toBe(70);
  });

  test('@spec REQ-HU-3.4-03: computes EDITORIAL layout with centered serif title and generous tracking', () => {
    // Arrange
    const input: TypographyLayoutInput = {
      ...baseInput,
      style: 'EDITORIAL',
    };

    // Act
    const layout = computeTypographyLayout(input);

    // Assert
    expect(layout.style).toBe('EDITORIAL');
    expect(layout.titlePlacement.alignment).toBe('center');
    expect(layout.titlePlacement.x).toBe(1500); // 3000 / 2
    expect(layout.titlePlacement.y).toBe(3000 * 0.78);
    expect(layout.titlePlacement.fontFamily).toContain('Playfair Display');
    expect(layout.titlePlacement.letterSpacing).toBe(4);
    expect(layout.titlePlacement.text).toBe('MIDNIGHT ECHOES');

    expect(layout.artistPlacement.alignment).toBe('center');
    expect(layout.artistPlacement.letterSpacing).toBe(8);
  });

  test('@spec REQ-HU-3.4-04: computes BOLD_IMPACT layout with large upper-left display typography', () => {
    // Arrange
    const input: TypographyLayoutInput = {
      ...baseInput,
      style: 'BOLD_IMPACT',
    };

    // Act
    const layout = computeTypographyLayout(input);

    // Assert
    expect(layout.style).toBe('BOLD_IMPACT');
    expect(layout.titlePlacement.alignment).toBe('left');
    expect(layout.titlePlacement.y).toBe(3000 * 0.25);
    expect(layout.titlePlacement.fontSize).toBe(240);
    expect(layout.titlePlacement.fontWeight).toBe('900');
    expect(layout.artistPlacement.fontSize).toBe(100);
  });

  test('@spec REQ-HU-3.4-05: computes VINTAGE_VINYL layout with split top-bottom typewriter positioning', () => {
    // Arrange
    const input: TypographyLayoutInput = {
      ...baseInput,
      style: 'VINTAGE_VINYL',
    };

    // Act
    const layout = computeTypographyLayout(input);

    // Assert
    expect(layout.style).toBe('VINTAGE_VINYL');
    expect(layout.titlePlacement.y).toBe(3000 * 0.15); // Top header
    expect(layout.artistPlacement.y).toBe(3000 * 0.90); // Bottom footer
    expect(layout.titlePlacement.fontFamily).toContain('Courier Prime');
    expect(layout.artistPlacement.fontFamily).toContain('Courier Prime');
  });

  test('@spec REQ-HU-3.4-06: respects custom canvas dimensions and hex color palette', () => {
    // Arrange
    const input: TypographyLayoutInput = {
      ...baseInput,
      canvasWidth: 1080,
      canvasHeight: 1920,
      primaryColor: '#FFCC00',
      secondaryColor: '#FF6600',
    };

    // Act
    const layout = computeTypographyLayout(input);

    // Assert
    expect(layout.canvasWidth).toBe(1080);
    expect(layout.canvasHeight).toBe(1920);
    expect(layout.titlePlacement.color).toBe('#FFCC00');
    expect(layout.artistPlacement.color).toBe('#FF6600');
    expect(layout.titlePlacement.x).toBe(1080 * 0.08);
  });
});
