/**
 * @file apps/web/src/lib/pipelines/outbox/outbox-event.ts
 * @layer Domain / Pipelines (Layer 3)
 * @description Domain entity contracts, Zod schemas, and lifecycle states for the Outbox Pattern (cloud_sync_queue).
 *
 * Architectural Invariant:
 * Pure domain definitions. Zero direct dependencies on database drivers or network transports.
 */

import { z } from "zod";

/**
 * Supported aggregate types for the synchronization queue.
 */
export const OutboxAggregateTypeSchema = z.enum(["label", "artist", "release", "task"]);
export type OutboxAggregateType = z.infer<typeof OutboxAggregateTypeSchema>;

/**
 * Mutation action types recorded in the outbox.
 */
export const OutboxActionSchema = z.enum(["CREATE", "UPDATE", "DELETE"]);
export type OutboxAction = z.infer<typeof OutboxActionSchema>;

/**
 * State machine statuses for an outbox synchronization entry.
 */
export const OutboxStatusSchema = z.enum(["PENDING", "PROCESSING", "SYNCED", "FAILED"]);
export type OutboxStatus = z.infer<typeof OutboxStatusSchema>;

/**
 * Schema validating an Outbox Event record.
 */
export const OutboxEventSchema = z.object({
  id: z.string().min(1, "Outbox event ID is required"),
  aggregateType: OutboxAggregateTypeSchema,
  aggregateId: z.string().min(1, "Aggregate ID is required"),
  action: OutboxActionSchema,
  payload: z.string().min(2, "Payload JSON snapshot is required"),
  status: OutboxStatusSchema.default("PENDING"),
  retryCount: z.number().int().min(0).default(0),
  errorMessage: z.string().nullable().optional(),
  createdAt: z.string(),
  syncedAt: z.string().nullable().optional(),
});

export type OutboxEvent = z.infer<typeof OutboxEventSchema>;

/**
 * Input parameters required to enqueue a new outbox event.
 */
export interface EnqueueOutboxInput {
  id?: string;
  aggregateType: OutboxAggregateType;
  aggregateId: string;
  action: OutboxAction;
  payload: Record<string, unknown>;
}
