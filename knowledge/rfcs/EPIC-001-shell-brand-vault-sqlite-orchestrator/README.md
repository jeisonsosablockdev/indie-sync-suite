---
type: RFC
title: EPIC-001 Shell Base, Bóveda de Identidad (Brand Vault), SQLite Core y Contrato del Orquestador
description: RFC Epic README — Metadata, alcance, criterios de éxito, índice de historias canónico de 6 historias, bitácora de decisiones arquitectónicas, análisis de riesgos y trazabilidad
tags: [rfc, epic, governance, documentation, sqlite, brand-vault, byok, agent, ai-registry, guardrails]
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
- Problem statement: Ausencia de infraestructura de persistencia relacional local (SQLite), custodia criptográfica de claves BYOK para IA, bóveda de marca (Brand Vault) y runtime agéntico seguro con guardrails operacionales para sellos discográficos y artistas independientes.
- Business goal: Proveer a creadores y sellos una aplicación de escritorio/web privada, rápida y offline-first que unifique la identidad de marca de sus artistas, minimice costos de API mediante BYOK y permita una gestión de campañas musicales con control total y soberanía de datos.
- Technical goal: Construir la persistencia relacional SQLite con modo WAL y tabla outbox (`cloud_sync_queue`), almacenamiento de claves en el Keychain del sistema operativo (`keyring-rs`) con fallback AES-256-GCM, factoría de modelos unificada (`AiProviderRegistry`) sobre Vercel AI SDK Core (`ai`), contratos de Tool Calling con esquemas JSON y validación interactiva *Human-in-the-Loop*, y asistente lateral (Sidebar v1) con entrevista socrática de marca.
- Out of scope: Sincronización remota en vivo con Postiz Cloud (se implementa en la Épica 4), generación multimedia avanzada en lote (Épica 3) y analítica de streaming de DSPs (Épica 5).

## Success Criteria
- [x] Esquema relacional SQLite con tablas de Sellos, Artistas, Lanzamientos, Tareas, Enlaces externos y `cloud_sync_queue` probado con 100% de integridad referencial, modo WAL activo y `PRAGMA busy_timeout = 5000;` para resolver contención concurrente.
- [x] Módulo BYOK con custodia en el OS Keychain y fallback determinista cifrado con AES-256-GCM con soporte para `BYOK_MASTER_KEY` en CI, sondeo con cabecera `x-goog-api-key` y timeout estricto de 3500ms para OpenAI, Anthropic, Gemini y Groq sin fugas en URL ni logs.
- [x] Bóveda de Marca (Brand Vault CRUD) con validación Zod estricta, selector de color nativo HTML5 con cálculo de contraste WCAG AA y editor modular de perfiles en `apps/web/src/components/brand-vault/`.
- [x] Registro agéntico `AiProviderRegistry` operativo sobre Vercel AI SDK Core con inyección perezosa (*lazy*) de claves, validación estricta anti-SSRF en endpoints custom, índice por huella SHA-256 y purga reactiva de caché.
- [x] Contrato de Tool Calling con tipado Zod / JSON Schema, categorización de riesgo (`SAFE` vs `SENSITIVE`), modal interactivo con diff de parámetros JSON, timeout TTL de 5 minutos (300,000ms) contra memory leaks y bitácora inmutable `action_log`.
- [x] Flujo de entrevista socrática de contexto (Brand Interview) y Sidebar agéntico v1 integrados con Motion 12, hook desacoplado en Capa 2 (Application) y atajos de teclado (`Cmd+K` / `Cmd+J`).

## Story Index
| Story ID | Title | RFC File | Status | PR | Notes |
| --- | --- | --- | --- | --- | --- |
| STORY-001-01 | HU-1.6 Persistencia Relacional SQLite Core y Cola Outbox | STORY-001-01-sqlite-core-outbox.md | approved | TBD | Persistencia Relacional Local & Outbox Queue |
| STORY-001-02 | HU-1.3/1.5 Gestión Segura de Credenciales BYOK y Diagnóstico de Salud | STORY-001-02-byok-keyring-health.md | approved | TBD | OS Keychain & Health Engine (3500ms) |
| STORY-001-03 | HU-1.1 Bóveda de Identidad Visual y Conceptual (Brand Vault) | STORY-001-03-brand-vault-crud.md | approved | TBD | Brand Vault CRUD & Color Picker Nativo |
| STORY-001-04 | Factoría Desacoplada de Modelos de Lenguaje (AiProviderRegistry) | STORY-001-04-ai-provider-registry.md | approved | TBD | Vercel AI SDK Core & Multi-Provider Registry |
| STORY-001-05 | HU-6.3 Protocolo de Acciones (Tool Calling), Guardrails y Action Log | STORY-001-05-tool-calling-guardrails.md | approved | TBD | Human-in-the-Loop & Audit Log SQLite |
| STORY-001-06 | HU-1.2/6.1 Asistente Lateral Operativo y Entrevista Socrática | STORY-001-06-socratic-interview-sidebar.md | approved | TBD | Sidebar v1 (Motion 12) & Brand Interview |

## Decision Log
| Date | Story | Decision | Owner | Link |
| --- | --- | --- | --- | --- |
| 2026-09-07 | STORY-001-01 | Descartar infraestructura de microservicios Docker (Plane) e implementar SQLite local con WAL mode, busy_timeout de 5000ms y Unit of Work outbox | jaymusicmachine | [STORY-001-01-sqlite-core-outbox.md](./STORY-001-01-sqlite-core-outbox.md) |
| 2026-09-07 | STORY-001-02 | Adoptar custodia en OS Keychain (`keyring-rs`) con fallback AES-256-GCM compatible con `BYOK_MASTER_KEY` en CI, sondeo por cabecera y timeout estricto a 3500ms | jaymusicmachine | [STORY-001-02-byok-keyring-health.md](./STORY-001-02-byok-keyring-health.md) |
| 2026-09-07 | STORY-001-03 | Usar `<input type="color">` HTML5 nativo con Zod regex y cálculo WCAG AA en lugar de librerías pesadas (ahorro ~120KB) | jaymusicmachine | [STORY-001-03-brand-vault-crud.md](./STORY-001-03-brand-vault-crud.md) |
| 2026-09-07 | STORY-001-04 | Construir AiProviderRegistry sobre Vercel AI SDK Core con validación anti-SSRF en `baseURL` e invalidación reactiva de caché indexada por SHA-256 | jaymusicmachine | [STORY-001-04-ai-provider-registry.md](./STORY-001-04-ai-provider-registry.md) |
| 2026-09-07 | STORY-001-05 | Interceptar tools `SENSITIVE` con promesas suspendidas, diff JSON y TTL de 5m en modal interactivo, auditando todo en `action_log` | jaymusicmachine | [STORY-001-05-tool-calling-guardrails.md](./STORY-001-05-tool-calling-guardrails.md) |
| 2026-09-07 | STORY-001-06 | Sidebar v1 animado con Motion 12 y atajos de teclado (`Cmd+K`/`Cmd+J`), orquestando entrevista socrática con `useChat` y hook en Capa 2 | jaymusicmachine | [STORY-001-06-socratic-interview-sidebar.md](./STORY-001-06-socratic-interview-sidebar.md) |

## Risks and Dependencies
- **Riesgo 1: Diversidad de OS Keychains & CI Headless**: Variaciones de compatibilidad en el OS Keychain (`keyring-rs`) entre macOS, Linux y Windows, y runners efímeros en CI.
  - *Mitigación*: Implementación del adaptador `KeyringPort` con fallback automático que cifra con AES-256-GCM soportando la variable de entorno `BYOK_MASTER_KEY` / `APP_ENCRYPTION_KEY` como override prioritario en CI, o derivación PBKDF2 local.
- **Riesgo 2: Bloqueo de concurrencia en SQLite**: Operaciones concurrentes de lectura/escritura y colisiones en transacciones `BEGIN IMMEDIATE`.
  - *Mitigación*: Activación obligatoria de `PRAGMA journal_mode = WAL;`, `PRAGMA foreign_keys = ON;` y `PRAGMA busy_timeout = 5000;` en todas las conexiones del cliente `better-sqlite3`.
- **Riesgo 3: Fugas de API Keys y Latencia en Comprobaciones de Salud**: Fugas en parámetros de URL (ej. Gemini `?key=...`) o cuelgue por caídas de red.
  - *Mitigación*: Envío de clave mediante cabecera HTTP `x-goog-api-key: <key>`, redacción estricta de headers en logs y `AbortController` con timeout innegociable de 3500ms.
- **Riesgo 4: Memory Leaks por Guardrails y Spoofing por Prompt Injection**: Modales de confirmación abandonados que dejan promesas colgadas indefinidamente o LLMs que ocultan mutaciones destructivas en su texto.
  - *Mitigación*: TTL de 5 minutos (300,000ms) en `pendingConfirmations` con auto-cancelación limpia, y renderizado obligatorio de diff JSON de parámetros reales en `GuardrailModal`.
- **Riesgo 5: SSRF en Proveedores Compatibles con OpenAI**: Inyección de URLs locales o de metadatos de nube en `baseURL`.
  - *Mitigación*: Validación estricta que exige HTTPS o restringe HTTP exclusivamente a loopback local (`localhost`, `127.0.0.1`).

## Open Questions
- [x] ¿Cómo garantizar que las migraciones SQLite sean idempotentes y reproducibles? -> *Resuelto: Migrador DDL secuencial de menos de 45 líneas con tabla interna `_migrations`.*
- [x] ¿Cómo evitar fuga de claves en logs o inspectores de componentes frontend? -> *Resuelto: Las API keys jamás salen del proceso backend local; la UI solo recibe tokens enmascarados `maskApiKey`.*
- [x] ¿Qué modelo por defecto usar para la entrevista socrática si el usuario configura múltiples llaves? -> *Resuelto: Gemini 2.0 Flash o Claude 3.7 Sonnet como recomendados primarios por contexto y velocidad.*

## Traceability
- Related issue(s): `EPIC-01`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
