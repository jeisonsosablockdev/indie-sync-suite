/**
 * @file calendar-slot-calculator.test.ts
 * @layer Domain Test
 * @description Unit tests for calendar-slot-calculator (HU-4.4 / SPEC-04-03).
 *              Verifies chronological slot projection relative to T-0 (T-14, T-7, T-0, T+7) and hour offsets.
 */

import { describe, test, expect } from 'vitest';
import {
  calculateCalendarSlots,
  CalendarSlotParams,
} from '../../../apps/web/src/lib/pipelines/distribution/calendar-slot-calculator';

describe('Domain: calendar-slot-calculator (HU-4.4 / SPEC-04-03)', () => {
  const targetReleaseDate = '2026-11-20T00:00:00.000Z';

  test('@spec REQ-HU-4.4-01: calculates 4 launch phase slots per designated platform', () => {
    // Arrange
    const params: CalendarSlotParams = {
      targetReleaseDate,
      platforms: ['INSTAGRAM', 'TIKTOK'],
    };

    // Act
    const slots = calculateCalendarSlots(params);

    // Assert: 4 phases * 2 platforms = 8 slots
    expect(slots).toHaveLength(8);

    // Chronological order verification
    for (let i = 0; i < slots.length - 1; i++) {
      const current = new Date(slots[i]!.scheduledTime).getTime();
      const next = new Date(slots[i + 1]!.scheduledTime).getTime();
      expect(current).toBeLessThanOrEqual(next);
    }
  });

  test('@spec REQ-HU-4.4-02: projects accurate calendar dates for T-14, T-7, T-0, and T+7', () => {
    // Arrange
    const params: CalendarSlotParams = {
      targetReleaseDate,
      platforms: ['TWITTER_X'],
      preferredPostingHourUtc: 18,
    };

    // Act
    const slots = calculateCalendarSlots(params);

    // Assert
    expect(slots).toHaveLength(4);

    // T-14: 2026-11-06
    expect(slots[0]?.phase).toBe('T_MINUS_14');
    expect(slots[0]?.offsetDays).toBe(-14);
    expect(slots[0]?.scheduledTime).toContain('2026-11-06T18:00:00.000Z');

    // T-7: 2026-11-13
    expect(slots[1]?.phase).toBe('T_MINUS_7');
    expect(slots[1]?.offsetDays).toBe(-7);
    expect(slots[1]?.scheduledTime).toContain('2026-11-13T18:00:00.000Z');

    // T-0: 2026-11-20
    expect(slots[2]?.phase).toBe('T_ZERO');
    expect(slots[2]?.offsetDays).toBe(0);
    expect(slots[2]?.scheduledTime).toContain('2026-11-20T18:00:00.000Z');

    // T+7: 2026-11-27
    expect(slots[3]?.phase).toBe('T_PLUS_7');
    expect(slots[3]?.offsetDays).toBe(7);
    expect(slots[3]?.scheduledTime).toContain('2026-11-27T18:00:00.000Z');
  });

  test('@spec REQ-HU-4.4-03: throws error on invalid targetReleaseDate', () => {
    expect(() =>
      calculateCalendarSlots({
        targetReleaseDate: 'invalid-date-format',
        platforms: ['INSTAGRAM'],
      })
    ).toThrow(/Invalid targetReleaseDate/);
  });
});
