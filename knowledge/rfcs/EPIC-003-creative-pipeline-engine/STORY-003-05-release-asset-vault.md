# STORY-003-05: Repositorio Central de Activos Aprobados (HU-3.5)

## Metadatos
- **ID:** `STORY-003-05`
- **Historia de Usuario:** HU-3.5
- **Épica:** EPIC-003
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `db`

---

## 1. Declaración de la Historia
- **Como** Miembro del equipo de marketing,
- **Quiero** acceder a una galería unificada de todos los artes, videos y copys aprobados para un lanzamiento,
- **Para que** los activos estén listos para ser programados en redes sin búsquedas dispersas en carpetas locales.

---

## 2. Criterios de Aceptación
1. **Galería Organizada por Formato:** Vistas filtrables por:
   - Portadas 1:1 (`COVER_1_1`)
   - Lienzos y Videos 9:16 (`CANVAS_9_16`)
   - Banners 16:9 (`BANNER_16_9`)
   - Copys y Guiones (`SOCIAL_COPY`)
2. **Identificadores Inmutables (SHA-256):** A cada activo registrado se le calcula y almacena su `content_hash` criptográfico.
3. **Preparación para Media Handshake (Épica 4):** La tabla `creative_assets` mantiene el registro de estado y hashes listo para generar URLs prefirmadas hacia Cloudflare R2 / S3 en la integración con Postiz.
4. **Descarga en Alta Resolución:** Permite descargar el archivo procesado original en 1-clic con nomenclatura normalizada (`<artista>-<track>-<formato>.<ext>`).

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/creative/asset-hasher.ts`:
  ```typescript
  export function computeAssetHash(data: Buffer | string): string;
  ```

### Capa 4: Infraestructura
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-creative-asset-repository.ts`:
  ```typescript
  export interface CreativeAssetRepository {
    saveAsset(asset: CreateCreativeAssetInput): CreativeAsset;
    getAssetsByReleaseId(releaseId: string, format?: TargetFormat): CreativeAsset[];
    getAssetByHash(contentHash: string): CreativeAsset | null;
  }
  ```

### Capa 1: Presentación
- `apps/web/src/components/creative/asset-vault-gallery.tsx`: Grilla interactiva de visualización y descarga de activos aprobados.
