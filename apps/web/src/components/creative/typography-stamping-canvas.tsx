/**
 * @file typography-stamping-canvas.tsx
 * @layer Presentation
 * @description Interactive typography stamping layout editor overlaying song title and artist
 *              with style presets and 3000×3000 px export preview. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import { Type, Download, Sliders, Check } from 'lucide-react';
import {
  useTypographyStamping,
  CompositionStyle,
} from '../../lib/hooks/use-typography-stamping';

export interface TypographyStampingCanvasProps {
  initialTitle: string;
  initialArtist: string;
  baseImageUrl?: string;
  onExportComplete?: () => void;
}

const STYLE_PRESETS: { id: CompositionStyle; label: string; desc: string }[] = [
  { id: 'MINIMALIST', label: 'Minimalista', desc: 'Sans-serif pulido alineado al borde inferior' },
  { id: 'EDITORIAL', label: 'Editorial', desc: 'Serif elegante centrado con interletrado generoso' },
  { id: 'BOLD_IMPACT', label: 'Bold Impact', desc: 'Titular dinámico de alto contraste' },
  { id: 'VINTAGE_VINYL', label: 'Vintage Vinyl', desc: 'Monospace clásico superior/inferior' },
];

/**
 * TypographyStampingCanvas presentation component.
 */
export function TypographyStampingCanvas({
  initialTitle,
  initialArtist,
  baseImageUrl,
  onExportComplete,
}: TypographyStampingCanvasProps) {
  // Step 1: Bind application hook
  const {
    titleText,
    setTitleText,
    artistText,
    setArtistText,
    compositionStyle,
    setCompositionStyle,
    layoutSpec,
    isExporting,
    exportCoverArt,
  } = useTypographyStamping({
    initialTitle,
    initialArtist,
    baseImageUrl,
  });

  const handleExport = async () => {
    await exportCoverArt();
    onExportComplete?.();
  };

  return (
    <div
      className="space-y-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      data-testid="typography-stamping-canvas"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Type className="w-4 h-4 text-purple-500" />
            Maquetación Tipográfica Vectorial (3000×3000 px)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Sobrepón el título y artista con precisión milimétrica cumpliendo los estándares de carátula para DSPs.
          </p>
        </div>
        <button
          type="button"
          onClick={handleExport}
          disabled={isExporting}
          className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors shadow-sm disabled:opacity-50"
        >
          <Download className="w-3.5 h-3.5" />
          {isExporting ? 'Renderizando 3000px...' : 'Exportar Portada Final'}
        </button>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Step 2: Interactive Controls Column */}
        <div className="lg:col-span-5 space-y-4">
          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Título del Release
            </label>
            <input
              type="text"
              value={titleText}
              onChange={(e) => setTitleText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
              Nombre del Artista
            </label>
            <input
              type="text"
              value={artistText}
              onChange={(e) => setArtistText(e.target.value)}
              className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Preset Selection Cards */}
          <div className="space-y-2 pt-2">
            <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
              Estilo de Maquetación
            </label>
            <div className="space-y-2">
              {STYLE_PRESETS.map((preset) => {
                const isSelected = compositionStyle === preset.id;
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => setCompositionStyle(preset.id)}
                    className={`w-full p-3 text-left rounded-xl border transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/40 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                        : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300'
                    }`}
                  >
                    <div className="flex items-center justify-between">
                      <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                        {preset.label}
                      </span>
                      {isSelected && <Check className="w-3.5 h-3.5 text-indigo-600 dark:text-indigo-400" />}
                    </div>
                    <p className="text-[11px] text-zinc-500 dark:text-zinc-400 mt-0.5">
                      {preset.desc}
                    </p>
                  </button>
                );
              })}
            </div>
          </div>
        </div>

        {/* Step 3: Interactive Visual Canvas Preview */}
        <div className="lg:col-span-7 flex flex-col items-center justify-center">
          <div className="relative w-full max-w-[420px] aspect-square rounded-2xl overflow-hidden shadow-2xl bg-zinc-950 border border-zinc-800 flex items-center justify-center">
            {baseImageUrl ? (
              // eslint-disable-next-line @next/next/no-img-element
              <img src={baseImageUrl} alt="Base" className="w-full h-full object-cover" />
            ) : (
              <div className="absolute inset-0 bg-gradient-to-br from-zinc-900 via-zinc-950 to-zinc-900 flex items-center justify-center">
                <span className="text-zinc-700 font-mono text-xs">Capa Base de Imagen (1:1)</span>
              </div>
            )}

            {/* Title Overlay Text */}
            <div
              className="absolute pointer-events-none select-none transition-all"
              style={{
                top: `${(layoutSpec.titlePlacement.y / layoutSpec.canvasHeight) * 100}%`,
                left: `${(layoutSpec.titlePlacement.x / layoutSpec.canvasWidth) * 100}%`,
                transform:
                  layoutSpec.titlePlacement.alignment === 'center'
                    ? 'translate(-50%, -50%)'
                    : 'translate(0, -50%)',
                color: layoutSpec.titlePlacement.color,
                fontFamily: layoutSpec.titlePlacement.fontFamily,
                fontWeight: layoutSpec.titlePlacement.fontWeight,
                letterSpacing: `${layoutSpec.titlePlacement.letterSpacing}px`,
                fontSize: `${Math.round((layoutSpec.titlePlacement.fontSize / 3000) * 420)}px`,
              }}
            >
              {layoutSpec.titlePlacement.text}
            </div>

            {/* Artist Overlay Text */}
            <div
              className="absolute pointer-events-none select-none transition-all"
              style={{
                top: `${(layoutSpec.artistPlacement.y / layoutSpec.canvasHeight) * 100}%`,
                left: `${(layoutSpec.artistPlacement.x / layoutSpec.canvasWidth) * 100}%`,
                transform:
                  layoutSpec.artistPlacement.alignment === 'center'
                    ? 'translate(-50%, -50%)'
                    : 'translate(0, -50%)',
                color: layoutSpec.artistPlacement.color,
                fontFamily: layoutSpec.artistPlacement.fontFamily,
                fontWeight: layoutSpec.artistPlacement.fontWeight,
                letterSpacing: `${layoutSpec.artistPlacement.letterSpacing}px`,
                fontSize: `${Math.round((layoutSpec.artistPlacement.fontSize / 3000) * 420)}px`,
              }}
            >
              {layoutSpec.artistPlacement.text}
            </div>
          </div>
          <p className="text-[11px] text-zinc-500 mt-2 font-mono">
            Previsualización proporcional calculada a 3000×3000 px
          </p>
        </div>
      </div>
    </div>
  );
}
