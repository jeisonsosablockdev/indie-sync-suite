# RFC: STORY-006-01 - Portal del Artista & Cloud Relay Ligero con Magic Link (HU-6.5)

## 1. Declaración del Requerimiento
Como Artista o Colaborador, quiero acceder mediante un Magic Link temporal firmado en mi navegador móvil a un portal ultraligero sin contraseñas ni instalaciones, para escuchar el audio del máster y aprobar artes de portada y copys en un toque desde mi teléfono.

## 2. Criterios de Aceptación
1. Generación de tokens Magic Link firmados con HMAC-SHA256 y tiempo de vida (TTL) configurable (ej. 7 días) con soporte de revocación inmediata.
2. Interfaz web responsiva ultraligera (`artist-portal-view.tsx`) optimizada para móvil con:
   - Reproductor de audio protegido para el enlace al máster.
   - Galería de entregables aprobados y pendientes de revisión (artes 1:1, videos 9:16, copys).
   - Acciones de 1-toque: "Aprobar", "Solicitar Ajustes" y campo de comentarios/feedback.
3. Persistencia relacional en SQLite (`artist_portal_sessions`, `portal_deliverable_reviews`).
4. Sincronización local-first que refleja las decisiones del artista en las tareas del release del Label Manager.

## 3. Contratos de Datos & Capas
- **Capa 1 (Presentación)**: `apps/web/src/components/portal/artist-portal-view.tsx`
- **Capa 2 (Aplicación)**: `apps/web/src/lib/hooks/use-artist-portal.ts`
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/portal/portal-schemas.ts` y `portal-auth-service.ts`
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/db/repositories/sqlite-artist-portal-repository.ts`
