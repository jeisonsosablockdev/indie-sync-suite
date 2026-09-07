---
type: RFC
title: STORY-001-06 HU-6.3 Protocolo de Acciones (Tool Calling), Guardrails y Action Log
description: RFC Story — Contratos de herramientas con JSON Schema, interceptor de guardrails con confirmación humana y bitácora inmutable
tags: [rfc, story, agent, tool-calling, guardrails, security, audit, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-06-hu-6-3-tool-calling-guardrails

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-06`
- Mapping: `HU-6.3`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec06-tool-calling-guardrails`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Usuario operando mediante lenguaje natural,
- **Quiero** que el asistente cuente con herramientas estrictamente delimitadas bajo JSON Schema y pida confirmación antes de cambios destructivos,
- **Para que** no se modifiquen presupuestos ni se eliminen tareas por errores de interpretación de la IA.

### Criterios de Aceptación Oficiales
1. Define el contrato base y catálogo extensible de tools ejecutables (`crear_artista`, `actualizar_marca`, etc.).
2. Exige confirmación explícita mediante botón o modal para acciones destructivas o cambios presupuestarios.
3. Mantiene un registro de auditoría (*action log*) de todas las acciones ejecutadas por el agente.

### Problem & Gap Analysis
Los agentes autónomos pueden alucinar intenciones y ejecutar comandos no deseados (ej. borrar artistas o modificar presupuestos de anuncios). Esta historia impone un perímetro de contención estricto y gobernado.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 6.1: Catálogo Tipado de Tools con JSON Schema y Niveles de Riesgo
*Definición formal e interoperable de herramientas.*
- **`SPEC-6.1.1` (Contratos Zod de Tools de Brand Vault)**:
  - *Problema*: Parámetros impredecibles del LLM que rompen los tipos de la aplicación.
  - *Solución*: Catálogo de herramientas (`crear_artista`, `actualizar_marca`, `listar_artistas`) tipadas con Zod y convertibles automáticamente a JSON Schema para Vercel AI SDK Core.
  - *Capa*: `Domain` (`apps/web/src/domain/agent/tools/brand-tools.ts`).
  - *Tests RED*: `tests/domain/agent/brand-tools.test.ts`.
- **`SPEC-6.1.2` (Clasificación Binaria de Riesgo de Herramientas)**:
  - *Problema*: Tratar de la misma forma una consulta inocua que una eliminación irreversible de datos.
  - *Solución*: Cada tool declara obligatoriamente su nivel de riesgo: `SAFE` (lectura o mutación no destructiva) o `SENSITIVE` (borrado, reseteo de claves, asignación presupuestaria).
  - *Capa*: `Domain` (`apps/web/src/domain/agent/guardrails/risk-policy.ts`).
  - *Tests RED*: `tests/domain/agent/risk-policy.test.ts`.

### 🔹 FEATURE 6.2: Interceptor de Guardrails Human-in-the-Loop y Action Log Inmutable
*Mecanismo de contención activa y trazabilidad forense.*
- **`SPEC-6.2.1` (Interceptor de Promesa Suspendida y Modal Interactivo)**:
  - *Problema*: El agente podría auto-aprobar acciones si no hay un bloqueo a nivel de runtime.
  - *Solución*: `GuardrailInterceptor` suspende la ejecución de cualquier tool `SENSITIVE`, emite el evento al frontend, presenta el `GuardrailModal` con descripción en lenguaje natural del cambio y requiere el clic físico del usuario para resolver o rechazar la promesa.
  - *Capa*: `Domain` / `Presentation` (`apps/web/src/domain/agent/guardrails/guardrail-interceptor.ts`, `apps/web/src/presentation/components/assistant/guardrail-modal.tsx`).
  - *Tests RED*: `tests/domain/agent/guardrail-interceptor.test.ts`.
- **`SPEC-6.2.2` (Repositorio Inmutable de Action Log en SQLite)**:
  - *Problema*: Falta de registro histórico de qué decisiones tomó el usuario frente a propuestas del agente.
  - *Solución*: Tabla `action_log` en SQLite que registra de forma inmutable cada invocación, parámetros, estado (`REQUESTED`, `CONFIRMED`, `REJECTED`, `EXECUTED`, `FAILED`) y marcas de tiempo UTC.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/db/repositories/sqlite-action-log-repository.ts`).
  - *Tests RED*: `tests/infrastructure/db/action-log-repository.test.ts`.

---

## Critique
- Reviewer(s): `security`, `architect`, `ponytail`
- Critical findings:
  1. Si el usuario hace clic en "Rechazar", el modelo debe recibir un feedback estructurado para no insistir en bucle sobre la misma tool call.
  2. `Ponytail Evaluation`: Clasificación con enum `SAFE | SENSITIVE`. Cero analizadores sintácticos de AST ni motores de políticas externos que introduzcan complejidad innecesaria.

## Resolution
- Final approach after critique: Canal de rechazo formal tipado que reanuda el chat informando al LLM que la acción fue denegada por el usuario.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED de interceptación y suspensión de promesas.

## Traceability
- Related issue(s): `EPIC-01`, `HU-6.3`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
