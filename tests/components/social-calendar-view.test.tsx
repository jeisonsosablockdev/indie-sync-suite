/**
 * @file social-calendar-view.test.tsx
 * @layer Presentation Test
 * @description UI component tests for SocialCalendarView (HU-4.4 / SPEC-04-03).
 *              Verifies release day T-0 display, platform filtering, post cancellation, and empty states.
 */

// @vitest-environment jsdom

import React from 'react';
import { describe, test, expect } from 'vitest';
import { render, screen, fireEvent } from '@testing-library/react';
import { SocialCalendarView } from '../../apps/web/src/components/distribution/social-calendar-view';
import { ScheduledPost } from '../../apps/web/src/lib/pipelines/distribution/distribution-schemas';

describe('Presentation: SocialCalendarView (HU-4.4 / SPEC-04-03)', () => {
  const releaseId = '33333333-3333-4333-8333-333333333333';
  const targetReleaseDate = '2026-11-20T00:00:00.000Z';

  const mockPosts: ScheduledPost[] = [
    {
      id: 'post-01',
      releaseId,
      platform: 'INSTAGRAM',
      postText: 'Teaser visual oficial en Instagram',
      scheduledTime: '2026-11-06T16:00:00.000Z',
      status: 'QUEUED',
    },
    {
      id: 'post-02',
      releaseId,
      platform: 'TIKTOK',
      postText: 'Trend teaser en TikTok',
      scheduledTime: '2026-11-13T16:00:00.000Z',
      status: 'DRAFT',
    },
    {
      id: 'post-03',
      releaseId,
      platform: 'TWITTER_X',
      postText: 'Hilo de pre-save en X',
      scheduledTime: '2026-11-20T16:00:00.000Z',
      status: 'PUBLISHED',
    },
  ];

  test('@spec REQ-HU-4.4-04: renders calendar view with header and all scheduled posts', () => {
    // Act
    render(
      <SocialCalendarView
        releaseId={releaseId}
        targetReleaseDate={targetReleaseDate}
        initialPosts={mockPosts}
      />
    );

    // Assert
    expect(screen.getByText('Calendario de Contenidos & Hito T-0')).toBeDefined();
    expect(screen.getByText('Teaser visual oficial en Instagram')).toBeDefined();
    expect(screen.getByText('Trend teaser en TikTok')).toBeDefined();
    expect(screen.getByText('Hilo de pre-save en X')).toBeDefined();
    expect(screen.getByText('En Cola')).toBeDefined();
    expect(screen.getByText('Borrador')).toBeDefined();
    expect(screen.getByText('Publicado')).toBeDefined();
  });

  test('@spec REQ-HU-4.4-05: filters posts by platform button', () => {
    // Act
    render(
      <SocialCalendarView
        releaseId={releaseId}
        targetReleaseDate={targetReleaseDate}
        initialPosts={mockPosts}
      />
    );

    // Click 'TIKTOK' filter
    const tiktokBtn = screen.getByRole('button', { name: 'TIKTOK' });
    fireEvent.click(tiktokBtn);

    // Only TikTok post should remain
    expect(screen.getByText('Trend teaser en TikTok')).toBeDefined();
    expect(screen.queryByText('Teaser visual oficial en Instagram')).toBeNull();
    expect(screen.queryByText('Hilo de pre-save en X')).toBeNull();
  });

  test('@spec REQ-HU-4.4-06: cancels a post and removes it from the view', () => {
    // Act
    render(
      <SocialCalendarView
        releaseId={releaseId}
        targetReleaseDate={targetReleaseDate}
        initialPosts={mockPosts}
      />
    );

    const cancelButtons = screen.getAllByText('Cancelar');
    fireEvent.click(cancelButtons[0]);

    // First post should be removed
    expect(screen.queryByText('Teaser visual oficial en Instagram')).toBeNull();
  });

  test('@spec REQ-HU-4.4-07: displays empty state when no posts match filter', () => {
    // Act
    render(
      <SocialCalendarView
        releaseId={releaseId}
        targetReleaseDate={targetReleaseDate}
        initialPosts={mockPosts}
      />
    );

    // Click 'YOUTUBE' (no posts)
    const ytBtn = screen.getByRole('button', { name: 'YOUTUBE' });
    fireEvent.click(ytBtn);

    expect(screen.getByText(/No hay publicaciones programadas en este filtro/)).toBeDefined();
  });
});
