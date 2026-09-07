---
type: RFC
title: STORY-001-02 HU-1.2 Entrevista Guiada de Contexto (Brand Interview)
description: RFC Story — Asistente socrático adaptativo para inducción de identidad musical y síntesis persistente de marca
tags: [rfc, story, agent, socratic, interview, brand-vault, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-02-hu-1-2-brand-interview

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-02`
- Mapping: `HU-1.2`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec02-brand-interview`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Creador o Artista independiente,
- **Quiero** responder a un cuestionario adaptativo conducido por el agente conversacional,
- **Para que** pueda estructurar la identidad conceptual de mi proyecto musical cuando no tengo claro cómo definirla por mi cuenta.

### Criterios de Aceptación Oficiales
1. El agente realiza preguntas iterativas basadas en el subgénero seleccionado utilizando el `AiProviderRegistry` local.
2. Ofrece sugerencias de tono, estética y conceptos sonoros ante respuestas incompletas.
3. Genera y guarda un documento consolidado de marca al finalizar la sesión.

### Problem & Gap Analysis
Los creadores musicales suelen sentirse abrumados al enfrentarse a formularios de configuración de marca estáticos y vacíos. Esta historia proporciona una experiencia de onboarding guiada e interactiva que convierte una conversación natural en datos estructurados inmutables.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.1: Motor Conversacional Socrático Musical
*Pipeline adaptativo de preguntas y sugerencias impulsado por LLM local.*
- **`SPEC-2.1.1` (System Prompt Socrático Adaptativo)**:
  - *Problema*: Respuestas genéricas de IA que no capturan la especificidad de subgéneros musicales underground o alternativos.
  - *Solución*: System prompt socrático con reglas que fuerzan a realizar una sola pregunta profunda a la vez, indagando en referencias visuales (cinematográficas, pictóricas) y sonoras.
  - *Capa*: `Domain` (`apps/web/src/domain/agent/prompts/socratic-interview-prompt.ts`).
  - *Tests RED*: `tests/domain/agent/socratic-prompt.test.ts`.
- **`SPEC-2.1.2` (Streaming Conversacional con Vercel AI SDK Core)**:
  - *Problema*: Latencia de espera en la generación de respuestas extensas que degrada la experiencia del chat.
  - *Solución*: Implementación de `streamText` sobre el proveedor resuelto por el `AiProviderRegistry` emitiendo SSE en tiempo real.
  - *Capa*: `Application` (`apps/web/src/application/assistant/use-assistant-stream.ts`).
  - *Tests RED*: `tests/application/assistant/stream-adapter.test.ts`.

### 🔹 FEATURE 2.2: Síntesis de Ficha y Disparo Automatizado de Guardrail
*Consolidación del diálogo en una entidad de marca persistente en SQLite.*
- **`SPEC-2.2.1` (Extractor de JSON Estructurado de Marca)**:
  - *Problema*: La información en texto libre del chat no puede consumirse directamente por los generadores de la Épica 3.
  - *Solución*: Parser que sintetiza el diálogo acumulado en un objeto estricto conforme a `ArtistProfileSchema`.
  - *Capa*: `Domain` (`apps/web/src/domain/agent/synthesis/brand-synthesizer.ts`).
  - *Tests RED*: `tests/domain/agent/brand-synthesizer.test.ts`.
- **`SPEC-2.2.2` (Disparo de Tool Call y Persistencia con Confirmación)**:
  - *Problema*: Guardar datos en la base sin confirmación del usuario viola las políticas de seguridad agéntica.
  - *Solución*: La IA invoca la tool `actualizar_marca_artista`, la cual detiene la ejecución, muestra la ficha consolidada en el `GuardrailModal` y solo persiste al recibir el clic físico del usuario.
  - *Capa*: `Application` (`apps/web/src/application/assistant/brand-interview-orchestrator.ts`).
  - *Tests RED*: `tests/application/assistant/brand-interview-orchestrator.test.ts`.

---

## Critique
- Reviewer(s): `architect`, `security`, `ponytail`
- Critical findings:
  1. Si la llamada al LLM falla a mitad de la entrevista, el historial de conversación no debe perderse.
  2. `Ponytail Evaluation`: Usar el hook oficial `useChat` de `ai/react` para gestionar el estado de los mensajes. Cero stores Redux/Zustand personalizados para el chat.

## Resolution
- Final approach after critique: El historial de la entrevista se persiste en SQLite como borrador temporal para permitir pausar y reanudar.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED del System Prompt socrático.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.2`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
