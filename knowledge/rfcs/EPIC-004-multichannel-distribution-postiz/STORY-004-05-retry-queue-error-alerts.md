# STORY-004-05: Cola de Reintentos Outbox y Alertas de Fallos (HU-4.5)

## Metadatos
- **ID:** `STORY-004-05`
- **Historia de Usuario:** HU-4.5
- **Épica:** EPIC-004
- **Estado:** `APPROVED`
- **Asignación:** `api` + `db` + `frontend`

---

## 1. Declaración de la Historia
- **Como** Operador del sello,
- **Quiero** recibir alertas inmediatas si una publicación o anuncio falla al publicarse y contar con reintentos automáticos,
- **Para que** no se pierda el impacto de un hito de lanzamiento por caídas de API o problemas de formato.

---

## 2. Criterios de Aceptación
1. **Reintentos Exponenciales:** Ejecuta hasta 3 reintentos automáticos con retroceso exponencial ante fallos transitorios de red.
2. **Notificación Dead-Letter:** Si el fallo persiste tras 3 intentos, mueve el post al estado `FAILED` y registra el error retornado por la red social.
3. **Reintento Manual 1-Clic:** Permite editar el post y forzar una publicación inmediata desde la interfaz.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 4: Infraestructura
- `apps/web/src/lib/infrastructure/postiz/cloud-sync-worker.ts`:
  ```typescript
  export interface SyncWorkerConfig {
    maxRetries?: number;
    initialBackoffMs?: number;
  }
  export function createCloudSyncWorker(db: DatabaseSync, apiClient: PostizApiClient, config?: SyncWorkerConfig);
  ```

### Capa 1: Presentación
- `apps/web/src/components/distribution/sync-queue-monitor.tsx`: Panel visual del estado de la cola de sincronización.
