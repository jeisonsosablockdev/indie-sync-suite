/**
 * @file ad-efficiency-card.tsx
 * @layer Presentation
 * @description Financial and marketing card component presenting CPA, CPC, conversion rate,
 *              and creative variant comparisons with "Top Performer" status. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import {
  DollarSign,
  MousePointerClick,
  Percent,
  Award,
  TrendingDown,
  Sparkles,
} from 'lucide-react';
import {
  useAdEfficiency,
  CreativeVariantSpend,
  EfficiencyRating,
} from '../../lib/hooks/use-ad-efficiency';

export interface AdEfficiencyCardProps {
  releaseId: string;
  initialVariants?: CreativeVariantSpend[];
  className?: string;
}

const RATING_CONFIG: Record<
  EfficiencyRating,
  { label: string; bg: string; text: string; border: string }
> = {
  EXCELLENT: {
    label: 'Excelente Rentabilidad',
    bg: 'bg-emerald-500/10',
    text: 'text-emerald-500',
    border: 'border-emerald-500/30',
  },
  HEALTHY: {
    label: 'Rendimiento Saludable',
    bg: 'bg-blue-500/10',
    text: 'text-blue-500',
    border: 'border-blue-500/30',
  },
  NEEDS_OPTIMIZATION: {
    label: 'Requiere Optimización',
    bg: 'bg-amber-500/10',
    text: 'text-amber-500',
    border: 'border-amber-500/30',
  },
};

/**
 * AdEfficiencyCard presentation component.
 *
 * @param props - Component props including releaseId and optional initial variants
 * @returns JSX Element rendering financial ad efficiency metrics
 */
export function AdEfficiencyCard({
  releaseId,
  initialVariants = [],
  className = '',
}: AdEfficiencyCardProps): React.JSX.Element {
  // Step 1: Bind application hook
  const {
    rankedVariants,
    globalMetrics,
    topPerformer,
  } = useAdEfficiency({ releaseId, initialVariants });

  const ratingStyle = RATING_CONFIG[globalMetrics.efficiencyRating];

  return (
    <div className={`p-5 rounded-xl border border-border/50 bg-card/40 space-y-5 ${className}`}>
      {/* Step 2: Card Header with Efficiency Badge */}
      <div className="flex items-center justify-between border-b border-border/40 pb-3">
        <div>
          <h3 className="text-base font-bold text-foreground flex items-center gap-2">
            <DollarSign className="h-5 w-5 text-emerald-500" />
            Eficiencia y Retorno de Pauta
          </h3>
          <p className="text-xs text-muted-foreground">
            Inversión publicitaria en microcampañas ($20–$100 USD) vs conversiones de pre-save
          </p>
        </div>

        <div
          className={`px-2.5 py-1 rounded-full text-xs font-semibold border flex items-center gap-1.5 ${ratingStyle.bg} ${ratingStyle.text} ${ratingStyle.border}`}
        >
          <Sparkles className="h-3.5 w-3.5" />
          <span>{ratingStyle.label}</span>
        </div>
      </div>

      {/* Step 3: Macro Financial Metrics Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
        {/* Total Spend */}
        <div className="p-3 rounded-lg border border-border/40 bg-background/50">
          <span className="text-xs text-muted-foreground">Presupuesto Invertido</span>
          <p className="text-xl font-black text-foreground mt-1">
            ${globalMetrics.totalSpendUsd.toFixed(2)}
          </p>
          <span className="text-[10px] text-muted-foreground">USD en anuncios pagados</span>
        </div>

        {/* CPA */}
        <div className="p-3 rounded-lg border border-border/40 bg-background/50">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <TrendingDown className="h-3 w-3 text-emerald-500" />
            CPA (Costo por Pre-save)
          </span>
          <p className="text-xl font-black text-foreground mt-1">
            ${globalMetrics.cpa.toFixed(2)}
          </p>
          <span className="text-[10px] text-muted-foreground">{globalMetrics.conversions} pre-saves totales</span>
        </div>

        {/* CPC */}
        <div className="p-3 rounded-lg border border-border/40 bg-background/50">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <MousePointerClick className="h-3 w-3 text-blue-500" />
            CPC (Costo por Clic)
          </span>
          <p className="text-xl font-black text-foreground mt-1">
            ${globalMetrics.cpc.toFixed(2)}
          </p>
          <span className="text-[10px] text-muted-foreground">{globalMetrics.totalClicks} clics generados</span>
        </div>

        {/* Conversion Rate */}
        <div className="p-3 rounded-lg border border-border/40 bg-background/50">
          <span className="text-xs text-muted-foreground flex items-center gap-1">
            <Percent className="h-3 w-3 text-purple-500" />
            Tasa de Conversión (CR)
          </span>
          <p className="text-xl font-black text-foreground mt-1">
            {globalMetrics.conversionRatePct.toFixed(1)}%
          </p>
          <span className="text-[10px] text-muted-foreground">Pre-saves / Clics</span>
        </div>
      </div>

      {/* Step 4: Creative Variants Ranking List */}
      {rankedVariants.length > 0 && (
        <div className="space-y-2">
          <h4 className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">
            Comparador de Creativos Publicitarios
          </h4>
          <div className="space-y-2">
            {rankedVariants.map((variant) => (
              <div
                key={variant.variantId}
                className={`p-3 rounded-lg border flex items-center justify-between text-xs transition-colors ${
                  variant.isTopPerformer
                    ? 'border-emerald-500/40 bg-emerald-500/5'
                    : 'border-border/40 bg-background/30'
                }`}
              >
                <div className="flex items-center gap-2.5">
                  {variant.isTopPerformer && (
                    <span className="p-1 rounded-full bg-emerald-500 text-white shadow-xs" title="Top Performer">
                      <Award className="h-3.5 w-3.5" />
                    </span>
                  )}
                  <div>
                    <span className="font-semibold text-foreground">{variant.variantName}</span>
                    <p className="text-[10px] text-muted-foreground">
                      Gasto: ${variant.totalSpendUsd.toFixed(2)} | Clics: {variant.totalClicks} | Conversiones: {variant.conversions}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-4 text-right">
                  <div>
                    <span className="font-mono font-bold text-foreground">
                      ${variant.cpa.toFixed(2)}
                    </span>
                    <p className="text-[10px] text-muted-foreground">CPA</p>
                  </div>
                  <div>
                    <span className="font-mono font-bold text-foreground">
                      {variant.conversionRatePct.toFixed(1)}%
                    </span>
                    <p className="text-[10px] text-muted-foreground">CR %</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
