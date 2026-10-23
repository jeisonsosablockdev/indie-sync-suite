/**
 * @file risk-policy.test.ts
 * @layer Domain Test
 * @description Unit tests for agent tool risk evaluation.
 */

import { describe, test, expect } from 'vitest';
import { evaluateToolRisk } from '../../../apps/web/src/lib/pipelines/agent/guardrails/risk-policy';

describe('Tool Risk Policy Evaluation', () => {
  test('categorizes read-only query tools as "SAFE"', () => {
    expect(evaluateToolRisk('consultar_marca')).toBe('SAFE');
    expect(evaluateToolRisk('listar_artistas')).toBe('SAFE');
    expect(evaluateToolRisk('obtener_perfil')).toBe('SAFE');
  });

  test('categorizes mutating and budget-sensitive tools as "SENSITIVE"', () => {
    expect(evaluateToolRisk('crear_artista')).toBe('SENSITIVE');
    expect(evaluateToolRisk('actualizar_marca_artista')).toBe('SENSITIVE');
    expect(evaluateToolRisk('eliminar_artista')).toBe('SENSITIVE');
    expect(evaluateToolRisk('publicar_en_redes')).toBe('SENSITIVE');
  });

  test('respects explicit riskLevel overrides', () => {
    expect(evaluateToolRisk('custom_tool', 'SAFE')).toBe('SAFE');
    expect(evaluateToolRisk('consultar_marca', 'SENSITIVE')).toBe('SENSITIVE');
  });
});
