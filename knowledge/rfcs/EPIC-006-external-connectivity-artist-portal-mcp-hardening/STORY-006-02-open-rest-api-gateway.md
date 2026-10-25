# RFC: STORY-006-02 - Interfaz API REST Abierta & Gestión de API Keys (HU-6.2)

## 1. Declaración del Requerimiento
Como Desarrollador o Usuario avanzado, quiero interactuar con la plataforma a través de endpoints REST autenticados mediante API Keys con permisos granulares, para conectar herramientas externas como clientes LLM (ChatGPT Actions, Claude), scripts de automatización o webhooks.

## 2. Criterios de Aceptación
1. Emisión de API Keys con prefijo identificador (`iss_live_...`), almacenamiento seguro con hash criptográfico SHA-256 en SQLite y despliegue del token en texto plano únicamente al crearse.
2. Definición de permisos y scopes granulares:
   - `READ_RELEASES`: Consulta de catálogo, metadatos y cronograma.
   - `WRITE_TASKS`: Creación y actualización de entregables y tareas.
   - `READ_METRICS`: Lectura de analítica y reportes de streaming.
   - `FULL_ACCESS`: Control total operativo.
3. Middleware de autenticación Bearer (`api-auth-middleware.ts`) que valida la firma, scopes y estado de revocación.
4. Consola de administración visual (`api-keys-manager.tsx`) para listar, generar y revocar llaves al instante.

## 3. Contratos de Datos & Capas
- **Capa 1 (Presentación)**: `apps/web/src/components/api-gateway/api-keys-manager.tsx`
- **Capa 2 (Aplicación)**: `apps/web/src/lib/hooks/use-api-keys.ts`
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/api-gateway/api-auth-middleware.ts`
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/db/repositories/sqlite-api-key-repository.ts`
