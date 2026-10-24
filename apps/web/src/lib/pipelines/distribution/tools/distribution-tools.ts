/**
 * @file distribution-tools.ts
 * @layer Domain
 * @description Executable autonomous agent tools for multichannel social distribution
 *              and programmatic ad campaigns with Zod schema contracts and risk classification
 *              (SAFE Tier 1 vs SENSITIVE Tier 2 Guardrail). Pure factory pattern, zero classes.
 */

import { z } from 'zod';
import { ToolDefinition } from '../../agent/tools/tool-contract';
import { SocialPlatformSchema, AdPlatformSchema, BudgetUsdSchema } from '../distribution-schemas';

// ==============================================================================
// Step 1: Tool Schemas
// ==============================================================================

export const ProgramarPublicacionSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser un UUID válido'),
  platforms: z.array(SocialPlatformSchema).min(1, 'Debe seleccionar al menos una plataforma'),
  postText: z.string().min(1, 'El texto del post no puede estar vacío'),
  scheduledTime: z.string().datetime({ message: 'La fecha programada debe ser ISO-8601 UTC' }),
  assetId: z.string().uuid().optional(),
});

export const LanzarCampanaPautaSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser un UUID válido'),
  platform: AdPlatformSchema,
  budgetUsd: BudgetUsdSchema,
  destinationUrl: z.string().url('URL de destino debe ser válida'),
  targetAudience: z.string().min(3, 'Audiencia descriptiva obligatoria'),
  durationDays: z.number().int().min(1).max(30).default(5),
});

export const ConsultarCalendarioPostsSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser un UUID válido'),
});

export type DistributionToolName =
  | 'programar_publicacion'
  | 'lanzar_campana_pauta'
  | 'consultar_calendario_posts';

export interface DistributionToolDefinitionMeta {
  name: DistributionToolName;
  riskTier: 1 | 2;
  description: string;
}

export const DISTRIBUTION_TOOLS_DEFINITIONS: DistributionToolDefinitionMeta[] = [
  {
    name: 'programar_publicacion',
    riskTier: 1,
    description: 'Programa una publicación de contenido en uno o más canales sociales.',
  },
  {
    name: 'lanzar_campana_pauta',
    riskTier: 2,
    description: 'Activa una microcampaña publicitaria ($20–$100 USD) en Meta o TikTok Ads con Guardrail explícito.',
  },
  {
    name: 'consultar_calendario_posts',
    riskTier: 1,
    description: 'Consulta los posts agendados en el calendario de lanzamiento para un release.',
  },
];

export interface DistributionToolsPorts {
  schedulePost: (params: z.infer<typeof ProgramarPublicacionSchema>) => Promise<unknown>;
  launchAdCampaign: (params: z.infer<typeof LanzarCampanaPautaSchema>) => Promise<unknown>;
  getScheduledPosts: (params: z.infer<typeof ConsultarCalendarioPostsSchema>) => Promise<unknown>;
}

export interface DistributionToolsBundle {
  programarPublicacion: ToolDefinition<typeof ProgramarPublicacionSchema>;
  lanzarCampanaPauta: ToolDefinition<typeof LanzarCampanaPautaSchema>;
  consultarCalendarioPosts: ToolDefinition<typeof ConsultarCalendarioPostsSchema>;
}

/**
 * Functional factory generating standardized ToolDefinitions for the agent orchestrator.
 *
 * @param ports - Implementations of underlying distribution domain workflows
 * @returns Fully typed dictionary of executable ToolDefinitions
 */
export function createDistributionTools(ports: DistributionToolsPorts): DistributionToolsBundle {
  return {
    programarPublicacion: {
      name: 'programar_publicacion',
      description: 'Programa una publicación en redes sociales para el lanzamiento',
      riskLevel: 'SAFE',
      parameters: ProgramarPublicacionSchema,
      execute: async (params) => {
        // Step 1: Validate and execute schedule port
        const parsed = ProgramarPublicacionSchema.parse(params);
        return await ports.schedulePost(parsed);
      },
    },
    lanzarCampanaPauta: {
      name: 'lanzar_campana_pauta',
      description: 'Activa una microcampaña de anuncios pagados en Meta o TikTok Ads',
      riskLevel: 'SENSITIVE',
      parameters: LanzarCampanaPautaSchema,
      requiresConfirmationMessage: (p) =>
        `¿Confirmas la activación de la campaña en ${p.platform} con presupuesto de $${p.budgetUsd.toFixed(2)} USD por ${p.durationDays ?? 5} días?`,
      execute: async (params) => {
        // Step 1: Validate and execute ad campaign port
        const parsed = LanzarCampanaPautaSchema.parse(params);
        return await ports.launchAdCampaign(parsed);
      },
    },
    consultarCalendarioPosts: {
      name: 'consultar_calendario_posts',
      description: 'Consulta las publicaciones agendadas para un lanzamiento',
      riskLevel: 'SAFE',
      parameters: ConsultarCalendarioPostsSchema,
      execute: async (params) => {
        // Step 1: Validate and query posts
        const parsed = ConsultarCalendarioPostsSchema.parse(params);
        return await ports.getScheduledPosts(parsed);
      },
    },
  };
}
