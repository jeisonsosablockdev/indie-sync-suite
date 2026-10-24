/**
 * @file planner-schemas.ts
 * @layer Domain
 * @description Invariant Zod schemas and TypeScript types for Release Concepts,
 *              Tasks, Phases, DAG Dependencies, and Schedule Diffs.
 */

import { z } from 'zod';

// ==============================================================================
// Step 1: Release Concept Schemas (Contexto Nivel 3)
// ==============================================================================

/**
 * Standard ISRC code validator according to ISO 3901 (e.g., US-S1Z-26-00001).
 * Accepts 12 alphanumeric characters formatted or unformatted.
 */
export const IsrcSchema = z
  .string()
  .trim()
  .regex(/^[A-Z]{2}-?[A-Z0-9]{3}-?[0-9]{2}-?[0-9]{5}$/i, {
    message: 'ISRC inválido. Formato esperado: CC-XXX-YY-NNNNN (ej. US-S1Z-26-00001)',
  })
  .transform(val => val.replace(/-/g, '').toUpperCase())
  .optional()
  .or(z.literal(''));

/**
 * Universal Product Code (UPC) schema (12 numeric digits).
 */
export const UpcSchema = z
  .string()
  .trim()
  .regex(/^[0-9]{12}$/, {
    message: 'Código UPC inválido. Debe contener exactamente 12 dígitos numéricos.',
  })
  .optional()
  .or(z.literal(''));

/**
 * Invariant schema for Release Concept (Contexto Nivel 3).
 */
export const ReleaseConceptSchema = z.object({
  id: z.string().uuid(),
  releaseId: z.string().uuid(),
  narrative: z.string().min(5, 'La narrativa del release debe contener al menos 5 caracteres').max(3000),
  lyricTheme: z.string().min(3, 'El tema lírico debe contener al menos 3 caracteres').max(1000),
  soundMood: z.string().min(3, 'El mood sonoro es obligatorio').max(500),
  isrc: IsrcSchema,
  upc: UpcSchema,
  targetDate: z.string().datetime({ message: 'La fecha objetivo T-0 debe ser una cadena ISO-8601 válida en UTC' }),
  budgetUsd: z.number().min(0, 'El presupuesto no puede ser negativo').default(0),
  snapshotFrozen: z.boolean().default(false),
  frozenAt: z.string().datetime().nullable().optional(),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type ReleaseConcept = z.infer<typeof ReleaseConceptSchema>;

// ==============================================================================
// Step 2: Release Tasks & Phases Schemas
// ==============================================================================

export const PhaseTypeSchema = z.enum(['PRE_RELEASE', 'LIVE_RELEASE', 'POST_RELEASE']);
export type PhaseType = z.infer<typeof PhaseTypeSchema>;

export const TaskStatusSchema = z.enum(['TODO', 'IN_PROGRESS', 'IN_REVIEW', 'DONE', 'BLOCKED']);
export type TaskStatus = z.infer<typeof TaskStatusSchema>;

export const AssignedRoleSchema = z.enum(['LABEL_MANAGER', 'ARTIST', 'COLLABORATOR']);
export type AssignedRole = z.infer<typeof AssignedRoleSchema>;

export const ReleasePhaseSchema = z.object({
  id: z.string().uuid(),
  releaseId: z.string().uuid(),
  phaseType: PhaseTypeSchema,
  name: z.string().min(1),
  startDate: z.string().datetime(),
  endDate: z.string().datetime(),
  orderIndex: z.number().int().min(0),
  createdAt: z.string().datetime().optional(),
});

export type ReleasePhase = z.infer<typeof ReleasePhaseSchema>;

export const ReleaseTaskSchema = z.object({
  id: z.string().uuid(),
  releaseId: z.string().uuid(),
  phaseId: z.string().uuid(),
  parentTaskId: z.string().uuid().nullable().optional(),
  title: z.string().min(1, 'El título de la tarea es obligatorio').max(200),
  description: z.string().max(2000).optional().default(''),
  assignedRole: AssignedRoleSchema.default('LABEL_MANAGER'),
  dueDate: z.string().datetime({ message: 'La fecha límite debe ser una cadena ISO-8601 UTC' }),
  offsetDays: z.number().int(),
  isGatekeeper: z.boolean().default(false),
  status: TaskStatusSchema.default('TODO'),
  orderIndex: z.number().int().min(0).default(0),
  createdAt: z.string().datetime().optional(),
  updatedAt: z.string().datetime().optional(),
});

export type ReleaseTask = z.infer<typeof ReleaseTaskSchema>;

// ==============================================================================
// Step 3: Schedule Diff Schema (Recálculo en Cascada)
// ==============================================================================

export const TaskDateDiffSchema = z.object({
  taskId: z.string().uuid(),
  title: z.string(),
  oldDueDate: z.string().datetime(),
  newDueDate: z.string().datetime(),
  deltaDays: z.number().int(),
  isGatekeeper: z.boolean(),
  violatesDspWindow: z.boolean().default(false),
});

export type TaskDateDiff = z.infer<typeof TaskDateDiffSchema>;

export const ScheduleDiffSchema = z.object({
  releaseId: z.string().uuid(),
  targetDateShiftDays: z.number().int().default(0),
  affectedTasks: z.array(TaskDateDiffSchema),
  dspWindowViolation: z.boolean().default(false),
  deficitDays: z.number().int().default(0),
  suggestedAction: z.string().optional(),
});

export type ScheduleDiff = z.infer<typeof ScheduleDiffSchema>;
