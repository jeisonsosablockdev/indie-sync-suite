/**
 * @file oauth-hub-card.test.tsx
 * @layer Presentation Test
 * @description UI component tests for OAuthHubCard (HU-4.3 / SPEC-04-01).
 *              Verifies platform card display, connection statuses, health badges, and connection actions.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { OAuthHubCard } from '../../apps/web/src/components/distribution/oauth-hub-card';
import { SocialConnection } from '../../apps/web/src/lib/pipelines/distribution/distribution-schemas';

describe('Presentation: OAuthHubCard (HU-4.3 / SPEC-04-01)', () => {
  const labelId = '11111111-1111-4111-8111-111111111111';

  const initialConnections: SocialConnection[] = [
    {
      id: 'conn-1',
      labelId,
      platform: 'INSTAGRAM',
      accountName: '@solaris_records',
      accountId: 'ig-123',
      healthStatus: 'CONNECTED',
    },
    {
      id: 'conn-2',
      labelId,
      platform: 'TIKTOK',
      accountName: '@solaris_music',
      accountId: 'tt-456',
      healthStatus: 'EXPIRED',
    },
  ];

  test('@spec REQ-HU-4.3-09: renders OAuth Hub card with all platforms and initial connections', () => {
    // Act
    render(<OAuthHubCard labelId={labelId} initialConnections={initialConnections} />);

    // Assert
    expect(screen.getByText('OAuth Hub & Cuentas Conectadas')).toBeDefined();
    expect(screen.getByText('Instagram')).toBeDefined();
    expect(screen.getByText('TikTok')).toBeDefined();
    expect(screen.getByText('X (Twitter)')).toBeDefined();
    expect(screen.getByText('YouTube')).toBeDefined();
    expect(screen.getByText('Facebook')).toBeDefined();
    expect(screen.getByText('Meta Ads Manager')).toBeDefined();
    expect(screen.getByText('TikTok Ads Manager')).toBeDefined();

    // Accounts
    expect(screen.getByText('@solaris_records')).toBeDefined();
    expect(screen.getByText('@solaris_music')).toBeDefined();

    // Health badges
    expect(screen.getByText('Conectada')).toBeDefined();
    expect(screen.getByText('Token Expirado')).toBeDefined();
  });

  test('@spec REQ-HU-4.3-10: triggers account disconnection when clicking Desconectar', () => {
    // Act
    render(<OAuthHubCard labelId={labelId} initialConnections={initialConnections} />);

    const disconnectBtn = screen.getByText('Desconectar');
    fireEvent.click(disconnectBtn);

    // Instagram account should no longer be connected
    expect(screen.queryByText('@solaris_records')).toBeNull();
  });

  test('@spec REQ-HU-4.3-11: triggers OAuth connect workflow when clicking Vincular Cuenta', async () => {
    // Act
    render(<OAuthHubCard labelId={labelId} initialConnections={initialConnections} />);

    // YouTube is disconnected, so has 'Vincular Cuenta'
    const linkButtons = screen.getAllByText('Vincular Cuenta');
    expect(linkButtons.length).toBeGreaterThan(0);

    await act(async () => {
      fireEvent.click(linkButtons[0]);
    });
  });
});
