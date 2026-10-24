/**
 * @file social-copy-drawer.test.tsx
 * @layer Presentation Test
 * @description Component tests for SocialCopyDrawer (HU-3.3 / SPEC-03-04).
 *              Verifies phase switching, platform switching, textarea editing, and clipboard action.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi, beforeEach } from 'vitest';
import { render, screen, fireEvent, act } from '@testing-library/react';
import { SocialCopyDrawer } from '../../apps/web/src/components/creative/social-copy-drawer';

describe('Presentation: SocialCopyDrawer (HU-3.3 / SPEC-03-04)', () => {
  const defaultProps = {
    releaseTitle: 'Solar Echoes',
    artistName: 'Hyperion',
    genre: 'Electronic Ambient',
    narrative: 'Deep ambient textures reflecting off distant celestial objects.',
    streamingLink: 'https://distrokid.com/hyperfollow/hyperion/solar-echoes',
  };

  beforeEach(() => {
    // Mock navigator.clipboard
    Object.assign(navigator, {
      clipboard: {
        writeText: vi.fn().mockImplementation(() => Promise.resolve()),
      },
    });
  });

  test('@spec REQ-HU-3.3-08: renders copywriting drawer with initial T-0 release phase and platform tabs', () => {
    // Act
    render(<SocialCopyDrawer {...defaultProps} />);

    // Assert
    expect(screen.getByText('Copys y Guiones por Fase de Lanzamiento')).toBeDefined();
    expect(screen.getByText('T-0')).toBeDefined();
    expect(screen.getByText('T-14')).toBeDefined();
    expect(screen.getByText('T-7')).toBeDefined();
    expect(screen.getByText('T+7')).toBeDefined();
    expect(screen.getByText('Instagram')).toBeDefined();
    expect(screen.getByText('X (Twitter)')).toBeDefined();
    expect(screen.getByText('Copiar Texto')).toBeDefined();
  });

  test('@spec REQ-HU-3.3-09: switches campaign phase and updates generated text', () => {
    // Act
    render(<SocialCopyDrawer {...defaultProps} />);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    expect(textarea.value).toContain('¡YA DISPONIBLE!');

    // Click T-14 phase button
    const tMinus14Btn = screen.getByText('T-14');
    fireEvent.click(tMinus14Btn);

    // Textarea should reflect T-14 copy
    expect(textarea.value).toContain('Próximamente');
    expect(textarea.value).toContain('dos semanas');
  });

  test('@spec REQ-HU-3.3-10: switches platform to Twitter/X and updates character counter', () => {
    // Act
    render(<SocialCopyDrawer {...defaultProps} />);

    const twitterBtn = screen.getByText('X (Twitter)');
    fireEvent.click(twitterBtn);

    // Should indicate Twitter limit of 280
    expect(screen.getByText(/\/ 280 caracteres/)).toBeDefined();
  });

  test('@spec REQ-HU-3.3-11: allows manual editing and shows alert when exceeding limit', () => {
    // Act
    render(<SocialCopyDrawer {...defaultProps} />);

    const twitterBtn = screen.getByText('X (Twitter)');
    fireEvent.click(twitterBtn);

    const textarea = screen.getByRole('textbox') as HTMLTextAreaElement;
    fireEvent.change(textarea, { target: { value: 'A'.repeat(300) } });

    expect(screen.getByText(/Excede el límite en 20/)).toBeDefined();
  });

  test('@spec REQ-HU-3.3-12: copies text to clipboard on button click', async () => {
    // Act
    render(<SocialCopyDrawer {...defaultProps} />);

    const copyBtn = screen.getByRole('button', { name: /Copiar Texto/i });
    await act(async () => {
      fireEvent.click(copyBtn);
    });

    expect(navigator.clipboard.writeText).toHaveBeenCalledTimes(1);
    expect(screen.getByText('¡Copiado!')).toBeDefined();
  });
});
