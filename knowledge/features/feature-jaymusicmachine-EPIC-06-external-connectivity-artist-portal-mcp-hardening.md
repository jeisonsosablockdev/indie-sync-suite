# Problem Spec: external-connectivity-artist-portal-mcp-hardening

## What problem exists
Indie-Sync Suite cuenta con módulos funcionales maduros para la gestión de marca (Épica 1), planificación de lanzamientos (Épica 2), pipeline creativo generativo (Épica 3), distribución multicanal headless (Épica 4) y analítica consolidada (Épica 5). Sin embargo, el sistema opera actualmente como una isla local en el entorno del Label Manager, presentando tres limitaciones operativas críticas:
1. **Falta de Portal de Colaboración Ligero para Artistas**: Los artistas y colaboradores externos no cuentan con un canal simple para revisar audios del máster y aprobar o dar feedback sobre portadas y copys sin tener que instalar la aplicación de escritorio completa.
2. **Ausencia de Interfaz API Abierta (Open API Gateway)**: No existe una interfaz REST documentada y segura para que desarrolladores, scripts de automatización o clientes LLM externos puedan consultar el estado del catálogo, tareas o métricas.
3. **Falta de Interoperabilidad Agéntica Estandarizada (Model Context Protocol - MCP)**: Los agentes y entornos de IA externos (como Antigravity, Claude Desktop o Cursor) no disponen de un servidor MCP local para inspeccionar el Brand Vault ni ejecutar herramientas de la suite de forma nativa.
4. **Hardening de Producción y Seguridad de Acceso**: Se requiere consolidar la persistencia relacional (`008_portal_api_mcp.sql`), protección de sandbox, auditoría de llamadas y control estricto de accesos.

## Why it matters
Resolver estas limitaciones es vital para convertir a Indie-Sync Suite en un sistema operativo completamente integrado e interoperable:
- **Cero Fricción para el Artista**: La colaboración asimétrica mediante Magic Links temporales en el navegador móvil permite a los artistas aprobar entregables en segundos con un solo toque, reduciendo cuellos de botella en el ciclo de lanzamiento.
- **Ecosistema Abierto y Automatización**: La exposición de APIs autenticadas con API Keys y permisos granulares desbloquea integraciones con CRMs, herramientas de streaming y webhooks de terceros.
- **Extensibilidad Agéntica Universal (MCP)**: Al implementar el estándar de Model Context Protocol (MCP), cualquier LLM moderno puede actuar como un copiloto conectado directamente con la base de datos y herramientas de Indie-Sync Suite.

## What outcome is expected
1. **Portal del Artista (HU-6.5)**:
   - Generación de Magic Links temporales con tokens criptográficos HMAC-SHA256 con TTL configurable.
   - Vista web móvil ultraligera (`artist-portal-view.tsx`) para escuchar audio del máster y aprobar/rechazar artes y copys con comentarios.
   - Sincronización bidireccional local-first en SQLite (`sqlite-artist-portal-repository.ts`).
2. **Open REST API Gateway (HU-6.2)**:
   - Emisión, revocación y gestión de API Keys encriptadas con scopes definidos (`READ_RELEASES`, `WRITE_TASKS`, `READ_METRICS`).
   - Middleware de autenticación Bearer con hashing SHA-256 (`api-auth-middleware.ts`).
   - Repositorio SQLite (`sqlite-api-key-repository.ts`).
3. **Servidor MCP Local (HU-6.4)**:
   - Servidor compatible con Model Context Protocol v1.0 (JSON-RPC 2.0).
   - Exposición de Resources (`brand://vault`, `releases://list`, `metrics://summary`).
   - Exposición de Tools (`crear_tarea`, `aprobar_entregable`, `consultar_metricas`).
4. **Hardening y Migración DDL 008**:
   - Migración relacional `008_portal_api_mcp.sql` con claves foráneas e integridad referencial.
   - 100% de cumplimiento de los estándares de arquitectura en 4 capas, 0 clases y cobertura de tests TDD.

## What gaps exist today
- No existían tablas relacionales en SQLite para almacenar tokens de Magic Link, revisiones de artistas, API keys ni auditoría MCP.
- No existía una capa de autenticación por tokens firmados HMAC para accesos móviles temporales sin contraseñas.
- No existía un parser y despachador JSON-RPC que implemente el protocolo MCP sobre las herramientas locales de la suite.

## What questions remain open
- ¿Cómo se maneja la revocación inmediata de un Magic Link? Se incluirá un campo `revoked_at` y `expires_at` verificado en cada solicitud.
- ¿Qué nivel de seguridad deben tener las API Keys? Se almacenarán hasheadas con SHA-256 en SQLite, mostrando la clave en texto plano únicamente al momento de la creación.
