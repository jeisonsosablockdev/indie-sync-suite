/**
 * @file ad-efficiency-card.test.tsx
 * @layer Presentation Test
 * @description UI component tests for AdEfficiencyCard (HU-5.5 / SPEC-05-03).
 *              Verifies macro KPI displays, efficiency rating pill, and creative variants comparator.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen } from '@testing-library/react';
import { AdEfficiencyCard } from '../../apps/web/src/components/analytics/ad-efficiency-card';
import { CreativeVariantSpend } from '../../apps/web/src/lib/hooks/use-ad-efficiency';

describe('Presentation: AdEfficiencyCard (SPEC-05-03)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';

  const sampleVariants: CreativeVariantSpend[] = [
    {
      variantId: 'v-1',
      variantName: 'Anuncio Teaser 9:16 (TikTok)',
      totalSpendUsd: 30.0,
      conversions: 100,
      totalClicks: 400,
    },
    {
      variantId: 'v-2',
      variantName: 'Anuncio Portada 1:1 (Meta)',
      totalSpendUsd: 20.0,
      conversions: 20,
      totalClicks: 200,
    },
  ];

  test('renders card title, macro financial metrics and rating badge', () => {
    render(<AdEfficiencyCard releaseId={releaseId} initialVariants={sampleVariants} />);

    expect(screen.getByText('Eficiencia y Retorno de Pauta')).toBeDefined();
    expect(screen.getByText('Presupuesto Invertido')).toBeDefined();
    expect(screen.getByText('$50.00')).toBeDefined(); // 30 + 20
    expect(screen.getByText('CPA (Costo por Pre-save)')).toBeDefined();
    expect(screen.getByText('CPC (Costo por Clic)')).toBeDefined();
    expect(screen.getByText('Tasa de Conversión (CR)')).toBeDefined();

    expect(screen.getByText('Excelente Rentabilidad')).toBeDefined();
  });

  test('renders ranked creative variants and highlights top performer', () => {
    render(<AdEfficiencyCard releaseId={releaseId} initialVariants={sampleVariants} />);

    expect(screen.getByText('Comparador de Creativos Publicitarios')).toBeDefined();
    expect(screen.getByText('Anuncio Teaser 9:16 (TikTok)')).toBeDefined();
    expect(screen.getByText('Anuncio Portada 1:1 (Meta)')).toBeDefined();

    // v-1 is top performer (CPA $0.30 vs $1.00)
    expect(screen.getByTitle('Top Performer')).toBeDefined();
  });
});
