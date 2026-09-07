---
type: RFC
title: STORY-001-05 HU-6.3 Protocolo de Acciones (Tool Calling), Guardrails y Action Log
description: RFC Story — Contratos de herramientas con JSON Schema, interceptor de guardrails con promesa suspendida y confirmación humana, y bitácora inmutable en SQLite
tags: [rfc, story, agent, tool-calling, guardrails, security, audit, human-in-the-loop, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-05-tool-calling-guardrails

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-05`
- Mapping: `HU-6.3`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Usuario operando mediante lenguaje natural con el asistente de la suite,
- **Quiero** que el agente cuente con herramientas delimitadas bajo contratos estrictos de JSON Schema y solicite confirmación explícita antes de ejecutar cualquier acción destructiva o de asignación de recursos,
- **Para que** no se borren datos de artistas, no se alteren calendarios de lanzamiento ni se incurra en gastos publicitarios por errores de interpretación, prompt injection o alucinaciones del modelo.

### Criterios de Aceptación Oficiales
1. Define el contrato base y catálogo extensible de herramientas ejecutables (`crear_artista`, `actualizar_marca_artista`, `consultar_marca`, `listar_artistas`) validadas con Zod y convertidas a JSON Schema.
2. Implementa una taxonomía de riesgo binaria: `SAFE` (lecturas y consultas que se ejecutan automáticamente) y `SENSITIVE` (mutaciones, borrados y cambios presupuestarios que requieren confirmación humana).
3. Intercepta toda invocación `SENSITIVE` suspendiendo la promesa de ejecución en el runtime y levantando un modal interactivo (`GuardrailModal`) en la interfaz. El modal renderiza un diff estructurado de parámetros JSON reales junto a la explicación del modelo (mitigando spoofing por prompt injection). El interceptor aplica un TTL estricto de 5 minutos (300,000ms) que rechaza automáticamente promesas abandonadas; la ejecución solo continúa con clic físico en "Aprobar", mientras que "Rechazar" o la expiración del TTL emite un feedback tipado al modelo sin romper la sesión.
4. Mantiene un registro de auditoría (*action log*) inmutable en la tabla `action_log` de SQLite con instantáneas completas de parámetros, usuario autorizador, estado de ejecución y marcas de tiempo UTC.

### Problem & Gap Analysis
Los agentes autónomos que ejecutan herramientas de forma desatendida representan un vector de riesgo crítico de integridad de datos. Una alucinación o una inyección de prompt maliciosa podría vaciar la base de datos o modificar presupuestos de anuncios. Esta historia establece un perímetro de contención estricto y gobernado con intervención humana en el bucle (*Human-in-the-Loop*).

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 5.1: Catálogo de Tools Seguras con JSON Schema
*Definición formal e interoperable de las capacidades ejecutables del agente.*
- **`SPEC-5.1.1` (Contratos Zod de Tools de Brand Vault)**:
  - *Problema*: Parámetros impredecibles o malformados generados por el LLM que podrían corromper la base de datos local.
  - *Solución*: Especificación formal con Zod para tools operativas (`crear_artista`, `actualizar_marca_artista`, `consultar_marca`). Cada tool declara su JSON Schema nativo compatible con Vercel AI SDK Core y tipado seguro de entrada y salida.
  - *Capa*: `Domain` (`apps/web/src/domain/agent/tools/brand-tools.ts`, `apps/web/src/domain/agent/tools/tool-contract.ts`).
  - *Tests RED*: `tests/domain/agent/brand-tools.test.ts` (validación de parámetros válidos y rechazo de inputs malformados).
- **`SPEC-5.1.2` (Clasificación de Riesgo de Herramientas)**:
  - *Problema*: Tratar de la misma forma una consulta inocua que una eliminación irreversible de datos o una alteración de identidad.
  - *Solución*: Metadato obligatorio en la definición de la tool: `riskLevel: 'SAFE' | 'SENSITIVE'`. Consultas y lecturas son `SAFE`; mutaciones de marca, borrados y cambios presupuestarios son `SENSITIVE`.
  - *Capa*: `Domain` (`apps/web/src/domain/agent/guardrails/risk-policy.ts`).
  - *Tests RED*: `tests/domain/agent/risk-policy.test.ts` (evaluación de políticas y categorización determinista).

### 🔹 FEATURE 5.2: Interceptor de Guardrails Human-in-the-Loop & Action Log
*Garantía de soberanía del usuario frente a alucinaciones del modelo.*
- **`SPEC-5.2.1` (Evaluador de Guardrail con Promesa Suspendida, Diff JSON y Modal en UI)**:
  - *Problema*: La IA podría ejecutar mutaciones críticas sin conocimiento del usuario, o un ataque de prompt injection indirecto podría hacer que el modelo describa una acción destructiva de forma engañosa o inocua. Además, cerrar la pestaña o abandonar el modal cuelga la promesa y genera memory leaks indefinidos.
  - *Solución*: `GuardrailInterceptor` que detecta invocaciones `SENSITIVE`, suspende la ejecución emitiendo un evento estructurado y administra un mapa `pendingConfirmations` protegido por un TTL estricto de 5 minutos (300,000ms). Si expira el TTL sin acción del usuario, rechaza automáticamente la promesa liberando memoria. El modal `GuardrailModal` renderiza de forma obligatoria un diff interactivo de parámetros JSON estructurados (`params_snapshot`) junto a la explicación del modelo, permitiendo al usuario verificar con precisión los datos que se alterarán antes de pulsar "Aprobar". Si rechaza o expira, envía un rechazo tipado al modelo sin abortar el flujo conversacional.
  - *Capa*: `Domain` / `Presentation` (`apps/web/src/domain/agent/guardrails/guardrail-interceptor.ts`, `apps/web/src/components/assistant/guardrail-modal.tsx`, `apps/web/src/application/agent/use-guardrail-confirmation.ts`).
  - *Tests RED*: `tests/domain/agent/guardrail-interceptor.test.ts` (suspensión de promesa, aprobación, rechazo, timeout TTL de 5 minutos y serialización de diff JSON).
- **`SPEC-5.2.2` (Repositorio Inmutable de Action Log en SQLite)**:
  - *Problema*: Falta de trazabilidad forense sobre qué herramientas ejecutó el agente y quién autorizó cada operación.
  - *Solución*: Tabla `action_log` en SQLite que registra `tool_name`, `params_snapshot`, `risk_level`, `status` (`REQUESTED`, `CONFIRMED`, `REJECTED`, `EXECUTED`, `FAILED`), timestamps y motivo de error si aplica.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/repositories/sqlite-action-log-repository.ts`).
  - *Tests RED*: `tests/infrastructure/db/action-log-repository.test.ts` (registro secuencial, inmutabilidad de logs).

### Esquema de la Tabla action_log y Contratos
```sql
CREATE TABLE IF NOT EXISTS action_log (
  id TEXT PRIMARY KEY,
  tool_name TEXT NOT NULL,
  params_snapshot TEXT NOT NULL,
  risk_level TEXT NOT NULL,
  status TEXT NOT NULL, -- REQUESTED, CONFIRMED, REJECTED, EXECUTED, FAILED
  confirmed_by TEXT,
  result_snapshot TEXT,
  error_message TEXT,
  created_at TEXT NOT NULL DEFAULT (datetime('now')),
  executed_at TEXT
);
CREATE INDEX IF NOT EXISTS idx_action_log_tool_created ON action_log(tool_name, created_at);
CREATE INDEX IF NOT EXISTS idx_action_log_status ON action_log(status);
```
```typescript
export type ToolRiskLevel = 'SAFE' | 'SENSITIVE';

export interface ToolDefinition<TParams extends z.ZodTypeAny, TResult> {
  name: string;
  description: string;
  parameters: TParams;
  riskLevel: ToolRiskLevel;
  requiresConfirmationMessage?: (params: z.infer<TParams>) => string;
  execute: (params: z.infer<TParams>, context: ExecutionContext) => Promise<TResult>;
}
```

---

## Critique
- **Reviewer(s)**: `security`, `architect`, `ponytail`
- **Critical findings**:
  1. *Bucle Infinito en Rechazo & Fuga de Memoria por TTL*: Si el usuario abandona el modal o cierra la ventana, la promesa suspendida causaría una fuga de memoria (hanging promise / memory leak). Se implementa un TTL estricto de 5 minutos (300,000ms) que auto-rechaza y purga la referencia del mapa. Si el usuario pulsa rechazar o vence el TTL, el runtime retorna `{ success: false, reason: "..." }` estructurado para que el modelo responda cordialmente y continúe el diálogo.
  2. *Spoofing / Prompt Injection en Explicación del Modal*: Un ataque de inyección de prompt podría inducir al modelo a redactar una justificación benigna mientras envía parámetros destructivos. El `GuardrailModal` no debe depender únicamente del texto en lenguaje natural del LLM: debe renderizar obligatoriamente un diff estructurado de parámetros JSON (`params_snapshot`) para verificación visual directa del humano.
  3. *Inmutabilidad del Log*: Los registros en `action_log` deben ser de solo inserción (*append-only*); no se permite `UPDATE` arbitrario fuera de la transición de estado.
  4. *Ponytail Lean Evaluation*:
     - La clasificación se modela con un union type simple `'SAFE' | 'SENSITIVE'` en lugar de un motor de políticas complejo como OPA (Open Policy Agent).
     - El modal de confirmación se implementa como componente React modal estándar en `apps/web/src/components/assistant/guardrail-modal.tsx` sin librerías externas de flujos de trabajo pesadas.

## Resolution
- Final approach after critique: Taxonomía binaria `SAFE | SENSITIVE`, canal de rechazo estructurado con TTL de 5 minutos contra memory leaks, renderizado de diff JSON en modal para mitigar prompt injection e inserción append-only en `action_log`.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED de interceptación de guardrails y suspensión de promesas en `guardrail-interceptor.test.ts`.
- Exit criteria: Modal interactivo bloqueante probado con diff JSON, TTL de 5m verificado y action log auditado en SQLite.

## Test and Validation Plan
- Unit tests: `tests/domain/agent/brand-tools.test.ts`, `tests/domain/agent/risk-policy.test.ts`, `tests/domain/agent/guardrail-interceptor.test.ts`.
- Integration tests: `tests/infrastructure/db/action-log-repository.test.ts`, `tests/components/guardrail-modal.test.tsx`.

## Traceability
- Related issue(s): `EPIC-01`, `HU-6.3`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
