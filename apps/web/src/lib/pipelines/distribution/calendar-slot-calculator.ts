/**
 * @file calendar-slot-calculator.ts
 * @layer Domain
 * @description Pure algorithmic calendar slot calculator projecting optimal publication windows
 *              synchronized with release day milestone T-0 (T-14, T-7, T-0, T+7). Zero network I/O, zero classes.
 */

import { SocialPlatform } from './distribution-schemas';

export interface CalendarSlotParams {
  targetReleaseDate: string; // ISO-8601 UTC
  platforms: SocialPlatform[];
  preferredPostingHourUtc?: number;
}

export interface ProjectedSlot {
  phase: 'T_MINUS_14' | 'T_MINUS_7' | 'T_ZERO' | 'T_PLUS_7';
  offsetDays: number;
  scheduledTime: string; // ISO-8601 UTC
  platform: SocialPlatform;
  recommendedTheme: string;
}

const PHASE_OFFSETS = [
  { phase: 'T_MINUS_14' as const, offsetDays: -14, theme: 'Anuncio de Pre-Save y Teaser Inicial' },
  { phase: 'T_MINUS_7' as const, offsetDays: -7, theme: 'Snippet Exclusivo y Cuenta Regresiva' },
  { phase: 'T_ZERO' as const, offsetDays: 0, theme: '¡YA DISPONIBLE! Difusión Multicanal Masiva' },
  { phase: 'T_PLUS_7' as const, offsetDays: 7, theme: 'Agradecimiento a Fans y Análisis Lírico' },
];

/**
 * Pure calculation engine projecting publication calendar slots relative to T-0.
 *
 * @param params - Release target date and designated channels
 * @returns Array of projected chronological posting slots
 */
export function calculateCalendarSlots(params: CalendarSlotParams): ProjectedSlot[] {
  // Step 1: Parse target release date
  const releaseEpoch = new Date(params.targetReleaseDate).getTime();
  if (isNaN(releaseEpoch)) {
    throw new Error(`Invalid targetReleaseDate: ${params.targetReleaseDate}`);
  }

  const postingHour = params.preferredPostingHourUtc ?? 16; // 16:00 UTC (12:00 PM EST) default
  const slots: ProjectedSlot[] = [];

  // Step 2: Project slots per phase and platform
  for (const { phase, offsetDays, theme } of PHASE_OFFSETS) {
    const slotDate = new Date(releaseEpoch + offsetDays * 24 * 60 * 60 * 1000);
    slotDate.setUTCHours(postingHour, 0, 0, 0);

    for (const platform of params.platforms) {
      slots.push({
        phase,
        offsetDays,
        scheduledTime: slotDate.toISOString(),
        platform,
        recommendedTheme: theme,
      });
    }
  }

  // Step 3: Return chronological slots
  return slots.sort(
    (a, b) => new Date(a.scheduledTime).getTime() - new Date(b.scheduledTime).getTime()
  );
}
