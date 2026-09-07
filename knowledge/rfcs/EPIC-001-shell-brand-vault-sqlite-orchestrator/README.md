---
type: RFC
title: EPIC-001 Shell Base, Bóveda de Identidad (Brand Vault), SQLite Core y Contrato del Orquestador
description: RFC Epic README — metadata, scope, success criteria, story index, decision log, risks, and traceability
tags: [rfc, epic, governance, documentation, sqlite, brand-vault, byok, agent]
timestamp: 2026-09-07T00:00:00Z
---

# EPIC-001-shell-brand-vault-sqlite-orchestrator

## Metadata
- Epic ID: `EPIC-001`
- Title: `Shell Base, Bóveda de Identidad (Brand Vault), SQLite Core y Contrato del Orquestador`
- Status: `approved`
- Owner: `jaymusicmachine`
- Spec owner slice: `epic/jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Scope
- Problem statement: Falta de infraestructura de datos relacional local (SQLite), gestión segura de credenciales BYOK para IA, bóveda de marca (Brand Vault) y runtime agéntico con guardrails operacionales para sellos y artistas independientes.
- Business goal: Proveer a creadores y sellos una aplicación de escritorio/web privada, rápida y offline-first que unifique la identidad de marca de sus artistas, minimice costos de API mediante BYOK y permita una gestión de campañas musicales con control total.
- Technical goal: Construir la persistencia relacional SQLite con tabla outbox (`cloud_sync_queue`), almacenamiento de claves en el Keychain del sistema operativo (`keyring-rs`), registro de modelos IA agéntico unificado (`AiProviderRegistry`), contratos de Tool Calling con esquemas JSON y validación interactiva, y asistente lateral (Sidebar v1).
- Out of scope: Sincronización remota en vivo con Postiz Cloud (se implementa en la Épica 4), generación multimedia avanzada en lote (Épica 3) y analítica de streaming de DSPs (Épica 5).

## Success Criteria
- [ ] Esquema relacional SQLite con tablas de Sello, Artista, Lanzamiento, Fases, Tareas y `cloud_sync_queue` probado con 100% de integridad referencial.
- [ ] Módulo BYOK con almacenamiento cifrado/keychain y verificación activa de conectividad funcional para OpenAI, Anthropic y Gemini.
- [ ] CRUD y visualizador de perfiles de Sello y Artista (Brand Vault) funcional con paletas de color, tipografías y tono de voz.
- [ ] Registro agéntico `AiProviderRegistry` operativo sobre Vercel AI SDK Core.
- [ ] Contrato de Tool Calling con validación estricta y modal de guardrail para acciones destructivas o de presupuesto.
- [ ] Flujo de entrevista socrática de contexto (Brand Interview) y Sidebar agéntico v1 integrados.

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-001-01 | HU-1.1 Configuración Bóveda Sello y Artista | `STORY-001-01-hu-1-1-brand-vault-setup.md` | `approved` | `TBD` | Brand Vault CRUD |
| STORY-001-02 | HU-1.2 Entrevista Guiada de Contexto | `STORY-001-02-hu-1-2-brand-interview.md` | `approved` | `TBD` | Brand Interview Socrático |
| STORY-001-03 | HU-1.3 Gestión Segura de Credenciales (BYOK) | `STORY-001-03-hu-1-3-byok-credentials.md` | `approved` | `TBD` | OS Keychain & Fallback |
| STORY-001-04 | HU-1.5 Verificación de Estado y Cuotas BYOK | `STORY-001-04-hu-1-5-byok-health-quotas.md` | `approved` | `TBD` | Health Checks & Rate Limits |
| STORY-001-05 | HU-1.6 Esquema SQLite Core y Outbox Queue | `STORY-001-05-hu-1-6-sqlite-core-outbox.md` | `approved` | `TBD` | Persistencia Relacional Local |
| STORY-001-06 | HU-6.3 Tool Calling, Guardrails y Action Log | `STORY-001-06-hu-6-3-tool-calling-guardrails.md` | `approved` | `TBD` | Human-in-the-Loop & Audit Log |
| STORY-001-07 | HU-6.1 (v1) Asistente Lateral Operativo | `STORY-001-07-hu-6-1-sidebar-assistant-v1.md` | `approved` | `TBD` | Sidebar con Tools de Marca |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-09-07 | STORY-001-05 | Descartar Plane e implementar SQLite nativo local en Tauri/Next.js con Outbox Pattern | jaymusicmachine | [STORY-001-05-hu-1-6-sqlite-core-outbox.md](./STORY-001-05-hu-1-6-sqlite-core-outbox.md) |
| 2026-09-07 | STORY-001-03 | Adoptar OS Keychain con fallback AES-256-GCM para CI en lugar de texto plano | jaymusicmachine | [STORY-001-03-hu-1-3-byok-credentials.md](./STORY-001-03-hu-1-3-byok-credentials.md) |
| 2026-09-07 | STORY-001-01 | Usar input nativo de color HTML5 + regex Zod sin paquetes de picker de terceros | jaymusicmachine | [STORY-001-01-hu-1-1-brand-vault-setup.md](./STORY-001-01-hu-1-1-brand-vault-setup.md) |
| 2026-09-07 | STORY-001-04 | Sondeo lightweight HTTP con timeout de 3500ms para no consumir tokens en health checks | jaymusicmachine | [STORY-001-04-hu-1-5-byok-health-quotas.md](./STORY-001-04-hu-1-5-byok-health-quotas.md) |
| 2026-09-07 | STORY-001-06 | Exigir confirmación modal interactiva previa para toda tool destructiva o de presupuesto | jaymusicmachine | [STORY-001-06-hu-6-3-tool-calling-guardrails.md](./STORY-001-06-hu-6-3-tool-calling-guardrails.md) |
| 2026-09-07 | STORY-001-07 | Delegar gestión de mensajes y streaming al hook oficial `useChat` de `ai/react` | jaymusicmachine | [STORY-001-07-hu-6-1-sidebar-assistant-v1.md](./STORY-001-07-hu-6-1-sidebar-assistant-v1.md) |

## Risks and Dependencies
- Risks: Variaciones de compatibilidad en el OS Keychain (`keyring-rs`) entre macOS, Linux y Windows en desarrollo headless/CI.
- Dependencies: Disponibilidad de `better-sqlite3` en Node.js local y `sqlite` nativo en Tauri 2.0.
- Mitigations: Implementar un adaptador de fallback cifrado con clave derivada de entorno en entornos CI/headless donde el Keychain del SO no esté presente.

## Open Questions
- [x] ¿Cómo gestionar la migración automática de esquemas SQLite en actualizaciones de la app Tauri? -> *Resuelto: Migrador DDL lineal en el inicio de la app.*
- [x] ¿Cuál será el modelo por defecto sugerido en el wizard si el usuario configura múltiples llaves? -> *Resuelto: Gemini 2.0 Flash / Claude 3.7 como primarios.*

## Traceability
- Issue(s): `EPIC-01`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
