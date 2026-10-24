/**
 * @file use-social-calendar.ts
 * @layer Application
 * @description Application hook managing the visual social calendar, filtering by network,
 *              and rescheduling publication slots synchronized with release milestone T-0. Zero direct JSX.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import {
  ScheduledPost,
  PostStatus,
  SocialPlatform,
} from '../pipelines/distribution/distribution-schemas';

export type { ScheduledPost, PostStatus, SocialPlatform };

export interface UseSocialCalendarOptions {
  releaseId: string;
  targetReleaseDate?: string;
  initialPosts?: ScheduledPost[];
}

export interface UseSocialCalendarReturn {
  posts: ScheduledPost[];
  filteredPosts: ScheduledPost[];
  selectedPlatform: SocialPlatform | 'ALL';
  setSelectedPlatform: (platform: SocialPlatform | 'ALL') => void;
  isLoading: boolean;
  error: string | null;
  reschedulePost: (postId: string, newScheduledTime: string) => Promise<boolean>;
  cancelPost: (postId: string) => Promise<boolean>;
}

/**
 * Custom application hook for the visual content publication calendar.
 *
 * @param options - Configuration including releaseId and optional initial posts
 * @returns State and action handlers for the social calendar view
 */
export function useSocialCalendar({
  releaseId,
  targetReleaseDate,
  initialPosts = [],
}: UseSocialCalendarOptions): UseSocialCalendarReturn {
  // Step 1: Initialize posts state
  const [posts, setPosts] = useState<ScheduledPost[]>(initialPosts);
  const [selectedPlatform, setSelectedPlatform] = useState<SocialPlatform | 'ALL'>('ALL');
  const [isLoading, setIsLoading] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Filter posts by platform
  const filteredPosts = useMemo(() => {
    if (selectedPlatform === 'ALL') return posts;
    return posts.filter((p) => p.platform === selectedPlatform);
  }, [posts, selectedPlatform]);

  // Step 3: Reschedule post handler
  const reschedulePost = useCallback(
    async (postId: string, newScheduledTime: string): Promise<boolean> => {
      setIsLoading(true);
      try {
        setPosts((prev) =>
          prev.map((p) => (p.id === postId ? { ...p, scheduledTime: newScheduledTime } : p))
        );
        return true;
      } catch (err: unknown) {
        const msg = err instanceof Error ? err.message : 'Failed to reschedule post';
        setError(msg);
        return false;
      } finally {
        setIsLoading(false);
      }
    },
    []
  );

  // Step 4: Cancel post handler
  const cancelPost = useCallback(async (postId: string): Promise<boolean> => {
    setPosts((prev) => prev.filter((p) => p.id !== postId));
    return true;
  }, []);

  return {
    posts,
    filteredPosts,
    selectedPlatform,
    setSelectedPlatform,
    isLoading,
    error,
    reschedulePost,
    cancelPost,
  };
}
