# RFC: STORY-005-02 - Ingesta de Reportes CSV de Streaming (HU-5.4)

## 1. Declaración del Requerimiento
Como Label Manager o Artista, quiero subir reportes analíticos de streaming en formato CSV (exportados de Spotify for Artists, Apple Music for Artists, DistroKid o TuneCore) para que el sistema consolide métricas de escuchas reales sin depender de APIs cerradas o de pago.

## 2. Criterios de Aceptación
1. Parser determinista y tolerante a fallos (`csv-report-parser.ts`) que procesa archivos CSV con delimitadores por coma o punto y coma, manejando campos con comillas dobles y saltos de línea.
2. Detección automática del dialecto del archivo:
   - Formato Spotify for Artists (Canciones / Streams / Oyentes / Guardados)
   - Formato DistroKid / TuneCore (Reportes de descargas y reproducciones)
   - Formato Genérico normalizado (`date`, `platform`, `streams`, `listeners`, `saves`, `country`)
3. Mapeo y validación de tipos vía Zod (`StreamingCsvRowSchema`), descartando filas corruptas sin abortar el lote.
4. Persistencia en SQLite local (`streaming_reports` y `streaming_metrics`) con soporte de rollback atómico ante fallos de transacción.

## 3. Contratos de Datos & Capas
- **Capa 1 (Presentación)**: `apps/web/src/components/analytics/csv-report-uploader.tsx`
- **Capa 2 (Aplicación)**: `apps/web/src/lib/hooks/use-csv-ingestion.ts`
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/analytics/csv-report-parser.ts`
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/db/repositories/sqlite-streaming-metrics-repository.ts` (método `ingestCsvBatch`)
