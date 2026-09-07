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
- Status: `draft`
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
| STORY-001-01 | Kickoff y Sustrato Determinista | `STORY-001-01-kickoff.md` | `draft` | `TBD` | Hito 1.A de la Épica 1 |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-09-07 | STORY-001-01 | Descartar Plane e implementar SQLite nativo local en Tauri/Next.js con Outbox Pattern | jaymusicmachine | [STORY-001-01-kickoff.md](./STORY-001-01-kickoff.md) |
| 2026-09-07 | STORY-001-01 | Adoptar Vercel AI SDK Core como abstracción unificada para el AiProviderRegistry multi-modelo | jaymusicmachine | [STORY-001-01-kickoff.md](./STORY-001-01-kickoff.md) |

## Risks and Dependencies
- Risks: Variaciones de compatibilidad en el OS Keychain (`keyring-rs`) entre macOS, Linux y Windows en desarrollo headless/CI.
- Dependencies: Disponibilidad de `better-sqlite3` en Node.js local y `sqlite` nativo en Tauri 2.0.
- Mitigations: Implementar un adaptador de fallback cifrado con clave derivada de entorno en entornos CI/headless donde el Keychain del SO no esté presente.

## Open Questions
- [ ] ¿Cómo gestionar la migración automática de esquemas SQLite en actualizaciones de la app Tauri? (Se propone ejecutar migraciones DDL secuenciales en el inicio de la app).
- [ ] ¿Cuál será el modelo por defecto sugerido en el wizard si el usuario configura múltiples llaves? (Se propone Gemini / Claude como primarios para razonamiento socrático).

## Traceability
- Issue(s): `EPIC-01`
- PR(s): `TBD`
- Final commit hash(es): `TBD`
