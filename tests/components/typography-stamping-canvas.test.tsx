/**
 * @file typography-stamping-canvas.test.tsx
 * @layer Presentation Test
 * @description UI component tests for TypographyStampingCanvas (HU-3.4 / SPEC-03-05).
 *              Verifies interactive inputs, preset selection, style updates, and export action.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { TypographyStampingCanvas } from '../../apps/web/src/components/creative/typography-stamping-canvas';

describe('Presentation: TypographyStampingCanvas (HU-3.4 / SPEC-03-05)', () => {
  const defaultProps = {
    initialTitle: 'Starlight Voyage',
    initialArtist: 'Celeste Echo',
    baseImageUrl: 'https://example.com/cover.png',
  };

  test('@spec REQ-HU-3.4-07: renders typography canvas with title, artist, and 4 style presets', () => {
    // Act
    render(<TypographyStampingCanvas {...defaultProps} />);

    // Assert
    expect(screen.getByText('Maquetación Tipográfica Vectorial (3000×3000 px)')).toBeDefined();
    expect(screen.getByDisplayValue('Starlight Voyage')).toBeDefined();
    expect(screen.getByDisplayValue('Celeste Echo')).toBeDefined();
    expect(screen.getByText('Minimalista')).toBeDefined();
    expect(screen.getByText('Editorial')).toBeDefined();
    expect(screen.getByText('Bold Impact')).toBeDefined();
    expect(screen.getByText('Vintage Vinyl')).toBeDefined();
    expect(screen.getByText('Exportar Portada Final')).toBeDefined();
  });

  test('@spec REQ-HU-3.4-08: switches composition style preset to Editorial and transforms title text to uppercase', () => {
    // Act
    render(<TypographyStampingCanvas {...defaultProps} />);

    const editorialBtn = screen.getByText('Editorial');
    fireEvent.click(editorialBtn);

    // In EDITORIAL style, title text in layoutSpec is transformed to uppercase
    expect(screen.getByText('STARLIGHT VOYAGE')).toBeDefined();
    expect(screen.getByText('CELESTE ECHO')).toBeDefined();
  });

  test('@spec REQ-HU-3.4-09: updates canvas preview dynamically when changing release title', () => {
    // Act
    render(<TypographyStampingCanvas {...defaultProps} />);

    const titleInput = screen.getByDisplayValue('Starlight Voyage');
    fireEvent.change(titleInput, { target: { value: 'Quantum Horizon' } });

    expect(screen.getByText('Quantum Horizon')).toBeDefined();
  });

  test('@spec REQ-HU-3.4-10: triggers export handler and invokes onExportComplete callback', async () => {
    // Arrange
    vi.useFakeTimers();
    const onExportComplete = vi.fn();
    render(<TypographyStampingCanvas {...defaultProps} onExportComplete={onExportComplete} />);

    // Act
    const exportBtn = screen.getByRole('button', { name: /Exportar Portada Final/i });
    fireEvent.click(exportBtn);

    // Shows rendering feedback
    expect(screen.getByText('Renderizando 3000px...')).toBeDefined();

    // Fast-forward 800ms export timeout
    await act(async () => {
      vi.advanceTimersByTime(900);
    });

    expect(onExportComplete).toHaveBeenCalledTimes(1);
    vi.useRealTimers();
  });
});
