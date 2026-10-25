# RFC: STORY-006-04 - Hardening de Producción, DDL Migration 008 & Políticas de Seguridad

## 1. Declaración del Requerimiento
Como Responsable de Seguridad y Arquitectura del Sello, quiero garantizar que el esquema relacional en SQLite cuente con todas las tablas e índices necesarios para el portal del artista, las API keys y la auditoría MCP, junto con reglas estrictas de políticas de seguridad, sandbox y límites de tasa para proteger la integridad operativa de la suite.

## 2. Criterios de Aceptación
1. Migración relacional `008_portal_api_mcp.sql` con:
   - `artist_portal_sessions`: Sesiones firmadas HMAC con expiración y revocación.
   - `portal_deliverable_reviews`: Decisiones y feedback de artistas vinculadas a tareas.
   - `external_api_keys`: Claves hasheadas SHA-256 con scopes y marcas de último uso.
   - `mcp_audit_logs`: Trazabilidad completa de llamadas RPC de clientes externos.
2. Motor de políticas de seguridad (`security-policy-engine.ts`) que evalúa:
   - Validación estricta de orígenes autorizados y esquemas URI.
   - Límites de tasa (Rate Limiting) en memoria para invocaciones API y Magic Links.
   - Sanitización de entradas y prevención de inyecciones en feedback de artistas.
3. Validación integral de arquitectura funcional (0 clases, 4 capas, in-code commentary obligatorio) y ejecución limpia de `pnpm validate`.

## 3. Contratos de Datos & Capas
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/hardening/security-policy-engine.ts`
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/db/migrations/008_portal_api_mcp.sql`
