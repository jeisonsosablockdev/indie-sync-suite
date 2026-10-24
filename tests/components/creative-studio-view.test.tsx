/**
 * @file creative-studio-view.test.tsx
 * @layer Presentation Test
 * @description UI unit tests for CreativeStudioView component (HU-3.1 / SPEC-03-02).
 *              Verifies format switching, tab navigation, and responsive controls.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { CreativeStudioView } from '../../apps/web/src/components/creative/creative-studio-view';

describe('CreativeStudioView UI Component (HU-3.1 / SPEC-03-02)', () => {
  const releaseId = '123e4567-e89b-12d3-a456-426614174000';
  const releaseTitle = 'Cosmic Odyssey';
  const artistName = 'Astra Nova';

  test('@spec REQ-HU-3.1-04: renders studio header with release title and artist name', () => {
    // Arrange & Act
    render(
      <CreativeStudioView
        releaseId={releaseId}
        releaseTitle={releaseTitle}
        artistName={artistName}
      />
    );

    // Assert
    expect(screen.getByText('Estudio Creativo Multimedia')).toBeDefined();
    expect(screen.getByText(new RegExp(releaseTitle))).toBeDefined();
    expect(screen.getByText(artistName)).toBeDefined();
  });

  test('@spec REQ-HU-3.1-05: renders official format switcher with 3000px, 9:16 and 16:9 buttons', () => {
    // Arrange & Act
    render(<CreativeStudioView releaseId={releaseId} />);

    // Assert
    expect(screen.getByText('1:1 Portada (3000px)')).toBeDefined();
    expect(screen.getByText('9:16 Canvas / Story')).toBeDefined();
    expect(screen.getByText('16:9 Banner')).toBeDefined();
  });

  test('@spec REQ-HU-3.1-06: switching format toggles active selection state', () => {
    // Arrange
    render(<CreativeStudioView releaseId={releaseId} />);
    const canvasButton = screen.getByText('9:16 Canvas / Story');

    // Act
    fireEvent.click(canvasButton);

    // Assert: active button has highlighted styling
    expect(canvasButton.className).toContain('text-zinc-900');
  });

  test('@spec REQ-HU-3.1-07: renders all 5 creative studio tabs and switches active tab', () => {
    // Arrange
    render(<CreativeStudioView releaseId={releaseId} />);

    // Assert: Tab buttons exist
    const promptStudioTab = screen.getByText('Prompt Studio');
    const batchTab = screen.getByText('Lote de Variantes');
    const typographyTab = screen.getByText('Maquetación Tipográfica');
    const copyTab = screen.getByText('Copys de Campaña');
    const vaultTab = screen.getByText('Asset Vault');

    expect(promptStudioTab).toBeDefined();
    expect(batchTab).toBeDefined();
    expect(typographyTab).toBeDefined();
    expect(copyTab).toBeDefined();
    expect(vaultTab).toBeDefined();

    // Act: Click Batch tab
    fireEvent.click(batchTab);

    // Assert: Active tab receives highlighted background
    expect(batchTab.closest('button')?.className).toContain('bg-zinc-900');
  });
});
