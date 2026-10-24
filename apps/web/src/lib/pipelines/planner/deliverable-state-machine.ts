/**
 * @file deliverable-state-machine.ts
 * @layer Domain
 * @description Pure Finite State Machine (FSM) governing deliverable approvals,
 *              transitions, and mandatory feedback validation (>= 10 chars).
 */

import { z } from 'zod';

export const DeliverableStatusSchema = z.enum([
  'DRAFT',
  'IN_REVIEW',
  'APPROVED',
  'REJECTED',
]);

export type DeliverableStatus = z.infer<typeof DeliverableStatusSchema>;

export const DeliverableActionSchema = z.enum([
  'SUBMIT_FOR_REVIEW',
  'APPROVE',
  'REJECT',
  'RESET_TO_DRAFT',
]);

export type DeliverableAction = z.infer<typeof DeliverableActionSchema>;

export const ReviewDeliverableActionSchema = z.discriminatedUnion('action', [
  z.object({
    action: z.literal('SUBMIT_FOR_REVIEW'),
  }),
  z.object({
    action: z.literal('APPROVE'),
    comment: z.string().trim().max(1000).optional().default('Aprobado conforme.'),
  }),
  z.object({
    action: z.literal('REJECT'),
    rejectionReason: z
      .string()
      .trim()
      .min(10, 'El motivo de rechazo debe contener al menos 10 caracteres explicativos.')
      .max(2000),
  }),
  z.object({
    action: z.literal('RESET_TO_DRAFT'),
  }),
]);

export type ReviewDeliverablePayload = z.infer<typeof ReviewDeliverableActionSchema>;

export interface DeliverableTransitionResult {
  previousStatus: DeliverableStatus;
  newStatus: DeliverableStatus;
  rejectionReason?: string;
  comment?: string;
}

/**
 * Pure transition function enforcing valid status transitions.
 */
export function transitionDeliverable(
  currentStatus: DeliverableStatus,
  payload: ReviewDeliverablePayload
): DeliverableTransitionResult {
  // Step 1: Validate payload schema
  const parsed = ReviewDeliverableActionSchema.parse(payload);

  // Step 2: Enforce state transition invariants
  switch (parsed.action) {
    case 'SUBMIT_FOR_REVIEW':
      if (currentStatus !== 'DRAFT' && currentStatus !== 'REJECTED') {
        throw new Error(`Transición inválida: No se puede enviar a revisión un entregable en estado ${currentStatus}.`);
      }
      return { previousStatus: currentStatus, newStatus: 'IN_REVIEW' };

    case 'APPROVE':
      if (currentStatus !== 'IN_REVIEW') {
        throw new Error(`Transición inválida: Solo se pueden aprobar entregables que estén en estado IN_REVIEW. Estado actual: ${currentStatus}.`);
      }
      return { previousStatus: currentStatus, newStatus: 'APPROVED', comment: parsed.comment };

    case 'REJECT':
      if (currentStatus !== 'IN_REVIEW') {
        throw new Error(`Transición inválida: Solo se pueden rechazar entregables que estén en estado IN_REVIEW. Estado actual: ${currentStatus}.`);
      }
      return { previousStatus: currentStatus, newStatus: 'REJECTED', rejectionReason: parsed.rejectionReason };

    case 'RESET_TO_DRAFT':
      return { previousStatus: currentStatus, newStatus: 'DRAFT' };

    default:
      throw new Error(`Acción desconocida.`);
  }
}
