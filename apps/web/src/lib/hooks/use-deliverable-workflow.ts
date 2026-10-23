/**
 * @file use-deliverable-workflow.ts
 * @layer Application
 * @description React hook for governing deliverable review lifecycles and mandatory feedback audit trails.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  DeliverableStatus,
  ReviewDeliverablePayload,
  transitionDeliverable,
} from '../pipelines/planner/deliverable-state-machine';
import {
  TaskDeliverable,
  DeliverableFeedback,
} from '../infrastructure/db/repositories/sqlite-deliverable-repository';

export interface UseDeliverableWorkflowProps {
  initialDeliverables?: TaskDeliverable[];
  onTransition?: (
    deliverableId: string,
    payload: ReviewDeliverablePayload,
    reviewerRole: 'LABEL_MANAGER' | 'ARTIST'
  ) => Promise<{ deliverable: TaskDeliverable; feedback?: DeliverableFeedback }>;
}

export function useDeliverableWorkflow({
  initialDeliverables = [],
  onTransition,
}: UseDeliverableWorkflowProps = {}) {
  const [deliverables, setDeliverables] = useState<TaskDeliverable[]>(initialDeliverables);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const executeTransition = useCallback(
    async (
      deliverableId: string,
      payload: ReviewDeliverablePayload,
      reviewerRole: 'LABEL_MANAGER' | 'ARTIST'
    ) => {
      const target = deliverables.find(d => d.id === deliverableId);
      if (!target) {
        throw new Error('Entregable no encontrado.');
      }

      // Step 1: Pre-validate state machine transition locally
      transitionDeliverable(target.status, payload);

      setIsSubmitting(true);
      setError(null);
      try {
        if (onTransition) {
          const res = await onTransition(deliverableId, payload, reviewerRole);
          setDeliverables(prev =>
            prev.map(d => (d.id === deliverableId ? res.deliverable : d))
          );
        } else {
          // Local fallback
          const result = transitionDeliverable(target.status, payload);
          setDeliverables(prev =>
            prev.map(d =>
              d.id === deliverableId
                ? {
                    ...d,
                    status: result.newStatus,
                    rejectionReason: result.rejectionReason ?? null,
                    reviewedAt: new Date().toISOString(),
                    reviewedBy: reviewerRole,
                  }
                : d
            )
          );
        }
      } catch (err: any) {
        setError(err.message || 'Error al procesar la transición del entregable.');
        throw err;
      } finally {
        setIsSubmitting(false);
      }
    },
    [deliverables, onTransition]
  );

  return {
    deliverables,
    isSubmitting,
    error,
    executeTransition,
    setDeliverables,
  };
}
