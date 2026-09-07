/**
 * @file artist-editor.test.tsx
 * @layer Presentation Test
 * @description Component integration tests for ArtistEditorForm and ArtistProfileCard.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { ArtistEditorForm } from '../../apps/web/src/components/brand-vault/artist-editor-form';
import { ArtistProfileCard } from '../../apps/web/src/components/brand-vault/artist-profile-card';

describe('Artist Brand Vault Presentation Components', () => {
  describe('ArtistProfileCard', () => {
    test('renders artist name, genre, and palette samples', () => {
      const profile = {
        name: 'Neon Horizon',
        genre: 'Synthwave',
        bio: 'Retro-futuristic beats from Madrid',
        colorPalette: ['#18181B', '#F43F5E'],
        typography: { primary: 'Syne', weights: [700] },
      };

      render(<ArtistProfileCard profile={profile} />);

      expect(screen.getByText('Neon Horizon')).toBeDefined();
      expect(screen.getByText('Synthwave')).toBeDefined();
      expect(screen.getByText('Retro-futuristic beats from Madrid')).toBeDefined();
      expect(screen.getByText('Syne')).toBeDefined();
    });
  });

  describe('ArtistEditorForm', () => {
    test('switches tabs between general, aesthetic, and social sections', () => {
      render(<ArtistEditorForm />);

      // Initially on General tab
      expect(screen.getByLabelText(/Nombre del Artista/)).toBeDefined();

      // Switch to Aesthetic tab
      const aestheticTab = screen.getByText('2. Estética Visual');
      fireEvent.click(aestheticTab);
      expect(screen.getByText(/Paleta de Colores de Marca/)).toBeDefined();

      // Switch to Social tab
      const socialTab = screen.getByText('3. Tono & Plataformas');
      fireEvent.click(socialTab);
      expect(screen.getByLabelText(/Tono de Voz/)).toBeDefined();
    });

    test('validates required fields on submission and shows error messages', async () => {
      render(<ArtistEditorForm />);

      const submitBtn = screen.getByText('Guardar Perfil de Marca');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(screen.getByText('El nombre del artista es obligatorio')).toBeDefined();
      });
    });

    test('submits valid artist profile and displays success message', async () => {
      const onSave = vi.fn().mockResolvedValue(undefined);

      render(
        <ArtistEditorForm
          initialArtist={{
            id: '11111111-1111-4111-8111-111111111111',
            labelId: '22222222-2222-4222-8222-222222222222',
            name: 'Aurora Borealis',
            genre: 'Ambient',
            colorPalette: ['#0F172A', '#38BDF8'],
          }}
          onSaveProfile={onSave}
        />
      );

      const submitBtn = screen.getByText('Guardar Perfil de Marca');
      fireEvent.click(submitBtn);

      await waitFor(() => {
        expect(onSave).toHaveBeenCalled();
        expect(screen.getByText(/guardado exitosamente/)).toBeDefined();
      });
    });
  });
});
