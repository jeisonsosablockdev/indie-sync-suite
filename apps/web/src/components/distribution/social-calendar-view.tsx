/**
 * @file social-calendar-view.tsx
 * @layer Presentation
 * @description Visual publication calendar with release day T-0 highlighted milestone,
 *              network filtering, and scheduled post cards. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import { Calendar, Filter, Clock, CheckCircle2, AlertCircle } from 'lucide-react';
import {
  useSocialCalendar,
  ScheduledPost,
  SocialPlatform,
  PostStatus,
} from '../../lib/hooks/use-social-calendar';

export interface SocialCalendarViewProps {
  releaseId: string;
  targetReleaseDate?: string;
  initialPosts?: ScheduledPost[];
}

const STATUS_BADGES: Record<PostStatus, { label: string; text: string; bg: string }> = {
  DRAFT: { label: 'Borrador', text: 'text-zinc-600', bg: 'bg-zinc-100 dark:bg-zinc-800' },
  QUEUED: { label: 'En Cola', text: 'text-indigo-600', bg: 'bg-indigo-50 dark:bg-indigo-950/60' },
  PUBLISHED: { label: 'Publicado', text: 'text-emerald-600', bg: 'bg-emerald-50 dark:bg-emerald-950/60' },
  FAILED: { label: 'Fallido', text: 'text-rose-600', bg: 'bg-rose-50 dark:bg-rose-950/60' },
};

/**
 * SocialCalendarView presentation component.
 */
export function SocialCalendarView({
  releaseId,
  targetReleaseDate = '2026-11-20T00:00:00Z',
  initialPosts,
}: SocialCalendarViewProps) {
  // Step 1: Bind application hook
  const {
    filteredPosts,
    selectedPlatform,
    setSelectedPlatform,
    reschedulePost,
    cancelPost,
  } = useSocialCalendar({ releaseId, targetReleaseDate, initialPosts });

  const releaseDateObj = new Date(targetReleaseDate);

  return (
    <div
      className="space-y-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6"
      data-testid="social-calendar-view"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-purple-50 dark:bg-purple-950/60 text-purple-600 dark:text-purple-400">
            <Calendar className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              Calendario de Contenidos & Hito T-0
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Estreno T-0 fijado para el{' '}
              <span className="font-semibold text-zinc-800 dark:text-zinc-200">
                {releaseDateObj.toLocaleDateString('es-ES', { dateStyle: 'long' })}
              </span>
            </p>
          </div>
        </div>

        {/* Platform Filter Buttons */}
        <div className="flex items-center gap-1 bg-zinc-100 dark:bg-zinc-900 p-1 rounded-xl text-xs">
          <Filter className="w-3.5 h-3.5 text-zinc-400 ml-2 mr-1" />
          {(['ALL', 'INSTAGRAM', 'TIKTOK', 'TWITTER_X', 'YOUTUBE'] as const).map((plt) => (
            <button
              key={plt}
              type="button"
              onClick={() => setSelectedPlatform(plt)}
              className={`px-2.5 py-1 rounded-lg font-medium transition-colors ${
                selectedPlatform === plt
                  ? 'bg-white dark:bg-zinc-800 text-zinc-900 dark:text-zinc-100 shadow-sm'
                  : 'text-zinc-500 hover:text-zinc-900'
              }`}
            >
              {plt === 'ALL' ? 'Todos' : plt}
            </button>
          ))}
        </div>
      </div>

      {/* Posts Timeline / Grid */}
      {filteredPosts.length === 0 ? (
        <div className="py-16 text-center text-sm text-zinc-400 dark:text-zinc-500 italic border border-dashed border-zinc-200 dark:border-zinc-800 rounded-xl">
          No hay publicaciones programadas en este filtro. Agenda una publicación o usa el recomendador de slots.
        </div>
      ) : (
        <div className="space-y-3">
          {filteredPosts.map((post) => {
            const postDate = new Date(post.scheduledTime);
            const statusCfg = STATUS_BADGES[post.status] ?? STATUS_BADGES.DRAFT;

            return (
              <div
                key={post.id}
                className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 p-4 rounded-xl border border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 hover:border-zinc-300 dark:hover:border-zinc-700 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="flex flex-col items-center justify-center w-12 h-12 rounded-lg bg-white dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700 text-center">
                    <span className="text-[10px] font-bold uppercase text-zinc-400">
                      {postDate.toLocaleDateString('es-ES', { month: 'short' })}
                    </span>
                    <span className="text-sm font-bold text-zinc-900 dark:text-zinc-100">
                      {postDate.getDate()}
                    </span>
                  </div>

                  <div className="space-y-1">
                    <div className="flex items-center gap-2">
                      <span className="text-xs font-bold text-zinc-800 dark:text-zinc-200">
                        {post.platform}
                      </span>
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-semibold ${statusCfg.bg} ${statusCfg.text}`}
                      >
                        {statusCfg.label}
                      </span>
                    </div>
                    <p className="text-xs text-zinc-600 dark:text-zinc-300 line-clamp-1">
                      {post.postText}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 self-end sm:self-center">
                  <span className="text-xs text-zinc-400 flex items-center gap-1 font-mono">
                    <Clock className="w-3.5 h-3.5" />
                    {postDate.toLocaleTimeString('es-ES', { hour: '2-digit', minute: '2-digit' })}
                  </span>
                  <button
                    type="button"
                    onClick={() => cancelPost(post.id)}
                    className="text-xs text-zinc-400 hover:text-rose-500 transition-colors px-2 py-1"
                  >
                    Cancelar
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
