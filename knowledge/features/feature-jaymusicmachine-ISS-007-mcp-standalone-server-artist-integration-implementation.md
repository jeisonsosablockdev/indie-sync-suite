# Solution Spec: mcp-standalone-server-artist-integration Implementation

## 1. Governance & Agent Assignment
- **Initiative Planner**: `planner`
- **Lead Implementation Specialist**: `api` / `architect`
- **Architect Gatekeeper**: `architect` (Gate 1 & Gate 2)
- **Quality & Review**: `qa` & `reviewer`
- **Security Auditor**: `security`

## 2. Solution Overview & 4-Layer Architecture (Lean & Ponytail-Audited)
La solución provee un servidor MCP autónomo sobre transporte stdio compatible con Antigravity, eliminando capas intermedias innecesarias y unificando el despacho mediante contratos funcionales directos:

### Capa 1: Presentación & Configuración de Host
- Configuración en [.mcp.json](../../.mcp.json) con el servicio `indie-sync-suite` (`node --import tsx ./scripts/indie-sync-mcp-server.ts`).
- Entrada stdio mediante streams delimitados por saltos de línea (ndjson) consumidos nativamente por `node:readline`.

### Capa 2: Aplicación / Consumo
- Inyección directa de herramientas: En lugar de un doble switch repetitivo entre `mcp-server-handler.ts` y los puertos, las tools se ejecutan a través de un registro plano `Record<string, (args: Record<string, unknown>) => Promise<unknown>>` conectado a `SqliteArtistRepository` y `SqliteLabelRepository`.

### Capa 3: Dominio (Pipelines & Protocol Handler Centralizado)
- [mcp-server-handler.ts](../../apps/web/src/lib/pipelines/mcp/mcp-server-handler.ts):
  - Centralización de todos los métodos del protocolo JSON-RPC (`initialize`, `ping`, `resources/*`, `tools/*`).
  - Inclusión de `mcp_crear_artista` y `mcp_listar_artistas` en `MCP_TOOLS_CATALOG`.
  - Validación estricta de parámetros con esquemas Zod.
  - Reutilización de tipos (`McpJsonRpcResponse`), 0 clases y 0 I/O de red.

### Capa 4: Infraestructura (Persistencia & Transporte Stdio Minimalista)
- [scripts/indie-sync-mcp-server.ts](../../scripts/indie-sync-mcp-server.ts):
  - **Uso de stdlib**: Procesa `process.stdin` con `node:readline` en < 120 líneas de código.
  - **Sin parámetros muertos**: `initDatabase` resuelve directamente la base de datos de producción local `.data/indie_suite.db` sin abstracciones de configuración prematuras.
  - **Limpieza de dependencias**: Eliminación de `@modelcontextprotocol/server` en `package.json`.
- [local-mcp-bridge.ts](../../apps/web/src/lib/infrastructure/mcp/local-mcp-bridge.ts):
  - Despacho y persistencia determinista de auditoría en la tabla SQLite `mcp_audit_logs`.
- [SqliteClient](../../apps/web/src/lib/infrastructure/db/sqlite-client.ts) y repositorios:
  - Persistencia segura con WAL mode e integridad referencial.

## 3. Atomic Slices & Logical Sequence (Unificado)
Siguiendo las conclusiones del Ponytail Audit, se evita la burocracia de fragmentar en múltiples ramas SPEC para un delta de ~60 líneas. Todo el trabajo se ejecuta en **un único ciclo atómico**:

### SPEC-01: Servidor MCP Stdio Completo & Herramientas de Artistas
- **Rama**: `SPEC/jaymusicmachine-ISS-007-spec01-mcp-stdio-artist-integration`
- **Fase RED (TDD)**:
  - Tests en `tests/domain/mcp/mcp-server-handler.test.ts` verificando:
    - Protocolo `initialize` y `ping`.
    - `tools/list` conteniendo `mcp_crear_artista` y `mcp_listar_artistas`.
    - Invocación de `mcp_crear_artista` con validación Zod y fallback de `labelId`.
  - Tests en `tests/infrastructure/mcp/local-mcp-bridge.test.ts` verificando auditoría.
- **Fase GREEN**:
  - Implementar en `mcp-server-handler.ts` las tools de artistas y despacho directo.
  - Conectar los puertos y repositorios en `scripts/indie-sync-mcp-server.ts`.
  - Registrar `indie-sync-suite` en `.mcp.json`.
  - Desinstalar la dependencia muerta `@modelcontextprotocol/server`.
- **Fase REFACTOR**:
  - Auditoría Clean Code y Ponytail check: runner < 120 líneas, 0 dependencias no utilizadas, `pnpm validate` con 0 errores.

## 4. TDD (Test-Driven Development) Strategy
### Unit/Integration Tests (Fase RED)
- **Archivos de prueba**:
  - `tests/domain/mcp/mcp-server-handler.test.ts`: Cobertura del catálogo y despacho.
  - `tests/infrastructure/mcp/local-mcp-bridge.test.ts`: Cobertura de persistencia de auditoría.
- **Comando**: `pnpm test`
- **Criterios de Aserción**:
  - `initialize` retorna protocolo `2024-11-05` y nombre `indie-sync-suite`.
  - `tools/call` con `mcp_crear_artista` valida campos requeridos (`name`, `genre`), crea el registro en SQLite y retorna el artista.
  - Llamadas con parámetros inválidos retornan código `-32602`.

## 5. Local Definition of Done (DoD) & Ponytail Gate
- [ ] La fase actual del tracker de estado es `PHASE_8_HUMAN_MERGE_APPROVED`.
- [ ] La suite de pruebas pasa al 100% (verde).
- [ ] `pnpm validate` se ejecuta con 0 errores y 0 warnings.
- [ ] **Ponytail Check**: Dependencia `@modelcontextprotocol/server` removida; `scripts/indie-sync-mcp-server.ts` utiliza `node:readline` con menos de 120 líneas.
- [ ] `.mcp.json` contiene la configuración de `indie-sync-suite`.
- [ ] Aprobación explícita del humano registrada.

## 6. Spec Artifact Traceability (Local OKF)
- **Problem Spec**: [feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration.md](./feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration.md)
- **Solution Spec**: [feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration-implementation.md](./feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration-implementation.md)
- **Tracking**: Local Offline-First (Open Knowledge System - OKF)
