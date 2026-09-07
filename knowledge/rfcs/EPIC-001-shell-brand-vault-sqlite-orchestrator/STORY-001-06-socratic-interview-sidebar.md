---
type: RFC
title: STORY-001-06 Entrevista Socrática de Marca y Asistente Lateral (Sidebar v1)
description: RFC Story — Asistente lateral interactivo con streaming, entrevista conversacional guiada y síntesis de manual de marca
tags: [rfc, story, frontend, ui, assistant, socratic, brand-vault, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-06-socratic-interview-sidebar

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-06-socratic-interview-sidebar`
- Mapping: `HU-1.2`, `HU-6.1 (v1)`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec06-socratic-interview-sidebar-v1`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
- Problem: Muchos artistas y sellos emergentes carecen de un manual de marca formal y les cuesta definir su estética visual, su narrativa sonora y su tono de voz en frío sobre un formulario vacío. Se necesita un asistente conversacional desplegable (Sidebar v1) capaz de conducir una entrevista guiada socrática (preguntas progresivas según el subgénero e influencias) y, al finalizar, estructurar y guardar automáticamente el perfil en el Brand Vault mediante Tool Calling.
- Why now: Culmina la Épica 1 conectando la UI con el motor de persistencia, el registro de IA y los contratos de herramientas seguras.
- Constraints:
  - Sidebar colapsable no invasivo (animado con Motion 12 / CSS performante sin bloqueos de repaint).
  - Streaming fluido mediante Vercel AI SDK `useChat` / `useAssistant`.
  - Inyección del system prompt especializado en inducción socrática de identidad musical.
  - Al completar la entrevista, invoca la tool `actualizar_marca_artista` (sujeta al guardrail de confirmación previa).
- Affected paths:
  - `apps/web/src/domain/agent/prompts/socratic-interview-prompt.ts`
  - `apps/web/src/application/assistant/use-assistant-stream.ts`
  - `apps/web/src/presentation/components/assistant/assistant-sidebar.tsx`
  - `apps/web/src/presentation/components/assistant/chat-message-list.tsx`
  - `apps/web/src/presentation/components/assistant/brand-interview-modal.tsx`
  - `tests/presentation/components/assistant-sidebar.test.tsx`

## Proposal
- Approach summary: Diseñar el componente lateral `AssistantSidebar` con un panel de mensajes con streaming y un modo específico para "Entrevista de Marca". Utiliza el `AiProviderRegistry` para consultar el modelo de razonamiento seleccionado.
- Technical design:
  ```typescript
  export interface AssistantMessage {
    id: string;
    role: 'user' | 'assistant' | 'system' | 'data';
    content: string;
    toolInvocations?: ToolInvocation[];
    createdAt: Date;
  }

  export const SOCRATIC_BRAND_SYSTEM_PROMPT = `
  Eres el Asistente Socrático de Identidad Musical de Indie-Sync Suite.
  Tu objetivo es ayudar al artista o sello a definir su manual de marca (estética, paleta cromática, influencias y tono de voz).
  Reglas:
  1. Haz una sola pregunta profunda por turno.
  2. Adapta tus sugerencias según el género y las referencias citadas.
  3. Cuando el usuario declare estar satisfecho, sintetiza la ficha conceptual y pide permiso para persistirla mediante la herramienta oficial.
  `;
  ```
- Alternatives considered:
  - Forzar al usuario a usar un formulario estático de 25 campos: Descartado por alta fricción de onboarding en perfiles artísticos.
- Tradeoffs: El streaming conversacional requiere manejo fino de renderizado para no saturar el Virtual DOM.

## Critique
- Reviewer(s): `frontend`, `architect`, `ponytail`
- Critical findings:
  1. El Sidebar debe ser accesible mediante atajo de teclado global (ej. `Cmd + K` o `Cmd + J`) y no romper el layout principal de la aplicación.
  2. En pantallas móviles o viewport estrecho, el Sidebar debe comportarse como un Drawer superpuesto a pantalla completa.
  3. `Ponytail Evaluation`: Usar `useChat` estándar de la librería oficial `ai/react`. No armar un gestor de estado Redux/Zustand personalizado para los mensajes; `useChat` ya resuelve buffering, reconexiones, abort controllers y streaming out-of-the-box.

## Resolution
- Final approach after critique: Implementación de drawer responsivo con Tailwind y `useChat` nativo del AI SDK.
- Changes accepted: Atajo de teclado accesible y soporte para pausar/reanudar entrevista.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Crear tests RED en `tests/presentation/components/assistant-sidebar.test.tsx`.

## Test and Validation Plan
- Unit tests: Verificación de renderizado de mensajes, badges de tool calls y apertura/cierre con atajos de teclado.
- Integration tests: Simulación de flujo de entrevista con mock del modelo y disparo del guardrail modal de guardado.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.2`, `HU-6.1`
- Branch: `SPEC/jaymusicmachine-EPIC-01-spec06-socratic-interview-sidebar-v1`
- Final commit hash(es): `TBD`
