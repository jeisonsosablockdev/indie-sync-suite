/**
 * @file use-cascade-recalc.ts
 * @layer Application
 * @description React hook for simulating, previewing, confirming, and rolling back DAG cascade recalculations.
 */

'use client';

import { useState, useCallback } from 'react';
import { ReleaseTask, ScheduleDiff } from '../pipelines/planner/planner-schemas';
import { calculateCascadeShift, TaskDependencyEdge } from '../pipelines/planner/cascade-calculator';

export interface UseCascadeRecalcProps {
  releaseId: string;
  tasks: ReleaseTask[];
  dependencies: TaskDependencyEdge[];
  onCommitDiff?: (diff: ScheduleDiff) => Promise<void>;
  onRollbackUndo?: (releaseId: string) => Promise<void>;
}

export function useCascadeRecalc({
  releaseId,
  tasks,
  dependencies,
  onCommitDiff,
  onRollbackUndo,
}: UseCascadeRecalcProps) {
  const [activeDiff, setActiveDiff] = useState<ScheduleDiff | null>(null);
  const [isPreviewOpen, setIsPreviewOpen] = useState(false);
  const [isCommitting, setIsCommitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const previewCascadeShift = useCallback(
    (rootTaskId: string, deltaDays: number) => {
      try {
        setError(null);
        // Step 1: Run pure cascade recalculation in Domain layer
        const result = calculateCascadeShift(tasks, dependencies, rootTaskId, deltaDays);

        const diff: ScheduleDiff = {
          releaseId,
          targetDateShiftDays: 0,
          affectedTasks: result.affectedTasks,
          dspWindowViolation: false,
          deficitDays: 0,
        };

        // Step 2: Set preview diff and open modal
        setActiveDiff(diff);
        setIsPreviewOpen(true);
      } catch (err: any) {
        setError(err.message || 'Error al calcular la propagación de fechas en cascada.');
      }
    },
    [releaseId, tasks, dependencies]
  );

  const confirmDiff = useCallback(async () => {
    if (!activeDiff || !onCommitDiff) return;
    setIsCommitting(true);
    try {
      await onCommitDiff(activeDiff);
      setIsPreviewOpen(false);
      setActiveDiff(null);
    } catch (err: any) {
      setError(err.message || 'Error al persistir el recálculo en la base de datos.');
    } finally {
      setIsCommitting(false);
    }
  }, [activeDiff, onCommitDiff]);

  const cancelPreview = useCallback(() => {
    setIsPreviewOpen(false);
    setActiveDiff(null);
  }, []);

  const rollbackUndo = useCallback(
    async (targetReleaseId: string) => {
      if (!onRollbackUndo) return;
      setIsCommitting(true);
      try {
        await onRollbackUndo(targetReleaseId);
        setError(null);
      } catch (err: any) {
        setError(err.message || 'Error al ejecutar el rollback del cronograma.');
      } finally {
        setIsCommitting(false);
      }
    },
    [onRollbackUndo]
  );

  return {
    activeDiff,
    isPreviewOpen,
    isCommitting,
    error,
    previewCascadeShift,
    confirmDiff,
    cancelPreview,
    rollbackUndo,
  };
}
