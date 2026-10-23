---
type: RFC
title: STORY-001-06 HU-1.2/6.1 Asistente Lateral Operativo y Entrevista Socrática de Marca
description: RFC Story — Barra lateral retráctil animada con Motion 12, chat agéntico con streaming y motor socrático de onboarding para síntesis guiada de identidad musical
tags: [rfc, story, frontend, ui, assistant, sidebar, socratic, brand-interview, motion, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-06-socratic-interview-sidebar

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-06`
- Mapping: `HU-1.2/6.1`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Creador o Artista musical independiente,
- **Quiero** interactuar con un asistente conversacional lateral permanente (Sidebar v1) y responder a una entrevista guiada socrática adaptativa,
- **Para que** pueda definir y sintetizar la identidad estética, conceptual y sonora de mi proyecto musical de forma asistida y persistirla en la bóveda de marca sin fricción.

### Criterios de Aceptación Oficiales
1. Desarrolla un componente lateral retráctil (`AssistantSidebar`) animado con Motion 12, toggleable mediante atajos de teclado (`Cmd+K` / `Cmd+J`) o botón flotante, con adaptación como Drawer de pantalla completa en pantallas móviles (<768px).
2. Renderiza la conversación en streaming mediante burbujas diferenciadas por rol e insignias interactivas (*badges*) que indican el estado en tiempo real de cada llamada a tool (`Solicitada`, `Aprobada`, `Ejecutada`).
3. Implementa el System Prompt socrático adaptativo (`SOCRATIC_BRAND_SYSTEM_PROMPT`) que indaga de forma iterativa (una pregunta a la vez) sobre referencias cinematográficas, estéticas y musicales.
4. Al finalizar la entrevista, sintetiza un perfil estructurado conforme a `ArtistProfileSchema` y dispara automáticamente la tool `actualizar_marca_artista`, activando el `GuardrailModal` para aprobación con un clic antes de guardar en SQLite.

### Problem & Gap Analysis
Los creadores musicales a menudo carecen de un manual formal de marca y se sienten bloqueados ante formularios vacíos y estáticos. Además, la falta de una consola conversacional omnipresente obliga a navegar múltiples menús. Esta historia unifica la asistencia conversacional lateral con un flujo socrático de inducción de marca.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 6.1: Componente Lateral (Sidebar v1) Desplegable y Responsivo
*Consola conversacional accesible sin interrumpir el flujo principal de trabajo.*
- **`SPEC-6.1.1` (Layout y Drawer de Sidebar con Atajos de Teclado)**:
  - *Problema*: Paneles laterales rígidos que rompen la maquetación o son inaccesibles en dispositivos táctiles.
  - *Solución*: Componente `AssistantSidebar` animado con Motion 12 (`animate={{ x: isOpen ? 0 : '100%' }}`), soporte de teclado accesible (`Cmd+K` / `Cmd+J`) y modo Drawer en móviles respetando `prefers-reduced-motion`. Su estado reactivo se gestiona mediante el hook desacoplado en Capa 2 (Application).
  - *Capa*: `Presentation` / `Application` (`apps/web/src/components/assistant/assistant-sidebar.tsx`, `apps/web/src/application/assistant/use-sidebar-toggle.ts`).
  - *Tests RED*: `tests/components/assistant-sidebar.test.tsx` (comportamiento de toggle, atajos de teclado y accesibilidad).
- **`SPEC-6.1.2` (Renderizador de Mensajes y Badges de Tool Calls)**:
  - *Problema*: Falta de visibilidad de lo que ocurre tras bambalinas cuando el modelo invoca herramientas.
  - *Solución*: `ChatMessageList` con renderizado markdown de streaming, roles diferenciados y badges visuales semánticos (`tool-call-badge.tsx`) con estados en vivo.
  - *Capa*: `Presentation` (`apps/web/src/components/assistant/chat-message-list.tsx`, `apps/web/src/components/assistant/tool-call-badge.tsx`).
  - *Tests RED*: `tests/components/chat-message-list.test.tsx` (renderizado de chunks de streaming y badges).

### 🔹 FEATURE 6.2: Motor de Entrevista Socrática de Marca (Brand Interview)
*Metodología conversacional para extraer la esencia estética y conceptual del músico.*
- **`SPEC-6.2.1` (System Prompt Socrático e Inyección de Contexto Musical)**:
  - *Problema*: Prompts genéricos que producen eslóganes vacíos de marketing sin conexión con la subcultura del artista.
  - *Solución*: System prompt socrático (`socratic-interview-prompt.ts`) con directrices estrictas: realizar una sola pregunta profunda a la vez, conectar subgéneros con paletas de color y sugerir arquetipos de tono.
  - *Capa*: `Domain` (`apps/web/src/domain/agent/prompts/socratic-interview-prompt.ts`).
  - *Tests RED*: `tests/domain/agent/socratic-prompt.test.ts` (verificación de restricciones y no alucinación).
- **`SPEC-6.2.2` (Síntesis de Ficha y Disparo Automatizado de Guardrail)**:
  - *Problema*: Perder el progreso de la conversación al cerrar la ventana o requerir copiar y pegar manualmente datos estructurados.
  - *Solución*: Orquestador que detecta la conclusión de la entrevista, extrae el perfil de marca en JSON conforme a `ArtistProfileSchema`, e invoca la tool `actualizar_marca_artista`, activando el `GuardrailModal` para que el usuario guarde con un clic en SQLite.
  - *Capa*: `Application` (`apps/web/src/application/assistant/brand-interview-orchestrator.ts`, `apps/web/src/application/assistant/use-assistant-stream.ts`).
  - *Tests RED*: `tests/application/assistant/brand-interview-orchestrator.test.ts` (flujo end-to-end de sintetizado y guardado con guardrail).

### Reglas del Prompt Socrático de Marca
```typescript
export const SOCRATIC_BRAND_SYSTEM_PROMPT = `
Eres el Director Creativo de Indie-Sync Suite. Tu misión es entrevistar al artista para destilar su identidad de marca única.

REGLAS DE ORO:
1. Haz UNA SOLA pregunta reflexiva a la vez. No abraces al usuario con listas de preguntas.
2. Indaga en tres dimensiones: Sonido (influencias, texturas), Visión (paletas, texturas, cine) y Narrativa (valores, tono, mensaje).
3. Si el usuario duda, ofrece dos caminos alternativos sugeridos según su género musical.
4. Cuando el usuario exprese satisfacción con la visión acumulada, sintetiza el Brand Vault final e invoca la herramienta 'actualizar_marca_artista'.
`;
```

---

## Critique
- **Reviewer(s)**: `frontend`, `architect`, `ponytail`
- **Critical findings**:
  1. *Aislamiento del Scroll*: El drawer lateral debe atrapar el foco y prevenir el scroll del body en pantallas móviles para evitar comportamientos erráticos en iOS/Android.
  2. *Respeto de Reduced Motion*: La animación de apertura debe desactivarse si el sistema operativo reporta `prefers-reduced-motion: reduce`.
  3. *Ponytail Lean Evaluation*:
     - Reutilización de Motion 12 ya instalado en lugar de paquetes de drawer externos (`vaul` o similares).
     - Delegación de la lógica de mensajes a `useChat` de `@ai-sdk/react`. Cero stores de Zustand o Redux adicionales para el chat.

## Resolution
- Final approach after critique: Sidebar con Motion 12, atajos de teclado accesibles y orquestación directa con Vercel AI SDK Core y el GuardrailModal.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED del Sidebar con Testing Library y del System Prompt socrático.
- Exit criteria: Sidebar interactivo operativo en desktop y móvil con entrevista socrática conectada a tools de Brand Vault.

## Test and Validation Plan
- Unit tests: `tests/domain/agent/socratic-prompt.test.ts`, `tests/components/assistant-sidebar.test.tsx`.
- Integration tests: `tests/components/chat-message-list.test.tsx`, `tests/application/assistant/brand-interview-orchestrator.test.ts`.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.2`, `HU-6.1`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
