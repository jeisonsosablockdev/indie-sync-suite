/**
 * @file creative-tools.ts
 * @layer Domain
 * @description Executable autonomous agent creative tools with Zod schema contracts
 *              and risk classification (SAFE vs SENSITIVE). Pure factory pattern, zero classes.
 */

import { z } from 'zod';
import { ToolDefinition } from '../../agent/tools/tool-contract';
import { AspectRatioSchema, AssetFormatSchema } from '../creative-schemas';
import { PlatformPresetSchema } from '../prompt-schemas';

// ==============================================================================
// Step 1: Tool Schemas
// ==============================================================================

export const GenerarPortadaSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser un UUID válido'),
  aspectRatio: AspectRatioSchema.default('SQUARE_1_1'),
  additionalDirectives: z.string().optional(),
});

export const GenerarCopySchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser un UUID válido'),
  phase: z.enum(['T_MINUS_14', 'T_MINUS_7', 'T_ZERO', 'T_PLUS_7']),
  platform: z.enum(['INSTAGRAM', 'TWITTER_X', 'TIKTOK', 'NEWSLETTER']),
});

export const CopiarPromptSchema = z.object({
  promptId: z.string().uuid('ID de prompt debe ser un UUID válido'),
  platformPreset: PlatformPresetSchema.default('MIDJOURNEY_V6'),
});

export const ActualizarPromptSchema = z.object({
  promptId: z.string().uuid('ID de prompt debe ser un UUID válido'),
  subject: z.string().min(1, 'El sujeto es obligatorio'),
  promptText: z.string().min(5, 'El texto del prompt debe ser descriptivo'),
  negativePrompt: z.string().optional(),
});

export const ListarActivosAprobadosSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser un UUID válido'),
  format: AssetFormatSchema.optional(),
});

export type CreativeToolName =
  | 'generar_portada'
  | 'generar_copy'
  | 'copiar_prompt'
  | 'actualizar_prompt'
  | 'listar_activos_aprobados';

export interface CreativeToolDefinitionMeta {
  name: CreativeToolName;
  riskTier: 1 | 2;
  description: string;
}

export const CREATIVE_TOOLS_DEFINITIONS: CreativeToolDefinitionMeta[] = [
  {
    name: 'generar_portada',
    riskTier: 2,
    description: 'Genera un lote de variantes de portada musical ancladas al contexto del release.',
  },
  {
    name: 'generar_copy',
    riskTier: 1,
    description: 'Redacta textos promocionales de campaña optimizados por fase (T-14 a T+7) y red social.',
  },
  {
    name: 'copiar_prompt',
    riskTier: 1,
    description: 'Compila y formatea un prompt maestro para su ejecución en Midjourney, Flux o Runway.',
  },
  {
    name: 'actualizar_prompt',
    riskTier: 2,
    description: 'Modifica directrices artísticas y texto del prompt maestro guardado en la base de datos.',
  },
  {
    name: 'listar_activos_aprobados',
    riskTier: 1,
    description: 'Consulta los activos multimedia aprobados en el vault junto con su hash SHA-256.',
  },
];

export interface CreativeToolsPorts {
  generateCoverBatch: (params: z.infer<typeof GenerarPortadaSchema>) => Promise<unknown>;
  generateCopy: (params: z.infer<typeof GenerarCopySchema>) => Promise<unknown>;
  copyPrompt: (params: z.infer<typeof CopiarPromptSchema>) => Promise<unknown>;
  updatePrompt: (params: z.infer<typeof ActualizarPromptSchema>) => Promise<unknown>;
  listApprovedAssets: (params: z.infer<typeof ListarActivosAprobadosSchema>) => Promise<unknown>;
}

export interface CreativeToolsBundle {
  generarPortada: ToolDefinition<typeof GenerarPortadaSchema>;
  generarCopy: ToolDefinition<typeof GenerarCopySchema>;
  copiarPrompt: ToolDefinition<typeof CopiarPromptSchema>;
  actualizarPrompt: ToolDefinition<typeof ActualizarPromptSchema>;
  listarActivosAprobados: ToolDefinition<typeof ListarActivosAprobadosSchema>;
}

/**
 * Functional factory generating standardized ToolDefinitions for the agent orchestrator.
 *
 * @param ports - Implementations of underlying creative domain workflows
 * @returns Fully typed dictionary of executable ToolDefinitions
 */
export function createCreativeTools(ports: CreativeToolsPorts): CreativeToolsBundle {
  return {
    generarPortada: {
      name: 'generar_portada',
      description: 'Genera un lote de portadas artísticas para el release',
      riskLevel: 'SENSITIVE',
      parameters: GenerarPortadaSchema,
      requiresConfirmationMessage: (p) =>
        `¿Deseas iniciar la generación de portadas para el release "${p.releaseId}" con ratio ${p.aspectRatio}?`,
      execute: async (params) => {
        // Step 1: Validate and execute cover batch port
        const parsed = GenerarPortadaSchema.parse(params);
        return await ports.generateCoverBatch(parsed);
      },
    },
    generarCopy: {
      name: 'generar_copy',
      description: 'Genera copy promocional por fase de lanzamiento',
      riskLevel: 'SAFE',
      parameters: GenerarCopySchema,
      execute: async (params) => {
        // Step 1: Validate and execute copy generator port
        const parsed = GenerarCopySchema.parse(params);
        return await ports.generateCopy(parsed);
      },
    },
    copiarPrompt: {
      name: 'copiar_prompt',
      description: 'Prepara el prompt maestro para la plataforma seleccionada',
      riskLevel: 'SAFE',
      parameters: CopiarPromptSchema,
      execute: async (params) => {
        // Step 1: Validate and compile prompt string
        const parsed = CopiarPromptSchema.parse(params);
        return await ports.copyPrompt(parsed);
      },
    },
    actualizarPrompt: {
      name: 'actualizar_prompt',
      description: 'Actualiza directrices de un prompt maestro en la base de datos',
      riskLevel: 'SENSITIVE',
      parameters: ActualizarPromptSchema,
      requiresConfirmationMessage: (p) =>
        `¿Confirmas la actualización de directrices para el prompt "${p.promptId}"?`,
      execute: async (params) => {
        // Step 1: Validate and execute update
        const parsed = ActualizarPromptSchema.parse(params);
        return await ports.updatePrompt(parsed);
      },
    },
    listarActivosAprobados: {
      name: 'listar_activos_aprobados',
      description: 'Lista entregables aprobados en el vault del release',
      riskLevel: 'SAFE',
      parameters: ListarActivosAprobadosSchema,
      execute: async (params) => {
        // Step 1: Query approved vault items
        const parsed = ListarActivosAprobadosSchema.parse(params);
        return await ports.listApprovedAssets(parsed);
      },
    },
  };
}
