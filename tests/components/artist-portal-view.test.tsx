/**
 * @file artist-portal-view.test.tsx
 * @layer Presentation Test
 * @description UI component tests for ArtistPortalView (HU-6.5 / SPEC-06-01).
 *              Verifies mobile layout, master audio player preview, deliverable review cards,
 *              and 1-tap approval/adjustments.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArtistPortalView } from '../../apps/web/src/components/portal/artist-portal-view';

describe('Presentation: ArtistPortalView (SPEC-06-01)', () => {
  test('renders error card when token is empty or invalid', () => {
    render(<ArtistPortalView token="" />);

    expect(screen.getByText('Enlace Expirado o Inválido')).toBeDefined();
    expect(
      screen.getByText(
        'Este Magic Link ha expirado o ha sido revocado. Contacta a tu Label Manager para solicitar un nuevo acceso.'
      )
    ).toBeDefined();
  });

  test('renders portal header, artist metadata, and master audio player with valid token', async () => {
    render(<ArtistPortalView token="valid.test.token" />);

    expect(screen.getByText('Portal del Artista')).toBeDefined();

    await waitFor(() => {
      expect(screen.getByText('Ecos de Medianoche')).toBeDefined();
      expect(screen.getByText('Revisión para Luna Violet')).toBeDefined();
      expect(screen.getByText('Audio Master Oficial')).toBeDefined();
    });
  });

  test('toggles audio master playback state', async () => {
    render(<ArtistPortalView token="valid.test.token" />);

    await waitFor(() => {
      expect(screen.getByTitle('Reproducir')).toBeDefined();
    });

    const playBtn = screen.getByTitle('Reproducir');
    fireEvent.click(playBtn);

    expect(screen.getByTitle('Pausar')).toBeDefined();
    expect(screen.getByText('Reproduciendo audio del máster...')).toBeDefined();

    const pauseBtn = screen.getByTitle('Pausar');
    fireEvent.click(pauseBtn);

    expect(screen.getByTitle('Reproducir')).toBeDefined();
  });

  test('approves deliverable with 1-tap action', async () => {
    render(<ArtistPortalView token="valid.test.token" />);

    await waitFor(() => {
      expect(screen.getByText('Master Audio (WAV 24-bit)')).toBeDefined();
    });

    const approveButtons = screen.getAllByText('Aprobar');
    expect(approveButtons.length).toBeGreaterThan(0);

    // Click approve on first deliverable
    fireEvent.click(approveButtons[0]);

    await waitFor(() => {
      expect(screen.getByText('Aprobado')).toBeDefined();
    });
  });

  test('requests adjustments with custom feedback drawer', async () => {
    render(<ArtistPortalView token="valid.test.token" />);

    await waitFor(() => {
      expect(screen.getByText('Arte de Portada Oficial 1:1')).toBeDefined();
    });

    const adjustButtons = screen.getAllByText('Pedir Ajuste');
    fireEvent.click(adjustButtons[1]); // Click for Cover Art

    // Drawer opens
    const textarea = screen.getByPlaceholderText(
      'Describe los cambios o sugerencias que necesitas...'
    );
    expect(textarea).toBeDefined();

    fireEvent.change(textarea, {
      target: { value: 'Aumentar saturación del fondo espacial.' },
    });

    const submitAdjustBtn = screen.getByText('Enviar Ajuste');
    fireEvent.click(submitAdjustBtn);

    await waitFor(() => {
      expect(screen.getByText('Ajustes Pedidos')).toBeDefined();
    });
  });
});
