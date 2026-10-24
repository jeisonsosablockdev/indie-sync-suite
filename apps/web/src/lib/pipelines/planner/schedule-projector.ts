/**
 * @file schedule-projector.ts
 * @layer Domain
 * @description Pure functions for projecting absolute UTC schedule dates
 *              from target date T-0 and relative day offsets.
 */

import { ArchetypeTemplate } from './archetype-templates';
import { PhaseType } from './planner-schemas';

export interface ProjectedTaskDate {
  title: string;
  description: string;
  phaseType: PhaseType;
  offsetDays: number;
  dueDate: string; // ISO-8601 UTC string at midnight
  isGatekeeper: boolean;
  assignedRole: 'LABEL_MANAGER' | 'ARTIST' | 'COLLABORATOR';
}

export interface ProjectedPhaseDates {
  phaseType: PhaseType;
  name: string;
  startDate: string;
  endDate: string;
}

export interface ProjectedSchedule {
  targetDate: string;
  phases: ProjectedPhaseDates[];
  tasks: ProjectedTaskDate[];
}

/**
 * Normalizes any valid date string or Date object to midnight UTC (00:00:00.000Z).
 * Eliminates timezone drifts caused by Daylight Saving Time (DST).
 */
export function normalizeToUtcMidnight(dateInput: string | Date): Date {
  const d = new Date(dateInput);
  if (isNaN(d.getTime())) {
    throw new Error(`Fecha inválida: ${dateInput}`);
  }
  return new Date(Date.UTC(d.getUTCFullYear(), d.getUTCMonth(), d.getUTCDate(), 0, 0, 0, 0));
}

/**
 * Adds an integer number of calendar days to a date in UTC.
 */
export function addDaysUtc(date: Date, days: number): Date {
  const result = new Date(date.getTime());
  result.setUTCDate(result.getUTCDate() + days);
  return result;
}

/**
 * Pure projector computing absolute UTC dates for an archetype template given T-0.
 */
export function calculateScheduleDates(
  targetDateInput: string | Date,
  template: ArchetypeTemplate
): ProjectedSchedule {
  // Step 1: Normalize T-0 target date
  const targetDateUtc = normalizeToUtcMidnight(targetDateInput);
  const targetDateIso = targetDateUtc.toISOString();

  // Step 2: Project each task's absolute due date
  const projectedTasks: ProjectedTaskDate[] = template.tasks.map(t => {
    const taskDate = addDaysUtc(targetDateUtc, t.offsetDays);
    return {
      ...t,
      dueDate: taskDate.toISOString(),
    };
  });

  // Step 3: Determine bounding dates for the 3 phases
  const preTasks = projectedTasks.filter(t => t.phaseType === 'PRE_RELEASE');
  const liveTasks = projectedTasks.filter(t => t.phaseType === 'LIVE_RELEASE');
  const postTasks = projectedTasks.filter(t => t.phaseType === 'POST_RELEASE');

  const getMinDate = (tasks: ProjectedTaskDate[], fallback: Date) =>
    tasks.length > 0
      ? new Date(Math.min(...tasks.map(t => new Date(t.dueDate).getTime()))).toISOString()
      : fallback.toISOString();

  const getMaxDate = (tasks: ProjectedTaskDate[], fallback: Date) =>
    tasks.length > 0
      ? new Date(Math.max(...tasks.map(t => new Date(t.dueDate).getTime()))).toISOString()
      : fallback.toISOString();

  const phases: ProjectedPhaseDates[] = [
    {
      phaseType: 'PRE_RELEASE',
      name: 'Fase Pre-Lanzamiento',
      startDate: getMinDate(preTasks, addDaysUtc(targetDateUtc, -template.totalDays)),
      endDate: addDaysUtc(targetDateUtc, -1).toISOString(),
    },
    {
      phaseType: 'LIVE_RELEASE',
      name: 'Fase de Estreno (Live)',
      startDate: targetDateIso,
      endDate: getMaxDate(liveTasks, addDaysUtc(targetDateUtc, 2)),
    },
    {
      phaseType: 'POST_RELEASE',
      name: 'Fase Post-Lanzamiento',
      startDate: addDaysUtc(targetDateUtc, 3).toISOString(),
      endDate: getMaxDate(postTasks, addDaysUtc(targetDateUtc, 14)),
    },
  ];

  return {
    targetDate: targetDateIso,
    phases,
    tasks: projectedTasks,
  };
}
