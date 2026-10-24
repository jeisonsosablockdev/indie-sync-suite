/**
 * @file analytics-tools.ts
 * @layer Domain
 * @description Autonomous agent tools for unified analytics, ad efficiency inspection,
 *              and custom API dashboard creation with Zod contracts and risk tiers
 *              (SAFE Tier 1 vs SENSITIVE Tier 2 Guardrail). Pure factory pattern, zero classes.
 */

import { z } from 'zod';
import { ToolDefinition } from '../../agent/tools/tool-contract';
import { TimeWindowFilterSchema } from '../analytics-schemas';

// ==============================================================================
// Step 1: Tool Parameter Schemas
// ==============================================================================

export const ConsultarMetricasRendimientoSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser un UUID válido'),
  timeWindow: TimeWindowFilterSchema.default('ALL_TIME'),
});

export const AnalizarEficienciaPautaSchema = z.object({
  releaseId: z.string().uuid('ID de release debe ser un UUID válido'),
  totalSpendUsd: z.number().nonnegative('El gasto publicitario debe ser mayor o igual a 0'),
  conversions: z.number().int().nonnegative('Las conversiones deben ser un número entero no negativo'),
  totalClicks: z.number().int().nonnegative('Los clics deben ser un número entero no negativo'),
});

export const GenerarPanelCustomSchema = z.object({
  name: z.string().min(2, 'El nombre del panel debe tener al menos 2 caracteres'),
  endpointUrl: z.string().url('Debe ser una URL de endpoint HTTP(S) válida'),
  refreshIntervalSeconds: z.number().int().min(10).max(3600).default(60),
});

export type AnalyticsToolName =
  | 'consultar_metricas_rendimiento'
  | 'analizar_eficiencia_pauta'
  | 'generar_panel_custom';

export interface AnalyticsToolDefinitionMeta {
  name: AnalyticsToolName;
  riskTier: 1 | 2;
  description: string;
}

export const ANALYTICS_TOOLS_DEFINITIONS: AnalyticsToolDefinitionMeta[] = [
  {
    name: 'consultar_metricas_rendimiento',
    riskTier: 1,
    description: 'Consulta métricas consolidadas de reproducciones, oyentes y conversiones por ventana temporal.',
  },
  {
    name: 'analizar_eficiencia_pauta',
    riskTier: 1,
    description: 'Calcula CPA, CPC y tasa de conversión sobre presupuestos invertidos en campañas publicitarias.',
  },
  {
    name: 'generar_panel_custom',
    riskTier: 2,
    description: 'Configura un panel dinámico enlazado a un endpoint REST externo con Guardrail de confirmación.',
  },
];

export interface AnalyticsToolsPorts {
  getPerformanceMetrics: (params: z.infer<typeof ConsultarMetricasRendimientoSchema>) => Promise<unknown>;
  analyzeAdEfficiency: (params: z.infer<typeof AnalizarEficienciaPautaSchema>) => Promise<unknown>;
  createCustomDashboard: (params: z.infer<typeof GenerarPanelCustomSchema>) => Promise<unknown>;
}

export interface AnalyticsToolsBundle {
  consultarMetricasRendimiento: ToolDefinition<typeof ConsultarMetricasRendimientoSchema>;
  analizarEficienciaPauta: ToolDefinition<typeof AnalizarEficienciaPautaSchema>;
  generarPanelCustom: ToolDefinition<typeof GenerarPanelCustomSchema>;
}

/**
 * Functional factory generating standardized ToolDefinitions for unified analytics and dashboards.
 *
 * @param ports - Implementations of underlying analytics domain ports
 * @returns Fully typed dictionary of executable ToolDefinitions
 */
export function createAnalyticsTools(ports: AnalyticsToolsPorts): AnalyticsToolsBundle {
  return {
    consultarMetricasRendimiento: {
      name: 'consultar_metricas_rendimiento',
      description: 'Consulta métricas consolidadas de rendimiento para un lanzamiento',
      riskLevel: 'SAFE',
      parameters: ConsultarMetricasRendimientoSchema,
      execute: async (params) => {
        // Step 1: Validate parameters and query performance metrics
        const parsed = ConsultarMetricasRendimientoSchema.parse(params);
        return await ports.getPerformanceMetrics(parsed);
      },
    },
    analizarEficienciaPauta: {
      name: 'analizar_eficiencia_pauta',
      description: 'Calcula el retorno de inversión y CPA/CPC de campañas publicitarias',
      riskLevel: 'SAFE',
      parameters: AnalizarEficienciaPautaSchema,
      execute: async (params) => {
        // Step 1: Validate parameters and compute efficiency metrics
        const parsed = AnalizarEficienciaPautaSchema.parse(params);
        return await ports.analyzeAdEfficiency(parsed);
      },
    },
    generarPanelCustom: {
      name: 'generar_panel_custom',
      description: 'Crea un nuevo panel personalizado conectando un endpoint REST externo',
      riskLevel: 'SENSITIVE',
      parameters: GenerarPanelCustomSchema,
      requiresConfirmationMessage: (p) =>
        `¿Confirmas la creación del panel dinámico "${p.name}" conectado al endpoint "${p.endpointUrl}" con refresco cada ${p.refreshIntervalSeconds ?? 60}s?`,
      execute: async (params) => {
        // Step 1: Validate parameters and register custom dashboard
        const parsed = GenerarPanelCustomSchema.parse(params);
        return await ports.createCustomDashboard(parsed);
      },
    },
  };
}
