/**
 * @file micro-campaign-modal.tsx
 * @layer Presentation
 * @description Configuration wizard modal for programmatic micro-ad campaigns ($20–$100 USD)
 *              with budget split preview and explicit Guardrail confirmation. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React, { useState } from 'react';
import { DollarSign, ShieldAlert, Sparkles, Check, ArrowRight, X } from 'lucide-react';
import {
  useMicroCampaign,
  AdPlatform,
} from '../../lib/hooks/use-micro-campaign';

export interface MicroCampaignModalProps {
  releaseId: string;
  isOpen: boolean;
  onClose: () => void;
  onSuccess?: () => void;
}

/**
 * MicroCampaignModal presentation component.
 */
export function MicroCampaignModal({
  releaseId,
  isOpen,
  onClose,
  onSuccess,
}: MicroCampaignModalProps) {
  // Step 1: Bind application hook
  const {
    budgetUsd,
    setBudgetUsd,
    selectedPlatforms,
    togglePlatform,
    destinationUrl,
    setDestinationUrl,
    targetAudience,
    setTargetAudience,
    durationDays,
    setDurationDays,
    allocation,
    isValid,
    isSubmitting,
    launchCampaign,
  } = useMicroCampaign({ releaseId });

  const [hasConfirmedGuardrail, setHasConfirmedGuardrail] = useState(false);

  if (!isOpen) return null;

  const handleSubmit = async () => {
    if (!hasConfirmedGuardrail) return;
    const ok = await launchCampaign();
    if (ok) {
      onSuccess?.();
      onClose();
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm"
      data-testid="micro-campaign-modal"
    >
      <div className="w-full max-w-lg rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6 space-y-6 shadow-2xl">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div className="flex items-center gap-2.5">
            <span className="p-2 rounded-xl bg-amber-50 dark:bg-amber-950/60 text-amber-600 dark:text-amber-400">
              <DollarSign className="w-5 h-5" />
            </span>
            <div>
              <h3 className="text-base font-bold text-zinc-900 dark:text-zinc-100">
                Lanzar Microcampaña de Pauta ($20–$100 USD)
              </h3>
              <p className="text-xs text-zinc-500 dark:text-zinc-400">
                Campañas hipersegmentadas de descubrimiento para el lanzamiento musical.
              </p>
            </div>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Form Fields */}
        <div className="space-y-4 text-xs">
          {/* Budget Slider */}
          <div className="space-y-1.5">
            <div className="flex justify-between font-semibold">
              <label className="text-zinc-700 dark:text-zinc-300">Presupuesto Total (USD)</label>
              <span className="text-indigo-600 font-bold">${budgetUsd.toFixed(2)} USD</span>
            </div>
            <input
              type="range"
              min={20}
              max={100}
              step={5}
              value={budgetUsd}
              onChange={(e) => setBudgetUsd(Number(e.target.value))}
              className="w-full accent-indigo-600 cursor-pointer"
            />
            <div className="flex justify-between text-[10px] text-zinc-400">
              <span>Mínimo: $20 USD</span>
              <span>Máximo: $100 USD</span>
            </div>
          </div>

          {/* Platform Pills */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              Plataformas Publicitarias
            </label>
            <div className="flex gap-2">
              {(['META_ADS', 'TIKTOK_ADS'] as AdPlatform[]).map((plt) => {
                const isSelected = selectedPlatforms.includes(plt);
                return (
                  <button
                    key={plt}
                    type="button"
                    onClick={() => togglePlatform(plt)}
                    className={`flex items-center gap-1.5 px-3 py-2 rounded-xl border text-xs font-medium transition-all ${
                      isSelected
                        ? 'border-indigo-500 bg-indigo-50/50 dark:bg-indigo-950/40 text-indigo-700 dark:text-indigo-300 ring-1 ring-indigo-500'
                        : 'border-zinc-200 dark:border-zinc-800 text-zinc-600 dark:text-zinc-400 hover:border-zinc-300'
                    }`}
                  >
                    {isSelected && <Check className="w-3.5 h-3.5" />}
                    {plt === 'META_ADS' ? 'Meta Ads (IG/FB)' : 'TikTok Ads'}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Destination URL */}
          <div className="space-y-1.5">
            <label className="font-semibold text-zinc-700 dark:text-zinc-300">
              Enlace de Destino (Pre-Save / SmartLink)
            </label>
            <input
              type="url"
              placeholder="https://distrokid.com/hyperfollow/..."
              value={destinationUrl}
              onChange={(e) => setDestinationUrl(e.target.value)}
              className="w-full p-2.5 rounded-lg border border-zinc-200 dark:border-zinc-700 bg-zinc-50 dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-1 focus:ring-indigo-500"
            />
          </div>

          {/* Budget Allocation Summary */}
          {allocation && (
            <div className="rounded-xl p-3 bg-zinc-50 dark:bg-zinc-900 border border-zinc-100 dark:border-zinc-800 space-y-2">
              <span className="text-[11px] font-bold uppercase text-zinc-400">
                Proyección de Rendimiento
              </span>
              <div className="grid grid-cols-2 gap-2 text-zinc-700 dark:text-zinc-300">
                {allocation.allocations.map((a) => (
                  <div key={a.platform} className="p-2 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200/50 dark:border-zinc-700">
                    <p className="font-bold text-[10px] text-zinc-400">{a.platform}</p>
                    <p className="text-xs font-semibold text-zinc-900 dark:text-zinc-100">
                      ${a.budgetUsd.toFixed(2)} USD
                    </p>
                    <p className="text-[10px] text-zinc-500">
                      ~{a.estimatedImpressions.min.toLocaleString()} impresiones
                    </p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Tier 2 Guardrail Confirmation Checkbox */}
          <div className="p-3 rounded-xl bg-amber-50 dark:bg-amber-950/40 border border-amber-200 dark:border-amber-800 flex items-start gap-2.5">
            <ShieldAlert className="w-4 h-4 text-amber-600 dark:text-amber-400 flex-shrink-0 mt-0.5" />
            <div className="space-y-1">
              <p className="text-[11px] font-semibold text-amber-900 dark:text-amber-200">
                Guardrail Tier 2: Autorización de Fondos Reales
              </p>
              <label className="flex items-center gap-2 cursor-pointer text-[11px] text-amber-800 dark:text-amber-300">
                <input
                  type="checkbox"
                  checked={hasConfirmedGuardrail}
                  onChange={(e) => setHasConfirmedGuardrail(e.target.checked)}
                  className="rounded text-amber-600 focus:ring-amber-500"
                />
                Autorizo cargar ${budgetUsd.toFixed(2)} USD a la cuenta publicitaria conectada.
              </label>
            </div>
          </div>
        </div>

        {/* Actions */}
        <div className="flex items-center justify-end gap-2 pt-2 border-t border-zinc-100 dark:border-zinc-800">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 text-xs font-medium text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 transition-colors"
          >
            Cancelar
          </button>
          <button
            type="button"
            disabled={!isValid || !hasConfirmedGuardrail || isSubmitting}
            onClick={handleSubmit}
            className="flex items-center gap-1.5 px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 text-white hover:bg-indigo-500 transition-colors disabled:opacity-50 shadow-sm"
          >
            {isSubmitting ? 'Activando...' : 'Activar Pauta Programática'}
            <ArrowRight className="w-3.5 h-3.5" />
          </button>
        </div>
      </div>
    </div>
  );
}
