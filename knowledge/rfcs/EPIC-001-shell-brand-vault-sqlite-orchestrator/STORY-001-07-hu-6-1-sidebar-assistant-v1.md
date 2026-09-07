---
type: RFC
title: STORY-001-07 HU-6.1 (v1) Asistente Lateral Operativo con Tools de Brand Vault
description: RFC Story — Barra lateral retráctil conectada al AiProviderRegistry y ejecución en lenguaje natural de herramientas de marca
tags: [rfc, story, frontend, ui, assistant, sidebar, brand-vault, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-07-hu-6-1-sidebar-assistant-v1

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-07`
- Mapping: `HU-6.1 (v1)`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec07-sidebar-assistant-v1`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Usuario gestionando su sello y artistas,
- **Quiero** interactuar con un chat en la barra lateral para consultar o actualizar perfiles de marca y credenciales,
- **Para que** disponga de asistencia conversacional fluida desde el primer día de uso de la aplicación.

### Criterios de Aceptación Oficiales
1. Panel lateral retráctil conectado al `AiProviderRegistry` y al catálogo de tools de la HU-6.3.
2. Interpreta intenciones para leer y actualizar datos del Brand Vault en lenguaje natural.

### Problem & Gap Analysis
Sin una interfaz de asistencia omnipresente, el usuario tendría que navegar múltiples menús para realizar consultas u operaciones frecuentes. El Asistente Lateral ofrece un punto de contacto único y conversacional disponible en cualquier pantalla de la suite.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 7.1: Componente Lateral (Sidebar v1) Desplegable y Responsivo
*Interfaz accesible y no intrusiva con animaciones performantes.*
- **`SPEC-7.1.1` (Layout Colapsable con Motion 12 y Atajos de Teclado)**:
  - *Problema*: Paneles laterales rígidos que ocupan espacio permanente o no responden a atajos de teclado.
  - *Solución*: Componente `AssistantSidebar` con animación fluida mediante Motion 12, toggle con `Cmd+K` / `Cmd+J` y adaptación como Drawer superpuesto en resoluciones móviles (<768px).
  - *Capa*: `Presentation` (`apps/web/src/presentation/components/assistant/assistant-sidebar.tsx`).
  - *Tests RED*: `tests/presentation/components/assistant-sidebar.test.tsx`.
- **`SPEC-7.1.2` (Renderizador de Mensajes y Badges de Tool Calls)**:
  - *Problema*: Falta de visibilidad de las acciones que el modelo está ejecutando mientras genera texto.
  - *Solución*: `ChatMessageList` con soporte para streaming markdown, burbujas diferenciadas por rol e insignias interactivas que reflejan el estado de la tool call (`Solicitada`, `Aprobada`, `Ejecutada`).
  - *Capa*: `Presentation` (`apps/web/src/presentation/components/assistant/chat-message-list.tsx`).
  - *Tests RED*: `tests/presentation/components/chat-message-list.test.tsx`.

### 🔹 FEATURE 7.2: Conexión con AiProviderRegistry y Ejecución de Tools
*Integración del runtime agéntico con la base de datos local.*
- **`SPEC-7.2.1` (Integración con useChat de Vercel AI SDK Core)**:
  - *Problema*: Complejidad al manejar reconexiones, buffering de streaming y abort controllers de forma manual.
  - *Solución*: Hook `useAssistantStream` basado en el estándar `useChat` de `@ai-sdk/react`, conectado al endpoint local de streaming y al `AiProviderRegistry`.
  - *Capa*: `Application` (`apps/web/src/application/assistant/use-assistant-stream.ts`).
  - *Tests RED*: `tests/application/assistant/use-assistant-stream.test.ts`.
- **`SPEC-7.2.2` (Enrutador de Intenciones en Lenguaje Natural)**:
  - *Problema*: Ambigüedad al solicitar consultas de marca ("muéstrame la paleta de Synthwave Project").
  - *Solución*: Inyección de herramientas de Brand Vault en el stream del modelo (`consultar_marca`, `actualizar_marca_artista`) con resolución automática y respuesta formateada.
  - *Capa*: `Domain` (`apps/web/src/domain/agent/intent-router.ts`).
  - *Tests RED*: `tests/domain/agent/intent-router.test.ts`.

---

## Critique
- Reviewer(s): `frontend`, `architect`, `ponytail`
- Critical findings:
  1. El Sidebar no debe bloquear los clics en el resto de la aplicación cuando está abierto en pantallas de escritorio.
  2. `Ponytail Evaluation`: Usar Tailwind CSS para el posicionamiento (`fixed right-0 top-0 h-full`) y transiciones Motion 12 mínimas. Cero librerías externas de paneles o dock managers.

## Resolution
- Final approach after critique: Sidebar desacoplado del flujo de maquetación del contenido principal en desktop y drawer modal en móvil.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED del Sidebar con Testing Library.

## Traceability
- Related issue(s): `EPIC-01`, `HU-6.1`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
