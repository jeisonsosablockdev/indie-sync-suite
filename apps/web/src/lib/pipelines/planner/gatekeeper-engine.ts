/**
 * @file gatekeeper-engine.ts
 * @layer Domain
 * @description Pure algorithms for identifying blocked gatekeepers, critical path analysis,
 *              and evaluating the strict 7-day DSP editorial pitching window.
 */

import { ReleaseTask } from './planner-schemas';
import { normalizeToUtcMidnight } from './schedule-projector';

export interface BlockedGatekeeperResult {
  task: ReleaseTask;
  overdueDays: number;
  dependentTaskIds: string[];
}

export interface DspWindowEvaluation {
  isViolated: boolean;
  deficitDays: number;
  currentMarginDays: number;
  minimumRequiredMarginDays: number;
  suggestedTargetShiftDays: number;
  actionMessage: string;
}

/**
 * Minimum calendar days required by Spotify for Artists / Amazon Music prior to T-0
 * to ensure editorial playlist curation consideration.
 */
export const MIN_DSP_PITCHING_WINDOW_DAYS = 7;

/**
 * Detects gatekeeper tasks that are past their due date and not marked DONE.
 */
export function detectBlockedGatekeepers(
  tasks: ReleaseTask[],
  dependencies: { taskId: string; prerequisiteTaskId: string }[],
  nowDateInput: string | Date = new Date()
): BlockedGatekeeperResult[] {
  const nowUtc = normalizeToUtcMidnight(nowDateInput).getTime();
  const blockedList: BlockedGatekeeperResult[] = [];

  // Step 1: Filter active gatekeeper tasks
  const gatekeepers = tasks.filter(t => t.isGatekeeper && t.status !== 'DONE');

  for (const gk of gatekeepers) {
    const dueUtc = normalizeToUtcMidnight(gk.dueDate).getTime();
    if (dueUtc < nowUtc) {
      const overdueMs = nowUtc - dueUtc;
      const overdueDays = Math.ceil(overdueMs / (1000 * 60 * 60 * 24));

      // Step 2: Find directly and transitively dependent tasks
      const dependentTaskIds = dependencies
        .filter(dep => dep.prerequisiteTaskId === gk.id)
        .map(dep => dep.taskId);

      blockedList.push({
        task: gk,
        overdueDays,
        dependentTaskIds,
      });
    }
  }

  return blockedList;
}

/**
 * Evaluates whether the DSP pitching task respects the minimum 7-day margin before T-0.
 */
export function evaluateDspPitchingWindow(
  targetDateInput: string | Date,
  pitchingDueDateInput: string | Date
): DspWindowEvaluation {
  const targetUtc = normalizeToUtcMidnight(targetDateInput).getTime();
  const pitchingUtc = normalizeToUtcMidnight(pitchingDueDateInput).getTime();

  const diffMs = targetUtc - pitchingUtc;
  const currentMarginDays = Math.floor(diffMs / (1000 * 60 * 60 * 24));
  const isViolated = currentMarginDays < MIN_DSP_PITCHING_WINDOW_DAYS;
  const deficitDays = isViolated ? MIN_DSP_PITCHING_WINDOW_DAYS - currentMarginDays : 0;
  const suggestedTargetShiftDays = deficitDays;

  return {
    isViolated,
    deficitDays,
    currentMarginDays,
    minimumRequiredMarginDays: MIN_DSP_PITCHING_WINDOW_DAYS,
    suggestedTargetShiftDays,
    actionMessage: isViolated
      ? `Ventana editorial en riesgo. El pitching está programado a ${currentMarginDays} días de T-0 (mínimo ${MIN_DSP_PITCHING_WINDOW_DAYS} días). Desplace T-0 en +${suggestedTargetShiftDays} días para restaurar curaduría.`
      : `Ventana editorial DSP conforme (${currentMarginDays} días de antelación).`,
  };
}
