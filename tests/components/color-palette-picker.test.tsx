/**
 * @file color-palette-picker.test.tsx
 * @layer Presentation Test
 * @description Component and contrast ratio unit tests for ColorPalettePicker.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import {
  ColorPalettePicker,
  getRelativeLuminance,
  getContrastRatio,
} from '../../apps/web/src/components/brand-vault/color-palette-picker';

describe('ColorPalettePicker Component', () => {
  test('calculates relative luminance and WCAG contrast correctly', () => {
    // Pure white luminance is 1.0, black is 0.0
    expect(getRelativeLuminance('#FFFFFF')).toBeCloseTo(1.0, 2);
    expect(getRelativeLuminance('#000000')).toBeCloseTo(0.0, 2);

    // Contrast between black and white is 21:1
    expect(getContrastRatio('#FFFFFF', '#000000')).toBe(21);
    // Contrast of color against itself is 1:1
    expect(getContrastRatio('#6366F1', '#6366F1')).toBe(1);
  });

  test('renders active color swatches and allows removing a swatch', () => {
    const onChange = vi.fn();
    const palette = ['#0F172A', '#38BDF8'];

    render(<ColorPalettePicker palette={palette} onChange={onChange} />);

    expect(screen.getByText('#0F172A')).toBeDefined();
    expect(screen.getByText('#38BDF8')).toBeDefined();

    const removeBtn = screen.getByLabelText('Eliminar color #0F172A');
    fireEvent.click(removeBtn);

    expect(onChange).toHaveBeenCalledWith(['#38BDF8']);
  });

  test('adds a valid new color to the palette', () => {
    const onChange = vi.fn();
    const palette = ['#0F172A'];

    render(<ColorPalettePicker palette={palette} onChange={onChange} />);

    const hexInput = screen.getByLabelText('Código hexadecimal de color');
    fireEvent.change(hexInput, { target: { value: '#F43F5E' } });

    const addBtn = screen.getByLabelText('Agregar color a la paleta');
    fireEvent.click(addBtn);

    expect(onChange).toHaveBeenCalledWith(['#0F172A', '#F43F5E']);
  });

  test('displays error when attempting to add duplicate or invalid color', () => {
    const onChange = vi.fn();
    const palette = ['#0F172A'];

    render(<ColorPalettePicker palette={palette} onChange={onChange} />);

    // Try adding duplicate
    const hexInput = screen.getByLabelText('Código hexadecimal de color');
    fireEvent.change(hexInput, { target: { value: '#0F172A' } });

    const addBtn = screen.getByLabelText('Agregar color a la paleta');
    fireEvent.click(addBtn);

    expect(screen.getByRole('alert').textContent).toContain('ya existe en la paleta');
    expect(onChange).not.toHaveBeenCalled();
  });
});
