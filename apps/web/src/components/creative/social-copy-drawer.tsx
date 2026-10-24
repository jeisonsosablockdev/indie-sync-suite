/**
 * @file social-copy-drawer.tsx
 * @layer Presentation
 * @description Interactive copywriting drawer generating phase-tailored promotional copy
 *              (T-14, T-7, T-0, T+7) with live character counter and platform limits. Pure React UI.
 */

'use client';

import React from 'react';
import { Copy, Check, MessageSquare, RotateCcw, AlertCircle } from 'lucide-react';
import {
  useSocialCopy,
  CampaignPhase,
  SocialPlatform,
} from '../../lib/hooks/use-social-copy';

export interface SocialCopyDrawerProps {
  releaseTitle: string;
  artistName: string;
  genre: string;
  narrative: string;
  streamingLink?: string;
}

const PHASE_LABELS: Record<CampaignPhase, { title: string; badge: string }> = {
  T_MINUS_14: { title: 'Pre-Save & Expectativa', badge: 'T-14' },
  T_MINUS_7: { title: 'Snippet & Conteo', badge: 'T-7' },
  T_ZERO: { title: 'Día de Estreno (¡Ya Disponible!)', badge: 'T-0' },
  T_PLUS_7: { title: 'Agradecimiento & Hitos', badge: 'T+7' },
};

const PLATFORM_LABELS: Record<SocialPlatform, string> = {
  INSTAGRAM: 'Instagram',
  TWITTER_X: 'X (Twitter)',
  TIKTOK: 'TikTok',
  NEWSLETTER: 'Newsletter / Prensa',
};

/**
 * SocialCopyDrawer presentation component.
 */
export function SocialCopyDrawer({
  releaseTitle,
  artistName,
  genre,
  narrative,
  streamingLink,
}: SocialCopyDrawerProps) {
  // Step 1: Bind application hook
  const {
    phase,
    setPhase,
    platform,
    setPlatform,
    copyResult,
    customText,
    setCustomText,
    metrics,
    isCopied,
    copyToClipboard,
    resetToTemplate,
  } = useSocialCopy({
    releaseTitle,
    artistName,
    genre,
    narrative,
    streamingLink,
  });

  return (
    <div
      className="space-y-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      data-testid="social-copy-drawer"
    >
      {/* Step 2: Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <MessageSquare className="w-4 h-4 text-emerald-500" />
            Copys y Guiones por Fase de Lanzamiento
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Textos de campaña sin clichés anclados a la narrativa lírica y adaptados a cada plataforma.
          </p>
        </div>
        <button
          type="button"
          onClick={resetToTemplate}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white border border-zinc-200 dark:border-zinc-700 rounded-lg transition-colors"
        >
          <RotateCcw className="w-3.5 h-3.5" />
          Restablecer Plantilla
        </button>
      </div>

      {/* Step 3: Launch Phase Selector */}
      <div className="space-y-2">
        <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
          Fase de Campaña
        </label>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2">
          {(Object.keys(PHASE_LABELS) as CampaignPhase[]).map((p) => {
            const isSelected = phase === p;
            return (
              <button
                key={p}
                type="button"
                onClick={() => setPhase(p)}
                className={`p-2.5 text-left rounded-xl border transition-all ${
                  isSelected
                    ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/30 ring-1 ring-indigo-500'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-300 dark:hover:border-zinc-700'
                }`}
              >
                <span className="inline-block px-1.5 py-0.5 rounded text-[10px] font-bold bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 mb-1">
                  {PHASE_LABELS[p].badge}
                </span>
                <p className="text-xs font-medium text-zinc-800 dark:text-zinc-200 truncate">
                  {PHASE_LABELS[p].title}
                </p>
              </button>
            );
          })}
        </div>
      </div>

      {/* Step 4: Social Platform Tabs */}
      <div className="space-y-2">
        <div className="flex items-center justify-between">
          <label className="text-xs font-semibold uppercase tracking-wider text-zinc-500">
            Red Social / Destino
          </label>
          <div className="flex gap-1 bg-zinc-100 dark:bg-zinc-800 p-1 rounded-lg">
            {(Object.keys(PLATFORM_LABELS) as SocialPlatform[]).map((plt) => (
              <button
                key={plt}
                type="button"
                onClick={() => setPlatform(plt)}
                className={`px-3 py-1 text-xs rounded-md font-medium transition-colors ${
                  platform === plt
                    ? 'bg-white dark:bg-zinc-700 text-zinc-900 dark:text-zinc-100 shadow-sm'
                    : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-white'
                }`}
              >
                {PLATFORM_LABELS[plt]}
              </button>
            ))}
          </div>
        </div>

        {/* Text Area */}
        <textarea
          rows={6}
          value={customText}
          onChange={(e) => setCustomText(e.target.value)}
          className="w-full text-xs p-3 rounded-xl border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500 font-sans leading-relaxed"
        />

        {/* Live Metrics & Copy Button */}
        <div className="flex items-center justify-between pt-2">
          <div className="flex items-center gap-2 text-xs">
            <span
              className={`font-mono font-medium ${
                metrics.valid ? 'text-zinc-500' : 'text-rose-600 dark:text-rose-400 font-bold'
              }`}
            >
              {metrics.characterCount} / {metrics.maxAllowed} caracteres
            </span>
            {!metrics.valid && (
              <span className="flex items-center gap-1 text-rose-600 dark:text-rose-400 text-xs">
                <AlertCircle className="w-3.5 h-3.5" />
                Excede el límite en {Math.abs(metrics.remaining)}
              </span>
            )}
          </div>

          <button
            type="button"
            onClick={copyToClipboard}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-medium rounded-lg bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 transition-colors shadow-sm"
          >
            {isCopied ? <Check className="w-3.5 h-3.5 text-emerald-400" /> : <Copy className="w-3.5 h-3.5" />}
            {isCopied ? '¡Copiado!' : 'Copiar Texto'}
          </button>
        </div>
      </div>
    </div>
  );
}
