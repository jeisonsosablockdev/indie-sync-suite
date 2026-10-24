# RFC: STORY-005-06 - Creación Autónoma de Paneles de Datos y Tools de Analítica (HU-5.3 & HU-6.1 v5)

## 1. Declaración del Requerimiento
Como Usuario con fuentes de datos externas o propietarias, quiero ingresar una URL de endpoint REST y sus credenciales de acceso para que el sistema infiera dinámicamente el esquema JSON y cree un panel personalizado de métricas, además de interactuar con ellas desde el chat lateral mediante herramientas agénticas.

## 2. Criterios de Aceptación
1. Cliente de consulta seguro (`safe-fetch-client.ts`) con protección anti-SSRF integral que valida el endpoint objetivo antes de cualquier conexión.
2. Motor de inferencia de esquema JSON (`json-schema-inferrer.ts`) que identifica:
   - Métricas numéricas clave (totales, contadores)
   - Series temporales (`timestamp`, `value`)
   - Etiquetas categóricas
3. Generador de widgets visuales para el panel personalizado (`custom-api-dashboard-view.tsx`).
4. Persistencia en SQLite local (`custom_api_dashboards`, `custom_dashboard_widgets`).
5. Herramientas del Asistente Lateral (`analytics-tools.ts`):
   - `consultar_metricas_rendimiento` (Tier 1 Safe)
   - `analizar_eficiencia_pauta` (Tier 1 Safe)
   - `generar_panel_custom` (Tier 2 Guardrail Sensitive - Requiere confirmación)
6. Componente de renderizado de tool en el chat (`analytics-tool-badge.tsx`).

## 3. Contratos de Datos & Capas
- **Capa 1 (Presentación)**: `apps/web/src/components/analytics/custom-api-dashboard-view.tsx` y `apps/web/src/components/assistant/analytics-tool-badge.tsx`
- **Capa 2 (Aplicación)**: `apps/web/src/lib/hooks/use-custom-api-dashboard.ts`
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/analytics/json-schema-inferrer.ts` y `tools/analytics-tools.ts`
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/db/repositories/sqlite-custom-dashboard-repository.ts` y `safe-fetch-client.ts`
