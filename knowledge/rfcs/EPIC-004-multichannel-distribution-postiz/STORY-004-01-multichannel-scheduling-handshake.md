# STORY-004-01: Programación Multicanal de Publicaciones con Media Handshake (HU-4.1)

## Metadatos
- **ID:** `STORY-004-01`
- **Historia de Usuario:** HU-4.1
- **Épica:** EPIC-004
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `api` + `db`

---

## 1. Declaración de la Historia
- **Como** Social Media Manager del sello,
- **Quiero** programar la difusión de copys y creativos aprobados a través de redes conectadas,
- **Para que** pueda automatizar el calendario de publicaciones sin salir de la plataforma desktop.

---

## 2. Criterios de Aceptación
1. **Protocolo Media Handshake:** Sube el activo local a la nube de Postiz (S3/R2) vía Pre-Signed URL con clave inmutable por hash SHA-256 (`content_hash`).
2. **Asignación Temporal y Canales:** Asigna fecha, hora y canales específicos (Instagram, TikTok, X, YouTube, Facebook) vinculados al cronograma del release.
3. **Persistencia y Desacoplamiento Outbox:** Encola la operación en `cloud_sync_queue` para garantizar publicación fiable incluso si la app se encuentra offline al momento de programar.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/distribution/media-handshake-service.ts`:
  ```typescript
  export interface MediaHandshakeRequest {
    assetId: string;
    contentHash: string;
    mimeType: string;
    fileSizeBytes: number;
  }
  export function createHandshakePayload(request: MediaHandshakeRequest): HandshakePayload;
  ```

### Capa 4: Infraestructura
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-scheduled-post-repository.ts`:
  ```typescript
  export interface ScheduledPostRepository {
    createPost: (input: CreateScheduledPostInput) => Promise<ScheduledPostRecord>;
    getPostById: (id: string) => Promise<ScheduledPostRecord | null>;
    listPostsByReleaseId: (releaseId: string) => Promise<ScheduledPostRecord[]>;
    updatePostStatus: (id: string, status: PostStatus, externalId?: string) => Promise<ScheduledPostRecord>;
  }
  ```
