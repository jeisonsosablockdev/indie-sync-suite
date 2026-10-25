# Solution Spec: external-connectivity-artist-portal-mcp-hardening Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `frontend` & `api` & `db`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture

La solución implementa la conectividad externa, colaboración ligera para artistas e interoperabilidad agéntica mediante la arquitectura funcional estricta en 4 capas:

```
┌────────────────────────────────────────────────────────────────────────┐
│ Capa 1: Presentación (Pure React Components, Tailwind, Lucide Icons)   │
│ - artist-portal-view.tsx: Vista móvil ultraligera para el Artista     │
│ - api-keys-manager.tsx: Consola de gestión de API keys y scopes        │
│ - mcp-server-status.tsx: Panel visual de estado del servidor MCP local │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ consume
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Capa 2: Aplicación / Hooks (State Management, Session, Zero Direct JSX)│
│ - use-artist-portal.ts: Estado de revisión de entregables y token      │
│ - use-api-keys.ts: Operaciones CRUD y ciclo de vida de API keys        │
│ - use-mcp-server.ts: Estado del servidor MCP local y actividad         │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ consume
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Capa 3: Dominio / Pipelines (Pure Functions, Zod Schemas, Zero I/O)    │
│ - portal-schemas.ts: Contratos Zod para MagicLink, Review y Feedback   │
│ - portal-auth-service.ts: Firma y verificación HMAC-SHA256 de tokens   │
│ - api-auth-middleware.ts: Validación y hashing SHA-256 de API Keys     │
│ - mcp-server-handler.ts: Despachador JSON-RPC 2.0 y spec MCP v1.0      │
│ - security-policy-engine.ts: Reglas de validación y sandbox            │
└──────────────────────────────────┬─────────────────────────────────────┘
                                   │ consume
┌──────────────────────────────────▼─────────────────────────────────────┐
│ Capa 4: Infraestructura (SQLite Repositories, Native node:sqlite, WAL) │
│ - 008_portal_api_mcp.sql: DDL relacional y foreign keys ON             │
│ - sqlite-artist-portal-repository.ts: Sesiones y feedback de portal   │
│ - sqlite-api-key-repository.ts: Almacenamiento seguro de API keys      │
│ - local-mcp-bridge.ts: Puente JSON-RPC para clientes externos          │
└────────────────────────────────────────────────────────────────────────┘
```

## 3. Atomic Slices & Logical Sequence

- **SPEC-06-01**: **Portal del Artista (Cloud Relay Ligero con Magic Link)** (HU-6.5)
  - Capa 1: `apps/web/src/components/portal/artist-portal-view.tsx`
  - Capa 2: `apps/web/src/lib/hooks/use-artist-portal.ts`
  - Capa 3: `apps/web/src/lib/pipelines/portal/portal-schemas.ts` y `portal-auth-service.ts`
  - Capa 4: `apps/web/src/lib/infrastructure/db/repositories/sqlite-artist-portal-repository.ts`

- **SPEC-06-02**: **Interfaz API REST Abierta & Gestión de API Keys** (HU-6.2)
  - Capa 1: `apps/web/src/components/api-gateway/api-keys-manager.tsx`
  - Capa 2: `apps/web/src/lib/hooks/use-api-keys.ts`
  - Capa 3: `apps/web/src/lib/pipelines/api-gateway/api-auth-middleware.ts`
  - Capa 4: `apps/web/src/lib/infrastructure/db/repositories/sqlite-api-key-repository.ts`

- **SPEC-06-03**: **Servidor MCP Local & Protocolo JSON-RPC para Agentes Externos** (HU-6.4)
  - Capa 1: `apps/web/src/components/assistant/mcp-server-status.tsx`
  - Capa 2: `apps/web/src/lib/hooks/use-mcp-server.ts`
  - Capa 3: `apps/web/src/lib/pipelines/mcp/mcp-server-handler.ts`
  - Capa 4: `apps/web/src/lib/infrastructure/mcp/local-mcp-bridge.ts`

- **SPEC-06-04**: **Hardening de Producción, DDL Migration 008 & Políticas de Seguridad**
  - Capa 3: `apps/web/src/lib/pipelines/hardening/security-policy-engine.ts`
  - Capa 4: `apps/web/src/lib/infrastructure/db/migrations/008_portal_api_mcp.sql`

## 4. TDD (Test-Driven Development) Strategy

### Unit/Integration Tests (Fase RED)
- `tests/domain/portal/portal-auth-service.test.ts`: Generación, expiración y firma HMAC de tokens Magic Link.
- `tests/infrastructure/db/artist-portal-repository.test.ts`: Persistencia SQLite de sesiones y feedback de entregables.
- `tests/components/artist-portal-view.test.tsx`: Interfaz móvil, audio player seguro y acciones de aprobación/rechazo.
- `tests/domain/api-gateway/api-auth-middleware.test.ts`: Validación de API keys, hashing SHA-256 y control de scopes.
- `tests/infrastructure/db/api-key-repository.test.ts`: CRUD de API keys y revocación inmediata.
- `tests/components/api-keys-manager.test.tsx`: Consola de administración de llaves y máscara de credenciales.
- `tests/domain/mcp/mcp-server-handler.test.ts`: Protocolo JSON-RPC 2.0, resources (`brand://`, `releases://`) y tools execution.
- `tests/infrastructure/mcp/local-mcp-bridge.test.ts`: Despacho y manejo de errores del puente MCP.
- `tests/components/mcp-server-status.test.tsx`: Estado del servidor y visualización de herramientas activas.
- `tests/domain/hardening/security-policy-engine.test.ts`: Reglas de seguridad de sandbox y límites de tasa.

## 5. Local Definition of Done (DoD)
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas de regresión pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings (16/16 gates).
- [ ] Migración DDL `008_portal_api_mcp.sql` aplicada idempotentemente.
- [ ] Cero clases (`class`), arquitectura funcional 100% en 4 capas.
- [ ] Aprobación formal de Gate 1 y Gate 2 por subagente `architect`.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability
- **Problem Spec**: [feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening.md](./knowledge/features/feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening.md)
- **Solution Spec**: [feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening-implementation.md](./knowledge/features/feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening-implementation.md)
- **Linear Issue**: [Linear Ticket #EPIC-06](https://linear.app/indie-suite/issue/EPIC-06)
