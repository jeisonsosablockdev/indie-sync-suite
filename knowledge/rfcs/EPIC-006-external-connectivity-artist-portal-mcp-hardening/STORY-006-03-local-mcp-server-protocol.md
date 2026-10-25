# RFC: STORY-006-03 - Servidor MCP Local & Protocolo JSON-RPC para Agentes Externos (HU-6.4)

## 1. Declaración del Requerimiento
Como Desarrollador o Usuario de asistentes de escritorio como Antigravity, Claude Desktop o Cursor, quiero conectar mi cliente de IA local directamente a Indie-Sync Suite mediante el protocolo estándar MCP (Model Context Protocol), para que mi agente externo pueda inspeccionar el Brand Vault, consultar tareas y ejecutar acciones operativas desde su propia interfaz.

## 2. Criterios de Aceptación
1. Servidor local compatible con la especificación de Model Context Protocol v1.0 y JSON-RPC 2.0 (`mcp-server-handler.ts`).
2. Implementación de **Resources** (Recursos de contexto de solo lectura):
   - `brand://vault/{labelId}`: Información completa del ADN del sello y artistas asociados.
   - `releases://active`: Lista de lanzamientos en curso con metadatos y fechas objetivo.
   - `metrics://summary/{releaseId}`: Resumen de rendimiento de streaming y pauta.
3. Implementación de **Tools** (Herramientas ejecutables con validación de esquemas Zod):
   - `mcp_crear_tarea`: Agendar una nueva tarea o hito en el cronograma.
   - `mcp_aprobar_entregable`: Cambiar el estado de un arte o copy a aprobado.
   - `mcp_consultar_metricas`: Obtener métricas consolidadas por ventana temporal.
4. Registro de auditoría local (`mcp_audit_logs`) con timestamp, método invocado, cliente y resultado.
5. Componente de visualización de estado del servidor MCP (`mcp-server-status.tsx`).

## 3. Contratos de Datos & Capas
- **Capa 1 (Presentación)**: `apps/web/src/components/assistant/mcp-server-status.tsx`
- **Capa 2 (Aplicación)**: `apps/web/src/lib/hooks/use-mcp-server.ts`
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/mcp/mcp-server-handler.ts`
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/mcp/local-mcp-bridge.ts`
