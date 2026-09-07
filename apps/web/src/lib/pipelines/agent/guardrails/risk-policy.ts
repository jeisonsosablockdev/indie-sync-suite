/**
 * @file risk-policy.ts
 * @layer Domain
 * @description Risk classification policy determining whether an action executes automatically or demands human sign-off.
 */

import { ToolRiskLevel } from '../tools/tool-contract';

const DEFAULT_SAFE_TOOLS = new Set([
  'consultar_marca',
  'listar_artistas',
  'consultar_lanzamientos',
  'consultar_estadisticas',
]);

const DEFAULT_SENSITIVE_TOOLS = new Set([
  'crear_artista',
  'actualizar_marca_artista',
  'eliminar_artista',
  'crear_lanzamiento',
  'asignar_presupuesto_campaña',
  'publicar_en_redes',
]);

/**
 * Evaluates the risk level of an agent tool call.
 *
 * @param toolName - Identifier of the requested tool
 * @param explicitRisk - Explicit riskLevel declared on the tool definition (takes precedence)
 * @returns 'SAFE' for read-only actions, 'SENSITIVE' for destructive or state-mutating actions
 */
export function evaluateToolRisk(
  toolName: string,
  explicitRisk?: ToolRiskLevel
): ToolRiskLevel {
  if (explicitRisk) {
    return explicitRisk;
  }

  if (DEFAULT_SAFE_TOOLS.has(toolName)) {
    return 'SAFE';
  }

  if (DEFAULT_SENSITIVE_TOOLS.has(toolName)) {
    return 'SENSITIVE';
  }

  // Fallback: Safe-by-default for queries, Sensitive for any mutative prefix
  const lower = toolName.toLowerCase();
  if (
    lower.startsWith('consultar') ||
    lower.startsWith('leer') ||
    lower.startsWith('obtener') ||
    lower.startsWith('get') ||
    lower.startsWith('list')
  ) {
    return 'SAFE';
  }

  return 'SENSITIVE';
}
