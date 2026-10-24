/**
 * @file batch-generation-grid.tsx
 * @layer Presentation
 * @description Responsive 4-variant exploration grid with rapid triage controls
 *              (Aprobar, Descartar, Regenerar). Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import { CheckCircle2, XCircle, RefreshCw, Eye, Sparkles } from 'lucide-react';
import {
  useBatchCuration,
  BatchVariantItem,
} from '../../lib/hooks/use-batch-curation';

export interface BatchGenerationGridProps {
  batchId?: string;
  initialVariants?: BatchVariantItem[];
  onApproveVariant?: (assetId: string) => void;
  onOpenStampingCanvas?: (variant: BatchVariantItem) => void;
}

/**
 * BatchGenerationGrid presentation component.
 */
export function BatchGenerationGrid({
  batchId,
  initialVariants,
  onApproveVariant,
  onOpenStampingCanvas,
}: BatchGenerationGridProps) {
  // Step 1: Bind application hook
  const {
    variants,
    selectedVariant,
    selectVariant,
    approveVariant,
    discardVariant,
    regenerateBatch,
    isTriageLoading,
  } = useBatchCuration({
    batchId,
    initialVariants,
    onAssetApproved: onApproveVariant,
  });

  return (
    <div
      className="space-y-6 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6"
      data-testid="batch-generation-grid"
    >
      {/* Header */}
      <div className="flex items-center justify-between pb-4 border-b border-zinc-100 dark:border-zinc-800">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100 flex items-center gap-2">
            <Sparkles className="w-4 h-4 text-indigo-500" />
            Exploración y Curaduría en Lote (4 Variantes)
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400">
            Revisa las propuestas visuales generadas en paralelo. Aprueba tu favorita para enviarla al repositorio central.
          </p>
        </div>
        <button
          type="button"
          onClick={() => regenerateBatch()}
          disabled={isTriageLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg bg-zinc-100 dark:bg-zinc-800 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-200 dark:hover:bg-zinc-700 transition-colors disabled:opacity-50"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isTriageLoading ? 'animate-spin' : ''}`} />
          Regenerar Lote
        </button>
      </div>

      {/* Step 2: 4-Variant Responsive Grid */}
      {variants.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-500 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          No hay variantes en este lote. Inicia una generación desde el Prompt Studio.
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {variants.map((variant) => {
            const isApproved = variant.status === 'APPROVED';
            const isDiscarded = variant.status === 'DISCARDED';

            return (
              <div
                key={variant.id}
                className={`group relative rounded-xl overflow-hidden border transition-all ${
                  isApproved
                    ? 'border-emerald-500 ring-2 ring-emerald-500/20'
                    : isDiscarded
                    ? 'border-zinc-200 dark:border-zinc-800 opacity-40'
                    : 'border-zinc-200 dark:border-zinc-800 hover:border-zinc-400 dark:hover:border-zinc-600'
                }`}
              >
                {/* Variant Image Preview */}
                <div className="aspect-square bg-zinc-100 dark:bg-zinc-800 relative flex items-center justify-center overflow-hidden">
                  {variant.previewUrl ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img
                      src={variant.previewUrl}
                      alt={`Variante ${variant.variantIndex + 1}`}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="text-zinc-400 text-xs font-mono">
                      Variante #{variant.variantIndex + 1}
                    </div>
                  )}

                  {/* Hash badge */}
                  <div className="absolute top-2 left-2 px-2 py-0.5 rounded-md bg-black/60 backdrop-blur-sm text-[10px] text-zinc-300 font-mono">
                    {variant.contentHash ? `${variant.contentHash.slice(0, 8)}...` : 'SHA-256'}
                  </div>
                </div>

                {/* Step 3: Triage Action Bar */}
                <div className="p-3 bg-white dark:bg-zinc-950 flex items-center justify-between gap-2 border-t border-zinc-100 dark:border-zinc-800">
                  <span className="text-[11px] font-semibold text-zinc-500">
                    V{variant.variantIndex + 1}
                  </span>

                  <div className="flex items-center gap-1.5">
                    <button
                      type="button"
                      title="Descartar"
                      disabled={isTriageLoading || isApproved}
                      onClick={() => discardVariant(variant.id)}
                      className="p-1.5 rounded-lg text-zinc-400 hover:text-rose-500 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition-colors disabled:opacity-40"
                    >
                      <XCircle className="w-4 h-4" />
                    </button>

                    {onOpenStampingCanvas && (
                      <button
                        type="button"
                        title="Maquetar Tipografía"
                        onClick={() => onOpenStampingCanvas(variant)}
                        className="p-1.5 rounded-lg text-zinc-400 hover:text-indigo-500 hover:bg-indigo-50 dark:hover:bg-indigo-950/40 transition-colors"
                      >
                        <Eye className="w-4 h-4" />
                      </button>
                    )}

                    <button
                      type="button"
                      title="Aprobar para Vault"
                      disabled={isTriageLoading || isApproved}
                      onClick={() => approveVariant(variant.id)}
                      className={`flex items-center gap-1 px-2.5 py-1 text-xs font-medium rounded-lg transition-colors ${
                        isApproved
                          ? 'bg-emerald-100 text-emerald-800 dark:bg-emerald-950/60 dark:text-emerald-300'
                          : 'bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800'
                      }`}
                    >
                      <CheckCircle2 className="w-3.5 h-3.5" />
                      {isApproved ? 'Aprobada' : 'Aprobar'}
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
