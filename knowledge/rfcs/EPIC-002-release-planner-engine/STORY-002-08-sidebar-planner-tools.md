---
type: RFC
title: STORY-002-08 HU-6.1 (v2) Tools de Planificación para el Asistente Lateral Operativo
description: RFC Story — Extensión del catálogo de herramientas del agente para consultar y manipular el cronograma de lanzamientos con clasificación de riesgo y guardrails.
tags: [rfc, story, agent-tools, planner-tools, assistant, guardrails]
timestamp: 2026-10-23T17:00:00Z
---

# STORY-002-08: Tools de Planificación para el Asistente Lateral Operativo

## Metadata
- Epic: `EPIC-002-release-planner-engine`
- Story ID: `STORY-002-08`
- Mapping: `HU-6.1 (v2)`
- Status: `approved`
- Current status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-02-release-planner-engine`
- Created: `2026-10-23`
- Last Updated: `2026-10-23`

---

## Context
### Historia de Usuario Oficial
- **Como** Usuario operando desde el chat lateral (`AssistantSidebar`),
- **Quiero** consultar y modificar el cronograma de lanzamientos mediante comandos en lenguaje natural,
- **Para que** agilice la planificación diaria sin tener que navegar por todos los menús y vistas del calendario.

### Criterios de Aceptación Oficiales
1. Incorpora al catálogo de herramientas del `AiProviderRegistry` 4 nuevas tools ejecutables con contratos Zod estrictos:
   - `crear_tarea`: Agenda una nueva tarea vinculada a una fase o hito.
   - `mover_fecha_lanzamiento`: Modifica la fecha objetivo $T-0$ de un release.
   - `consultar_gatekeepers`: Reporta el estado de los hitos críticos y bloqueos actuales.
   - `recalcular_cronograma`: Dispara el cálculo y previsualización de recálculo en cascada.
2. Clasificación estricta de riesgo:
   - `consultar_gatekeepers`: Clasificada como `SAFE` (auto-ejecución sin confirmación humana).
   - `crear_tarea`, `mover_fecha_lanzamiento`, `recalcular_cronograma`: Clasificadas como `SENSITIVE` (requieren confirmación humana mediante el `GuardrailModal` antes de mutar la base de datos).
3. Muestra tarjetas interactivas de previsualización en el chat lateral antes y después de aplicar cambios sobre las fechas en SQLite.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.8.1: Catálogo de Tools de Planificación con Clasificación de Riesgo
- **`SPEC-2.8.1.1` (Contratos Zod y Definición Funcional de Tools de Planificación)**:
  - *Solución*: Módulo funcional `planner-tools.ts` en Capa 3 que define los esquemas Zod y exporta la factory funcional `createPlannerTools(taskRepo, releaseRepo)` sin clases, retornando las 4 herramientas tipadas compatibles con Vercel AI SDK Core.
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/tools/planner-tools.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Instanciar tools con mocks de repositorios.
    - **Act**: Consultar tool `consultar_gatekeepers`.
    - **Assert**: Tiene `riskLevel === 'SAFE'` y ejecuta consulta de tareas bloqueadas retornando array.
- **`SPEC-2.8.1.2` (Integración de Tools SENSITIVE con GuardrailInterceptor)**:
  - *Solución*: Las herramientas `crear_tarea`, `mover_fecha_lanzamiento` y `recalcular_cronograma` declaran `riskLevel: 'SENSITIVE'` y proveen `requiresConfirmationMessage(params)` que genera el diff JSON estructurado y suspende la promesa hasta la aprobación en el `GuardrailModal`.
  - *Capa*: `Domain` / `Application` (`apps/web/src/lib/pipelines/planner/tools/planner-tools.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Invocación de `mover_fecha_lanzamiento` con nueva fecha.
    - **Act**: Evaluar con `GuardrailInterceptor`.
    - **Assert**: La promesa se suspende, se crea un `executionId` con TTL de 5 minutos y se emite evento de confirmación pendiente.

### 🔹 FEATURE 2.8.2: Renderizado de Tarjetas de Planificación en Chat & Inyección de Prompts
- **`SPEC-2.8.2.1` (Prompt Musical Especializado para el Asistente)**:
  - *Solución*: Constante `PLANNER_ASSISTANT_PROMPT` en Capa de Dominio con directrices para interpretar intenciones temporales de lanzamientos musicales, sugerir plantillas y advertir sobre el máster a $T-14$.
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/prompts/planner-assistant-prompt.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Importar `PLANNER_ASSISTANT_PROMPT`.
    - **Act**: Analizar contenido del string.
    - **Assert**: Contiene las directrices de ventanas de DSP de 7 días y la regla de no alterar fechas sin confirmación.
- **`SPEC-2.8.2.2` (Componente UI: PlannerToolCallBadge en AssistantSidebar)**:
  - *Solución*: Componente React accesible `PlannerToolCallBadge` integrado en el `ChatMessageList` para renderizar el badge de ejecución de tools de planificación con iconos temáticos y diff de fecha.
  - *Capa*: `Presentation` (`apps/web/src/components/assistant/planner-tool-badge.tsx`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Renderizar badge con tool call `mover_fecha_lanzamiento`.
    - **Act**: Renderizado en DOM.
    - **Assert**: Muestra badge con texto "Mover Fecha de Lanzamiento" y botón para ver detalles del cambio.

---

## Critique
- *¿Por qué no permitir que el agente mueva fechas automáticamente sin confirmación humana?*  
  Mover una fecha $T-0$ altera contratos con distribuidoras y campañas de marketing. Permitir mutaciones masivas de cronograma de forma no supervisada puede arruinar un lanzamiento; los guardrails humanos son estrictamente obligatorios para acciones `SENSITIVE`.

---

## Resolution
Se aprueba el catálogo de 4 tools agénticas con contratos Zod estrictos, clasificación `SAFE`/`SENSITIVE` y renderizado interactivo en el chat lateral.

---

## Decision
Adoptar factory funcional `createPlannerTools()` e integración obligatoria con `GuardrailInterceptor`.

---

## Status
- Status: `approved`
- Current status: `approved`

---

## Traceability
- Epic: [`EPIC-002-release-planner-engine/README.md`](./README.md)
- User Story: `HU-6.1 (v2)`
- Related PR(s): TBD
- Final commit hash(es): TBD
