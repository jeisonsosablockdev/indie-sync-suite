/**
 * @file use-gatekeeper-alerts.ts
 * @layer Application
 * @description React hook for real-time monitoring of Gatekeeper tasks and DSP delivery window constraints.
 */

'use client';

import { useMemo } from 'react';
import { ReleaseTask } from '../pipelines/planner/planner-schemas';
import {
  detectBlockedGatekeepers,
  evaluateDspPitchingWindow,
  BlockedGatekeeperResult,
  DspWindowEvaluation,
} from '../pipelines/planner/gatekeeper-engine';

export interface UseGatekeeperAlertsProps {
  tasks: ReleaseTask[];
  dependencies?: Array<{ taskId: string; prerequisiteTaskId: string }>;
  targetDateUtc?: string;
  dspPitchingDueDateUtc?: string;
  referenceDateUtc?: string;
}

export function useGatekeeperAlerts({
  tasks,
  dependencies = [],
  targetDateUtc,
  dspPitchingDueDateUtc,
  referenceDateUtc,
}: UseGatekeeperAlertsProps) {
  // Step 1: Compute overdue gatekeeper alerts
  const overdueAlerts = useMemo<BlockedGatekeeperResult[]>(() => {
    return detectBlockedGatekeepers(tasks, dependencies, referenceDateUtc);
  }, [tasks, dependencies, referenceDateUtc]);

  // Step 2: Compute DSP delivery window evaluation if dates are set
  const dspEvaluation = useMemo<DspWindowEvaluation | null>(() => {
    if (!targetDateUtc || !dspPitchingDueDateUtc) return null;
    return evaluateDspPitchingWindow(targetDateUtc, dspPitchingDueDateUtc);
  }, [targetDateUtc, dspPitchingDueDateUtc]);

  // Step 3: Flag if there are blocking conditions for release delivery
  const hasBlockingAlerts = overdueAlerts.length > 0 || (dspEvaluation?.isViolated ?? false);

  return {
    overdueAlerts,
    dspEvaluation,
    hasBlockingAlerts,
  };
}
