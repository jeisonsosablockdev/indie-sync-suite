/**
 * @file prompt-studio-panel.tsx
 * @layer Presentation
 * @description Interactive Master Prompt studio with modular breakdown controls,
 *              platform preset switching (Midjourney, Flux, Runway, Raw), and 1-click copying. Pure React UI.
 */

'use client';

import React from 'react';
import { Copy, Check, Sparkles, SlidersHorizontal, RefreshCw } from 'lucide-react';
import {
  usePromptStudio,
  PlatformPreset,
} from '../../lib/hooks/use-prompt-studio';

export interface PromptStudioPanelProps {
  releaseId: string;
  onGenerateBatch?: (promptText: string) => void;
}

const PRESET_LABELS: Record<PlatformPreset, string> = {
  MIDJOURNEY_V6: 'Midjourney v6',
  FLUX_SD: 'Flux.1 / SD',
  RUNWAY_KLING: 'Runway / Kling',
  RAW_TEXT: 'Texto Plano',
};

/**
 * PromptStudioPanel presentation component.
 */
export function PromptStudioPanel({
  releaseId,
  onGenerateBatch,
}: PromptStudioPanelProps) {
  // Step 1: Bind application hook
  const {
    breakdown,
    updateBreakdownField,
    rawPromptText,
    setRawPromptText,
    negativePrompt,
    setNegativePrompt,
    platformPreset,
    setPlatformPreset,
    formattedOutput,
    isCopied,
    copyToClipboard,
    resetToBrandContext,
  } = usePromptStudio({ releaseId });

  return (
    <div
      className="space-y-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      data-testid="prompt-studio-panel"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-amber-500" />
            Prompt Studio & Text-Only Workflow
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Ajusta los parámetros visuales anclados a la identidad de marca o copia el prompt listo para Midjourney / Flux.
          </p>
        </div>
        <button
          type="button"
          onClick={resetToBrandContext}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors"
        >
          <RefreshCw className="w-3.5 h-3.5" />
          Restablecer
        </button>
      </div>

      {/* Step 2: Modular Breakdown Controls */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Sujeto Visual Central
          </label>
          <textarea
            rows={2}
            value={breakdown.subject}
            onChange={(e) => updateBreakdownField('subject', e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Estilo Artístico y Estética
          </label>
          <textarea
            rows={2}
            value={breakdown.style}
            onChange={(e) => updateBreakdownField('style', e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Iluminación y Atmósfera
          </label>
          <input
            type="text"
            value={breakdown.lighting}
            onChange={(e) => updateBreakdownField('lighting', e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>

        <div className="space-y-1.5">
          <label className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Cámara y Composición Óptica
          </label>
          <input
            type="text"
            value={breakdown.camera}
            onChange={(e) => updateBreakdownField('camera', e.target.value)}
            className="w-full text-xs p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
          />
        </div>
      </div>

      {/* Step 3: Platform Preset Tabs */}
      <div className="space-y-3 pt-2">
        <div className="flex items-center justify-between">
          <span className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Preset de Plataforma
          </span>
          <div className="flex items-center gap-1.5 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            {(Object.keys(PRESET_LABELS) as PlatformPreset[]).map((preset) => (
              <button
                key={preset}
                type="button"
                onClick={() => setPlatformPreset(preset)}
                className={`px-2.5 py-1 text-xs rounded-md font-medium transition-colors ${
                  platformPreset === preset
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {PRESET_LABELS[preset]}
              </button>
            ))}
          </div>
        </div>

        {/* Step 4: Compiled Output Code Block */}
        <div className="relative rounded-xl bg-zinc-950 p-4 text-zinc-100 font-mono text-xs border border-zinc-800">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-zinc-800 text-zinc-400 text-[11px]">
            <span>Tokens estimados: ~{formattedOutput.estimatedTokens}</span>
            <span className="text-amber-400">{platformPreset}</span>
          </div>
          <p className="whitespace-pre-wrap break-words leading-relaxed select-all">
            {formattedOutput.compiledText}
          </p>

          <div className="flex items-center justify-end gap-2 mt-4 pt-3 border-t border-zinc-800">
            <button
              type="button"
              onClick={copyToClipboard}
              className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-800 hover:bg-zinc-700 text-zinc-100 transition-colors"
            >
              {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
              {isCopied ? '¡Copiado!' : 'Copiar 1-Clic'}
            </button>
            {onGenerateBatch && (
              <button
                type="button"
                onClick={() => onGenerateBatch(formattedOutput.compiledText)}
                className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white transition-colors"
              >
                <SlidersHorizontal className="w-3.5 h-3.5" />
                Generar Variantes
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
