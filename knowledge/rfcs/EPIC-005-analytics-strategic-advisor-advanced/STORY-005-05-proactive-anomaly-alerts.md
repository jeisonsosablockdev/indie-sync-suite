# RFC: STORY-005-05 - Alertas Proactivas de Oportunidades y Riesgos de Campaña (HU-5.6)

## 1. Declaración del Requerimiento
Como Usuario, quiero que el sistema me alerte proactivamente sobre anomalías, caídas de tracción o picos inusuales de rendimiento en mi lanzamiento, para que pueda reaccionar a tiempo con acciones tácticas antes de que termine el ciclo de estreno.

## 2. Criterios de Aceptación
1. Algoritmo heurístico puro (`anomaly-detection-engine.ts`) que analiza series temporales y compara el valor del día actual con el promedio móvil de los últimos 7 días.
2. Identifica dos tipos clave de anomalías:
   - `RISK_DROP`: Caída de reproducciones o engagement $> 30\%$ respecto a la media esperada.
   - `OPPORTUNITY_SPIKE`: Crecimiento repentino $> 50\%$ en reproducciones o clics en una región o canal.
3. Genera tarjetas de sugerencia táctica accionables (ej. *"Reasignar $15 al anuncio B de mayor tasa de conversión"*, *"Publicar reel detrás de cámaras por pico en TikTok"*).
4. Permite ejecutar la acción sugerida o descartar la recomendación con un solo clic.

## 3. Contratos de Datos & Capas
- **Capa 1 (Presentación)**: `apps/web/src/components/analytics/anomaly-alert-banner.tsx`
- **Capa 2 (Aplicación)**: `apps/web/src/lib/hooks/use-anomaly-detector.ts`
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/analytics/anomaly-detection-engine.ts`
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/db/repositories/sqlite-streaming-metrics-repository.ts` (lectura de serie temporal)
