/**
 * @file release-concept-card.test.tsx
 * @layer Presentation Test
 * @description UI unit tests for ReleaseConceptCard component (SPEC-2.1.2.2).
 *              Strict TDD AAA structure and anti-tautology compliance.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect, vi } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { ReleaseConceptCard } from '../../apps/web/src/components/planner/release-concept-card';
import { ReleaseConcept } from '../../apps/web/src/lib/pipelines/planner/planner-schemas';

describe('ReleaseConceptCard UI Component (SPEC-2.1.2.2)', () => {
  const mockConcept: Partial<ReleaseConcept> = {
    id: '10000000-0000-4000-8000-000000000001',
    releaseId: '20000000-0000-4000-8000-000000000001',
    narrative: 'Exploración nostálgica del aislamiento nocturno.',
    lyricTheme: 'Desconexión emocional y redención urbana.',
    soundMood: 'Synthwave analógico oscuro.',
    isrc: 'USS1Z2600001',
    upc: '012345678905',
    targetDate: '2026-11-20T00:00:00.000Z',
    budgetUsd: 1500.0,
    snapshotFrozen: false,
  };

  test('@spec SPEC-2.1.2.2: renders complete concept details and draft badge when not frozen', () => {
    // Arrange & Act
    render(<ReleaseConceptCard concept={mockConcept} canEditBudget={true} />);

    // Assert: Narrative, lyricTheme, soundMood and codes are visible
    expect(screen.getByText('Exploración nostálgica del aislamiento nocturno.')).toBeDefined();
    expect(screen.getByText('Desconexión emocional y redención urbana.')).toBeDefined();
    expect(screen.getByText('Synthwave analógico oscuro.')).toBeDefined();
    expect(screen.getByText('USS1Z2600001')).toBeDefined();
    expect(screen.getByText('012345678905')).toBeDefined();
    expect(screen.getByText('$1,500.00 USD')).toBeDefined();

    // Assert: Draft badge present
    expect(screen.getByTestId('draft-badge')).toBeDefined();
  });

  test('@spec SPEC-2.1.2.2: displays frozen badge and hides edit/freeze buttons when snapshot is frozen', () => {
    // Arrange
    const frozenConcept: Partial<ReleaseConcept> = {
      ...mockConcept,
      snapshotFrozen: true,
      frozenAt: '2026-11-01T12:00:00.000Z',
    };
    const onFreeze = vi.fn();
    const onEdit = vi.fn();

    // Act
    render(
      <ReleaseConceptCard
        concept={frozenConcept}
        canEditBudget={true}
        onFreeze={onFreeze}
        onEdit={onEdit}
      />
    );

    // Assert: Frozen badge visible, buttons absent
    expect(screen.getByTestId('frozen-badge')).toBeDefined();
    expect(screen.queryByTestId('freeze-btn')).toBeNull();
    expect(screen.queryByTestId('edit-concept-btn')).toBeNull();
  });

  test('@spec SPEC-2.1.2.2: masks budget as confidential when canEditBudget is false (Artist role perspective)', () => {
    // Arrange & Act
    render(<ReleaseConceptCard concept={mockConcept} canEditBudget={false} />);

    // Assert: Exact budget dollar amount is hidden, confidential placeholder shown
    expect(screen.queryByText('$1,500.00 USD')).toBeNull();
    expect(screen.getByText('Confidencial (Label)')).toBeDefined();
  });

  test('@spec SPEC-2.1.2.2: triggers onFreeze and onEdit callbacks when buttons are clicked', () => {
    // Arrange
    const onFreeze = vi.fn();
    const onEdit = vi.fn();

    render(
      <ReleaseConceptCard
        concept={mockConcept}
        canEditBudget={true}
        onFreeze={onFreeze}
        onEdit={onEdit}
      />
    );

    // Act: Click buttons
    const freezeBtn = screen.getByTestId('freeze-btn');
    const editBtn = screen.getByTestId('edit-concept-btn');
    fireEvent.click(freezeBtn);
    fireEvent.click(editBtn);

    // Assert: Both callbacks fired
    expect(onFreeze).toHaveBeenCalledTimes(1);
    expect(onEdit).toHaveBeenCalledTimes(1);
  });
});
