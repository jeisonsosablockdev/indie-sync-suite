/**
 * @file planner-tools.ts
 * @layer Domain
 * @description Executable planner tools for the autonomous orchestrator with Zod schema contracts
 *              and risk classification (SAFE vs SENSITIVE). Pure factory pattern, zero classes.
 */

import { z } from 'zod';
import { ToolDefinition } from '../../agent/tools/tool-contract';

// ==============================================================================
// Tool 1: consultar_gatekeepers (SAFE)
// ==============================================================================
export const ConsultarGatekeepersSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser UUID válido'),
});

// ==============================================================================
// Tool 2: crear_tarea (SENSITIVE)
// ==============================================================================
export const CrearTareaSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser UUID válido'),
  phaseId: z.string().uuid('ID de fase debe ser UUID válido'),
  title: z.string().min(1, 'El título de la tarea es obligatorio'),
  dueDate: z.string().datetime({ message: 'Fecha límite debe ser ISO-8601 UTC' }),
  offsetDays: z.number().int().default(0),
  isGatekeeper: z.boolean().default(false),
  assignedRole: z.enum(['LABEL_MANAGER', 'ARTIST', 'COLLABORATOR']).default('LABEL_MANAGER'),
});

// ==============================================================================
// Tool 3: mover_fecha_lanzamiento (SENSITIVE)
// ==============================================================================
export const MoverFechaLanzamientoSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser UUID válido'),
  newTargetDate: z.string().datetime({ message: 'La nueva fecha objetivo debe ser ISO-8601 UTC' }),
  reason: z.string().min(5, 'Debe especificar el motivo del cambio de fecha'),
});

// ==============================================================================
// Tool 4: recalcular_cronograma (SENSITIVE)
// ==============================================================================
export const RecalcularCronogramaSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser UUID válido'),
  rootTaskId: z.string().uuid('ID de tarea origen debe ser UUID válido'),
  deltaDays: z.number().int().min(1, 'El desplazamiento debe ser de al menos 1 día'),
});

export type PlannerToolName =
  | 'consultar_gatekeepers'
  | 'crear_tarea'
  | 'mover_fecha_lanzamiento'
  | 'recalcular_cronograma';

export interface PlannerToolDefinitionMeta {
  name: PlannerToolName;
  riskTier: 1 | 2;
  description: string;
}

export const PLANNER_TOOLS_DEFINITIONS: PlannerToolDefinitionMeta[] = [
  { name: 'consultar_gatekeepers', riskTier: 1, description: 'Consulta los hitos críticos (gatekeepers) y evalúa si hay cuellos de botella.' },
  { name: 'crear_tarea', riskTier: 2, description: 'Agenda una nueva tarea en el cronograma de un lanzamiento musical.' },
  { name: 'mover_fecha_lanzamiento', riskTier: 2, description: 'Modifica la fecha de estreno T-0 de un lanzamiento musical.' },
  { name: 'recalcular_cronograma', riskTier: 2, description: 'Aplica un recálculo en cascada desplazando tareas dependientes.' },
];

export interface PlannerToolsPorts {
  getTasks: (releaseId: string) => Promise<any[]>;
  getDependencies: (releaseId: string) => Promise<any[]>;
  createTask: (params: any) => Promise<any>;
  updateReleaseTargetDate: (releaseId: string, newTargetDate: string) => Promise<any>;
  applyCascadeShift: (releaseId: string, rootTaskId: string, deltaDays: number) => Promise<any>;
}

/**
 * Functional factory generating the 4 planner tools for the AI agent.
 */
export function createPlannerTools(ports: PlannerToolsPorts): {
  consultarGatekeepers: ToolDefinition<typeof ConsultarGatekeepersSchema>;
  crearTarea: ToolDefinition<typeof CrearTareaSchema>;
  moverFechaLanzamiento: ToolDefinition<typeof MoverFechaLanzamientoSchema>;
  recalcularCronograma: ToolDefinition<typeof RecalcularCronogramaSchema>;
} {
  return {
    consultarGatekeepers: {
      name: 'consultar_gatekeepers',
      description: 'Consulta los hitos críticos (gatekeepers) y evalúa si hay cuellos de botella o ventanas de DSP en riesgo.',
      riskLevel: 'SAFE',
      parameters: ConsultarGatekeepersSchema,
      execute: async ({ releaseId }) => {
        const tasks = await ports.getTasks(releaseId);
        const blocked = tasks.filter(t => t.isGatekeeper && t.status !== 'DONE');
        return {
          totalTasks: tasks.length,
          blockedGatekeepers: blocked,
          hasBottleneck: blocked.length > 0,
        };
      },
    },

    crearTarea: {
      name: 'crear_tarea',
      description: 'Agenda una nueva tarea en el cronograma de un lanzamiento musical.',
      riskLevel: 'SENSITIVE',
      parameters: CrearTareaSchema,
      requiresConfirmationMessage: params =>
        `El agente solicita agendar la tarea "${params.title}" para el ${params.dueDate} (Rol: ${params.assignedRole}).`,
      execute: async params => {
        return await ports.createTask(params);
      },
    },

    moverFechaLanzamiento: {
      name: 'mover_fecha_lanzamiento',
      description: 'Modifica la fecha de estreno T-0 de un lanzamiento musical y proyecta el impacto en el cronograma.',
      riskLevel: 'SENSITIVE',
      parameters: MoverFechaLanzamientoSchema,
      requiresConfirmationMessage: params =>
        `⚠️ ACCIÓN CRÍTICA: El agente solicita desplazar la fecha de estreno (T-0) a ${params.newTargetDate}. Motivo: ${params.reason}.`,
      execute: async params => {
        return await ports.updateReleaseTargetDate(params.releaseId, params.newTargetDate);
      },
    },

    recalcularCronograma: {
      name: 'recalcular_cronograma',
      description: 'Aplica un recálculo en cascada desplazando tareas dependientes tras el retraso de un hito.',
      riskLevel: 'SENSITIVE',
      parameters: RecalcularCronogramaSchema,
      requiresConfirmationMessage: params =>
        `El agente solicita recalcular en cascada el cronograma desplazando tareas dependientes en +${params.deltaDays} días.`,
      execute: async params => {
        return await ports.applyCascadeShift(params.releaseId, params.rootTaskId, params.deltaDays);
      },
    },
  };
}
