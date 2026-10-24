# RFC: STORY-005-01 - Dashboard Centralizado de Rendimiento (HU-5.1)

## 1. Declaración del Requerimiento
Como Artista o Label Manager, quiero consultar en un único panel centralizado las métricas consolidadas de reproducciones, oyentes, interacciones sociales y conversiones asociadas a un lanzamiento, para evaluar el impacto y alcance sin alternar entre múltiples aplicaciones o servicios externos.

## 2. Criterios de Aceptación
1. Consolida métricas de streams, oyentes únicos, clics de pre-save, engagement de redes y conversiones publicitarias en tarjetas KPI visuales.
2. Proporciona selector de filtros temporales por fase de lanzamiento:
   - `PRE_RELEASE`: $T-14$ a $T-1$
   - `DROP_WEEK`: $T-0$ a $T+7$
   - `POST_RELEASE`: $T+8$ en adelante
   - `ALL_TIME`: Histórico consolidado
3. Permite sincronización de métricas en demanda mediante botón de refresco manual.
4. Renderizado accesible y con diseño responsivo bajo el sistema de diseño oscuro/claro del monorepo.

## 3. Contratos de Datos & Capas
- **Capa 1 (Presentación)**: `apps/web/src/components/analytics/performance-dashboard-view.tsx`
- **Capa 2 (Aplicación)**: `apps/web/src/lib/hooks/use-performance-dashboard.ts`
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/analytics/analytics-schemas.ts` (esquema `PerformanceMetricsSummarySchema`)
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/db/repositories/sqlite-streaming-metrics-repository.ts` (método `getMetricsSummary`)
