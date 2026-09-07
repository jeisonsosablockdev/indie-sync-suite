---
type: RFC
title: STORY-001-05 Protocolo de Acciones (Tool Calling), Guardrails y Action Log
description: RFC Story — Contratos de herramientas con JSON Schema, guardrails interactivos de confirmación humana y log inmutable de auditoría
tags: [rfc, story, agent, tool-calling, guardrails, security, audit, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-05-tool-calling-guardrails

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-05-tool-calling-guardrails`
- Mapping: `HU-6.3`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec05-tool-calling-guardrails-action-log`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
- Problem: Cuando un agente de IA interactúa en lenguaje natural para operar la suite, una alucinación o mala interpretación del modelo podría borrar artistas, alterar cronogramas o disparar gastos publicitarios no deseados. Se necesita un sistema riguroso de guardrails donde toda acción clasificada como destructiva o de presupuesto requiera confirmación explícita del usuario en UI (Human-in-the-Loop) antes de ejecutarse, y quede registrada en una bitácora inmutable de auditoría (*action log*).
- Why now: Es la salvaguarda de seguridad operativa exigida antes de conectar tools en el asistente conversacional.
- Constraints:
  - Definición de tools con tipado estricto Zod y JSON Schema estándar.
  - Clasificación binaria de riesgo: `SAFE` (lectura o mutación inocua) vs `SENSITIVE` (mutación destructiva, borrado, modificación de presupuesto).
  - Bloqueo de ejecución asíncrona hasta recepción de confirmación del usuario para tools `SENSITIVE`.
  - Registro de auditoría persistido en SQLite con estado `REQUESTED`, `CONFIRMED`, `REJECTED`, `EXECUTED`, `FAILED`.
- Affected paths:
  - `apps/web/src/domain/agent/tools/tool-contract.ts`
  - `apps/web/src/domain/agent/guardrails/guardrail-interceptor.ts`
  - `apps/web/src/infrastructure/db/repositories/sqlite-action-log-repository.ts`
  - `apps/web/src/presentation/components/assistant/guardrail-modal.tsx`
  - `tests/domain/agent/tool-guardrails.test.ts`

## Proposal
- Approach summary: Interceptor de tool calls en la capa de dominio que evalúa la metadata de riesgo de la tool. Si es `SENSITIVE`, suspende la ejecución, emite un evento a la UI para mostrar el modal de aprobación y solo reanuda al recibir la firma de confirmación humana.
- Technical design:
  ```typescript
  import { z } from 'zod';

  export type ToolRiskLevel = 'SAFE' | 'SENSITIVE';

  export interface ToolDefinition<TParams extends z.ZodTypeAny, TResult> {
    name: string;
    description: string;
    parameters: TParams;
    riskLevel: ToolRiskLevel;
    requiresConfirmationMessage?: (params: z.infer<TParams>) => string;
    execute: (params: z.infer<TParams>, context: ExecutionContext) => Promise<TResult>;
  }

  export interface ActionLogRecord {
    id: string;
    toolName: string;
    paramsSnapshot: string; // JSON
    riskLevel: ToolRiskLevel;
    status: 'REQUESTED' | 'CONFIRMED' | 'REJECTED' | 'EXECUTED' | 'FAILED';
    confirmedBy?: string;
    resultSnapshot?: string;
    errorMessage?: string;
    createdAt: string;
    executedAt?: string;
  }
  ```
- Alternatives considered:
  - Permitir a la IA auto-confirmar si su "confianza" es >90%: Descartado categóricamente. Viola el principio de soberanía del usuario y seguridad de sistemas agénticos.
- Tradeoffs: Introduce una pausa en el streaming de la conversación mientras el usuario aprueba en el modal.

## Critique
- Reviewer(s): `security`, `architect`, `ponytail`
- Critical findings:
  1. El modal debe mostrar los parámetros formateados de forma legible para humanos (ej. "Vas a eliminar el Artista: Synthwave Project", no un volcado JSON crudo).
  2. Si el usuario rechaza la acción, el modelo debe recibir un mensaje formal de rechazo para que pueda replantear su respuesta en la conversación sin crashear el chat.
  3. `Ponytail Evaluation`: Guardrails simples y directos basados en metadata de la tool. Cero motores de reglas complejos con DSLs externos; un simple booleano o enum de nivel de riesgo en la definición de la tool es 100% suficiente y no tiene deuda.

## Resolution
- Final approach after critique: Hook reactivo `useGuardrailConfirmation` que maneja el ciclo de vida de la promesa suspendida.
- Changes accepted: Mensajes de explicación humana en español e inglés generados por el evaluador de riesgo.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Crear tests RED en `tests/domain/agent/tool-guardrails.test.ts`.

## Test and Validation Plan
- Unit tests: Ejecución automática de tools `SAFE`; interceptación y retención de tools `SENSITIVE`; transición de estado en el `ActionLogRepository` ante confirmación y rechazo.
- Integration tests: Verificación de persistencia en SQLite de registros de auditoría y emisión de eventos de socket/estado a la UI.

## Traceability
- Related issue(s): `EPIC-01`, `HU-6.3`
- Branch: `SPEC/jaymusicmachine-EPIC-01-spec05-tool-calling-guardrails-action-log`
- Final commit hash(es): `TBD`
