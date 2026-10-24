/**
 * @file asset-vault-gallery.test.tsx
 * @layer Presentation Test
 * @description UI component tests for AssetVaultGallery (HU-3.5 / SPEC-03-06).
 *              Verifies format filtering, search, SHA-256 badges, download triggers, and empty states.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { AssetVaultGallery } from '../../apps/web/src/components/creative/asset-vault-gallery';
import { CreativeAsset } from '../../apps/web/src/lib/pipelines/creative/creative-schemas';

describe('Presentation: AssetVaultGallery (HU-3.5 / SPEC-03-06)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';

  const mockAssets: CreativeAsset[] = [
    {
      id: 'asset-01',
      releaseId,
      format: 'COVER_1_1',
      aspectRatio: 'SQUARE_1_1',
      width: 3000,
      height: 3000,
      storagePath: 'cover.png',
      contentHash: 'e3b0c44298fc1c149afbf4c8996fb92427ae41e4649b934ca495991b7852b855',
      mimeType: 'image/png',
      fileSizeBytes: 4194304,
      status: 'APPROVED',
    },
    {
      id: 'asset-02',
      releaseId,
      format: 'STORY_9_16',
      aspectRatio: 'PORTRAIT_9_16',
      width: 1080,
      height: 1920,
      storagePath: 'story.mp4',
      contentHash: 'f4c1d2e3a4b5c6d7e8f90123456789abcdef0123456789abcdef0123456789ab',
      mimeType: 'video/mp4',
      fileSizeBytes: 10485760,
      status: 'APPROVED',
    },
    {
      id: 'asset-03',
      releaseId,
      format: 'BANNER_16_9',
      aspectRatio: 'LANDSCAPE_16_9',
      width: 1920,
      height: 1080,
      storagePath: 'banner.png',
      contentHash: '1234567890abcdef1234567890abcdef1234567890abcdef1234567890abcdef',
      mimeType: 'image/png',
      fileSizeBytes: 2097152,
      status: 'APPROVED',
    },
  ];

  test('@spec REQ-HU-3.5-14: renders asset vault gallery with filter tabs and all initial assets', () => {
    // Act
    render(<AssetVaultGallery releaseId={releaseId} initialAssets={mockAssets} />);

    // Assert
    expect(screen.getByText('Repositorio Central de Activos Aprobados (Asset Vault)')).toBeDefined();
    expect(screen.getByText('Todos los Activos')).toBeDefined();
    expect(screen.getByText('Portadas 1:1')).toBeDefined();
    expect(screen.getByText('Stories / Canvas 9:16')).toBeDefined();
    expect(screen.getByText('Banners 16:9')).toBeDefined();
    expect(screen.getByText(/4.00 MB/)).toBeDefined();
    expect(screen.getByText(/10.00 MB/)).toBeDefined();
    expect(screen.getByText(/2.00 MB/)).toBeDefined();
  });

  test('@spec REQ-HU-3.5-15: filters assets by format when clicking filter buttons', () => {
    // Act
    render(<AssetVaultGallery releaseId={releaseId} initialAssets={mockAssets} />);

    // Click 'Portadas 1:1' filter
    const coverFilterBtn = screen.getByText('Portadas 1:1');
    fireEvent.click(coverFilterBtn);

    // Only COVER_1_1 should remain
    expect(screen.getByText(/4.00 MB/)).toBeDefined();
    expect(screen.queryByText(/10.00 MB/)).toBeNull();
    expect(screen.queryByText(/2.00 MB/)).toBeNull();
  });

  test('@spec REQ-HU-3.5-16: searches assets by SHA-256 hash substring', () => {
    // Act
    render(<AssetVaultGallery releaseId={releaseId} initialAssets={mockAssets} />);

    const searchInput = screen.getByPlaceholderText('Buscar por ID o hash...');
    fireEvent.change(searchInput, { target: { value: 'e3b0c442' } });

    // Only asset-01 matches
    expect(screen.getByText(/4.00 MB/)).toBeDefined();
    expect(screen.queryByText(/10.00 MB/)).toBeNull();
  });

  test('@spec REQ-HU-3.5-17: displays empty state message when no assets match filter', () => {
    // Act
    render(<AssetVaultGallery releaseId={releaseId} initialAssets={mockAssets} />);

    // Click 'Copys de Campaña' (none present)
    const copyFilterBtn = screen.getByText('Copys de Campaña');
    fireEvent.click(copyFilterBtn);

    expect(screen.getByText('No se encontraron activos aprobados en esta categoría.')).toBeDefined();
  });

  test('@spec REQ-HU-3.5-18: triggers download callback with asset payload when clicking download', () => {
    // Arrange
    const onDownloadAsset = vi.fn();
    render(
      <AssetVaultGallery
        releaseId={releaseId}
        initialAssets={mockAssets}
        onDownloadAsset={onDownloadAsset}
      />
    );

    // Act
    const downloadButtons = screen.getAllByRole('button', { name: /Descargar Activo/i });
    fireEvent.click(downloadButtons[0]);

    // Assert
    expect(onDownloadAsset).toHaveBeenCalledWith(mockAssets[0]);
  });
});
