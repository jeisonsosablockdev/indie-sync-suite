# Problem Spec: mcp-standalone-server-artist-integration

## What problem exists
Indie-Sync Suite cuenta con una implementación preliminar del protocolo Model Context Protocol (MCP) desarrollada en la Épica 6 (`mcp-server-handler.ts` y `local-mcp-bridge.ts`). No obstante, el sistema no puede ser utilizado de forma directa por agentes de IA externos (como Google Antigravity, Claude Desktop o Cursor) debido a las siguientes limitaciones y sobreingeniería acumulada:
1. **Falta de Runner Stdio Independiente**: El puente MCP actual está restringido al runtime de la aplicación web y carece de un proceso ejecutable de línea de comandos (`scripts/indie-sync-mcp-server.ts`) que procese streams `ndjson` estándar (JSON-RPC 2.0 sobre `process.stdin` y `process.stdout`) mediante la librería estándar `node:readline`.
2. **Ausencia de Herramientas de Artistas en el Catálogo MCP**: En `mcp-server-handler.ts` únicamente se exponen herramientas para gestión de tareas, entregables y métricas. Las operaciones de registro (`mcp_crear_artista`) y consulta (`mcp_listar_artistas`), esenciales para operar el Brand Vault desde el agente, no están expuestas en el protocolo MCP externo.
3. **Dependencias Fantasma & Doble Despacho**: Se detectó en `package.json` la dependencia `@modelcontextprotocol/server` sin ningún uso real en el codebase (peso muerto innecesario). Asimismo, existe un doble switch redundante entre el manejador de protocolo y los puertos de infraestructura.
4. **Falta de Configuración en el Ecosistema de Antigravity**: El proyecto no tiene registrada la conexión a `indie-sync-suite` en [.mcp.json](../../.mcp.json), impidiendo que Antigravity descubra y ejecute las herramientas de forma nativa desde el chat.

## Why it matters
- **Operatividad Agéntica Directa**: Permite que el Label Manager o desarrollador instruya directamente a Antigravity: *"Crea un nuevo artista llamado Neon Pulse del género Synthwave"* y el agente realice la validación Zod, verifique integridad referencial y persista la entidad en la base de datos relacional SQLite local (`.data/indie_suite.db`).
- **Simplicidad Radical (Ponytail-Aligned)**: Al eliminar dependencias no utilizadas, unificar el flujo en un único slice atómico y usar `node:readline` de la librería estándar, el mantenimiento y depuración del transporte MCP es trivial y sin sobreingeniería.
- **Trazabilidad y Auditoría Centralizada**: Cada llamada a herramienta disparada por Antigravity queda registrada en la tabla `mcp_audit_logs` con ID único, timestamp ISO-8601, método invocado y estado de ejecución.

## What outcome is expected
1. **Catálogo MCP Unificado (Capa 3 - Dominio)**:
   - Exponer `mcp_crear_artista` y `mcp_listar_artistas` en `MCP_TOOLS_CATALOG` dentro de `mcp-server-handler.ts`.
   - Reemplazar el doble switch por despacho directo mediante mapa funcional de herramientas (`Record<string, Function>`).
2. **Transporte Stdio Minimalista (Capa 4 - Infraestructura)**:
   - Runner `scripts/indie-sync-mcp-server.ts` ultra-ligero (< 120 líneas) con `node:readline`, sin dependencias externas ni parsing manual de buffers.
   - Eliminación de la dependencia no utilizada `@modelcontextprotocol/server` de `package.json`.
3. **Integración con Antigravity**:
   - Entrada `indie-sync-suite` en [.mcp.json](../../.mcp.json) ejecutando `node --import tsx ./scripts/indie-sync-mcp-server.ts`.
4. **Validación Exhaustiva (TDD & DoD)**:
   - Suite de pruebas unitarias e integradas al 100% en verde.
   - `pnpm validate` con 0 errores y 0 warnings.

## What gaps exist today
- `mcp-server-handler.ts` no contiene las definiciones ni el despacho para creación y listado de artistas.
- `package.json` incluye `@modelcontextprotocol/server` sin ser utilizado.
- `.mcp.json` carece de la configuración para levantar el servidor de `indie-sync-suite`.

## What questions remain open
- *¿Cómo se maneja el `labelId` si el agente externo no provee un UUID de sello al crear el artista?*
  **Decisión**: La herramienta buscará el primer sello existente en la tabla `labels`; si no existe ninguno, creará automáticamente el sello predeterminado (*"Indie Sync Records"*) para garantizar la integridad referencial de clave foránea en SQLite.
