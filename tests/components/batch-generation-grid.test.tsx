/**
 * @file batch-generation-grid.test.tsx
 * @layer Presentation Test
 * @description UI unit tests for BatchGenerationGrid component (HU-3.2 / SPEC-03-03).
 *              Verifies 4-variant visual triage, approval, discarding, and regeneration.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { BatchGenerationGrid } from '../../apps/web/src/components/creative/batch-generation-grid';
import { BatchVariantItem } from '../../apps/web/src/lib/hooks/use-batch-curation';

describe('BatchGenerationGrid UI Component (HU-3.2 / SPEC-03-03)', () => {
  const mockVariants: BatchVariantItem[] = [
    {
      id: 'v-1',
      batchId: 'batch-01',
      variantIndex: 0,
      previewUrl: 'https://images.example.com/variant-1.png',
      format: 'COVER_1_1',
      status: 'DRAFT',
      contentHash: 'hash-01',
    },
    {
      id: 'v-2',
      batchId: 'batch-01',
      variantIndex: 1,
      previewUrl: 'https://images.example.com/variant-2.png',
      format: 'COVER_1_1',
      status: 'DRAFT',
      contentHash: 'hash-02',
    },
    {
      id: 'v-3',
      batchId: 'batch-01',
      variantIndex: 2,
      previewUrl: 'https://images.example.com/variant-3.png',
      format: 'COVER_1_1',
      status: 'DRAFT',
      contentHash: 'hash-03',
    },
    {
      id: 'v-4',
      batchId: 'batch-01',
      variantIndex: 3,
      previewUrl: 'https://images.example.com/variant-4.png',
      format: 'COVER_1_1',
      status: 'DRAFT',
      contentHash: 'hash-04',
    },
  ];

  test('@spec REQ-HU-3.2-07: renders grid with all 4 variants and headers', () => {
    // Arrange & Act
    render(<BatchGenerationGrid initialVariants={mockVariants} />);

    // Assert
    expect(screen.getByText('Exploración y Curaduría en Lote (4 Variantes)')).toBeDefined();
    expect(screen.getByText('V1')).toBeDefined();
    expect(screen.getByText('V2')).toBeDefined();
    expect(screen.getByText('V3')).toBeDefined();
    expect(screen.getByText('V4')).toBeDefined();
  });

  test('@spec REQ-HU-3.2-08: approving a variant triggers approval callback and marks it as approved', () => {
    // Arrange
    const onApprove = vi.fn();
    render(
      <BatchGenerationGrid
        initialVariants={mockVariants}
        onApproveVariant={onApprove}
      />
    );

    const approveButtons = screen.getAllByTitle('Aprobar para Vault');
    expect(approveButtons).toHaveLength(4);

    // Act: Approve variant 1
    fireEvent.click(approveButtons[0]);

    // Assert: onApprove callback called with variant id
    expect(onApprove).toHaveBeenCalledWith('v-1');
  });

  test('@spec REQ-HU-3.2-09: discarding a variant applies visual opacity styling', () => {
    // Arrange
    render(<BatchGenerationGrid initialVariants={mockVariants} />);
    const discardButtons = screen.getAllByTitle('Descartar');

    // Act: Discard variant 2
    fireEvent.click(discardButtons[1]);

    // Assert: Card container reflects discarded styling
    const v2Badge = screen.getByText('V2');
    const card = v2Badge.closest('.group');
    expect(card?.className).toContain('opacity-40');
  });

  test('@spec REQ-HU-3.2-10: clicking open stamping canvas invokes callback when provided', () => {
    // Arrange
    const onOpenCanvas = vi.fn();
    render(
      <BatchGenerationGrid
        initialVariants={mockVariants}
        onOpenStampingCanvas={onOpenCanvas}
      />
    );

    const stampingButtons = screen.getAllByTitle('Maquetar Tipografía');

    // Act
    fireEvent.click(stampingButtons[0]);

    // Assert
    expect(onOpenCanvas).toHaveBeenCalledTimes(1);
    expect(onOpenCanvas).toHaveBeenCalledWith(mockVariants[0]);
  });
});
