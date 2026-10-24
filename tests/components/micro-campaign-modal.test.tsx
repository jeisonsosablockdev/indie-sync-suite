/**
 * @file micro-campaign-modal.test.tsx
 * @layer Presentation Test
 * @description UI component tests for MicroCampaignModal (HU-4.2 / SPEC-04-04).
 *              Verifies modal visibility, budget allocation preview, Guardrail Tier 2 confirmation requirement,
 *              and campaign activation triggers.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MicroCampaignModal } from '../../apps/web/src/components/distribution/micro-campaign-modal';

describe('Presentation: MicroCampaignModal (HU-4.2 / SPEC-04-04)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';

  test('does not render modal content when isOpen is false', () => {
    render(
      <MicroCampaignModal
        releaseId={releaseId}
        isOpen={false}
        onClose={vi.fn()}
      />
    );

    expect(screen.queryByTestId('micro-campaign-modal')).toBeNull();
  });

  test('renders modal, budget slider, and projections when isOpen is true', () => {
    render(
      <MicroCampaignModal
        releaseId={releaseId}
        isOpen={true}
        onClose={vi.fn()}
      />
    );

    expect(screen.getByTestId('micro-campaign-modal')).toBeDefined();
    expect(screen.getByText('Lanzar Microcampaña de Pauta ($20–$100 USD)')).toBeDefined();
    expect(screen.getAllByText('$30.00 USD').length).toBeGreaterThanOrEqual(1);
    expect(screen.getByText('Meta Ads (IG/FB)')).toBeDefined();
    expect(screen.getByText('TikTok Ads')).toBeDefined();
    expect(screen.getByText('Proyección de Rendimiento')).toBeDefined();
  });

  test('enforces Guardrail Tier 2 authorization checkbox before enabling launch button', async () => {
    const handleClose = vi.fn();
    const handleSuccess = vi.fn();

    render(
      <MicroCampaignModal
        releaseId={releaseId}
        isOpen={true}
        onClose={handleClose}
        onSuccess={handleSuccess}
      />
    );

    const submitBtn = screen.getByRole('button', { name: /Activar Pauta Programática/i }) as HTMLButtonElement;
    expect(submitBtn.disabled).toBe(true);

    // Provide required destination URL
    const destinationInput = screen.getByPlaceholderText('https://distrokid.com/hyperfollow/...') as HTMLInputElement;
    fireEvent.change(destinationInput, {
      target: { value: 'https://distrokid.com/hyperfollow/astra/track' },
    });

    // Still disabled without checking the Guardrail Tier 2 authorization
    expect(submitBtn.disabled).toBe(true);

    // Check Guardrail Tier 2 checkbox
    const guardrailCheckbox = screen.getByRole('checkbox') as HTMLInputElement;
    fireEvent.click(guardrailCheckbox);
    expect(guardrailCheckbox.checked).toBe(true);

    // Now enabled
    expect(submitBtn.disabled).toBe(false);

    // Click submit and wait for simulated async launch
    fireEvent.click(submitBtn);

    await waitFor(
      () => {
        expect(handleSuccess).toHaveBeenCalledTimes(1);
        expect(handleClose).toHaveBeenCalledTimes(1);
      },
      { timeout: 2000 }
    );
  });
});
