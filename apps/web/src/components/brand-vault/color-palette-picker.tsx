/**
 * @file color-palette-picker.tsx
 * @layer Presentation
 * @description Accessible HTML5 native color palette manager with live WCAG AA contrast ratio calculation.
 */

'use client';

import React, { useState } from 'react';
import { HexColorSchema } from '../../lib/pipelines/brand-vault/brand-schemas';

interface ColorPalettePickerProps {
  palette: string[];
  onChange: (palette: string[]) => void;
  maxColors?: number;
}

/**
 * Calculates relative luminance for an sRGB color per WCAG 2.1.
 *
 * @param hex - Hexadecimal color code
 * @returns Luminance value between 0 (black) and 1 (white)
 */
export function getRelativeLuminance(hex: string): number {
  let clean = hex.replace('#', '');
  if (clean.length === 3) {
    clean = clean.split('').map(c => c + c).join('');
  }
  const r = parseInt(clean.substring(0, 2), 16) / 255;
  const g = parseInt(clean.substring(2, 4), 16) / 255;
  const b = parseInt(clean.substring(4, 6), 16) / 255;

  const toLinear = (c: number) => (c <= 0.03928 ? c / 12.92 : Math.pow((c + 0.055) / 1.055, 2.4));

  return 0.2126 * toLinear(r) + 0.7152 * toLinear(g) + 0.0722 * toLinear(b);
}

/**
 * Calculates contrast ratio between two hex colors per WCAG 2.1.
 *
 * @param hex1 - First color
 * @param hex2 - Second color
 * @returns Contrast ratio formatted (e.g. "4.5:1")
 */
export function getContrastRatio(hex1: string, hex2: string): number {
  const l1 = getRelativeLuminance(hex1);
  const l2 = getRelativeLuminance(hex2);
  const lighter = Math.max(l1, l2);
  const darker = Math.min(l1, l2);
  return Number(((lighter + 0.05) / (darker + 0.05)).toFixed(2));
}

export function ColorPalettePicker({
  palette = [],
  onChange,
  maxColors = 6,
}: ColorPalettePickerProps) {
  const [currentColor, setCurrentColor] = useState('#6366F1');
  const [hexInput, setHexInput] = useState('#6366F1');
  const [error, setError] = useState<string | null>(null);

  const handleColorPick = (value: string) => {
    setCurrentColor(value.toUpperCase());
    setHexInput(value.toUpperCase());
    setError(null);
  };

  const handleHexInputChange = (value: string) => {
    setHexInput(value);
    const parsed = HexColorSchema.safeParse(value);
    if (parsed.success) {
      setCurrentColor(parsed.data);
      setError(null);
    }
  };

  const handleAddColor = () => {
    const parsed = HexColorSchema.safeParse(hexInput);
    if (!parsed.success) {
      setError('Formato inválido. Usa #RGB o #RRGGBB');
      return;
    }

    const color = parsed.data;
    if (palette.includes(color)) {
      setError('Este color ya existe en la paleta');
      return;
    }

    if (palette.length >= maxColors) {
      setError(`Máximo ${maxColors} colores permitidos`);
      return;
    }

    onChange([...palette, color]);
    setError(null);
  };

  const handleRemoveColor = (index: number) => {
    const updated = palette.filter((_, i) => i !== index);
    onChange(updated);
  };

  const whiteContrast = getContrastRatio(currentColor, '#FFFFFF');
  const blackContrast = getContrastRatio(currentColor, '#000000');
  const passesWcagWhite = whiteContrast >= 4.5;
  const passesWcagBlack = blackContrast >= 4.5;

  return (
    <div className="space-y-4" data-testid="color-palette-picker">
      <div className="flex items-center justify-between">
        <label className="text-sm font-medium text-zinc-900 dark:text-zinc-100">
          Paleta de Colores de Marca ({palette.length}/{maxColors})
        </label>
        <span className="text-xs text-zinc-500">Muestras activas</span>
      </div>

      {/* Swatches List */}
      <div className="flex flex-wrap gap-2.5 items-center">
        {palette.map((color, idx) => (
          <div
            key={`${color}-${idx}`}
            className="group relative flex items-center gap-2 pl-2 pr-1.5 py-1 rounded-md border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm"
          >
            <span
              className="w-4 h-4 rounded-full border border-black/10 dark:border-white/10 shrink-0"
              style={{ backgroundColor: color }}
              aria-hidden="true"
            />
            <span className="text-xs font-mono text-zinc-700 dark:text-zinc-300 font-medium">
              {color}
            </span>
            <button
              type="button"
              onClick={() => handleRemoveColor(idx)}
              className="text-zinc-400 hover:text-rose-500 transition p-0.5 rounded"
              aria-label={`Eliminar color ${color}`}
            >
              ×
            </button>
          </div>
        ))}
        {palette.length === 0 && (
          <p className="text-xs text-zinc-400 italic">No hay colores en la paleta aún.</p>
        )}
      </div>

      {/* Picker & Add Section */}
      {palette.length < maxColors && (
        <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3 pt-2">
          <div className="flex items-center gap-2">
            <input
              type="color"
              value={currentColor}
              onChange={e => handleColorPick(e.target.value)}
              className="w-9 h-9 p-0.5 rounded cursor-pointer border border-zinc-300 dark:border-zinc-700 bg-transparent"
              aria-label="Selector de color HTML5"
            />
            <input
              type="text"
              value={hexInput}
              onChange={e => handleHexInputChange(e.target.value)}
              placeholder="#6366F1"
              maxLength={7}
              className="w-28 px-2.5 py-1.5 text-xs font-mono rounded-md border border-zinc-300 dark:border-zinc-700 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 uppercase"
              aria-label="Código hexadecimal de color"
            />
          </div>

          <button
            type="button"
            onClick={handleAddColor}
            className="px-3 py-1.5 text-xs font-medium rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 transition"
            aria-label="Agregar color a la paleta"
          >
            + Añadir muestra
          </button>

          {/* WCAG Contrast Indicators */}
          <div className="flex items-center gap-2 text-xs text-zinc-500 font-mono">
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                passesWcagWhite ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'
              }`}
              title="Contraste contra blanco #FFFFFF"
            >
              Blanco: {whiteContrast}:1
            </span>
            <span
              className={`px-1.5 py-0.5 rounded text-[10px] ${
                passesWcagBlack ? 'bg-emerald-100 text-emerald-700 dark:bg-emerald-950/60 dark:text-emerald-400' : 'bg-zinc-100 text-zinc-600 dark:bg-zinc-800'
              }`}
              title="Contraste contra negro #000000"
            >
              Negro: {blackContrast}:1
            </span>
          </div>
        </div>
      )}

      {error && (
        <p className="text-xs text-rose-600 dark:text-rose-400 mt-1" role="alert">
          {error}
        </p>
      )}
    </div>
  );
}
