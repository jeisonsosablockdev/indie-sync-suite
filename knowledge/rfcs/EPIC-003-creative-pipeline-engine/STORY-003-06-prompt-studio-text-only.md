# STORY-003-06: Estudio y Gestión de Prompts Editables (HU-3.6)

## Metadatos
- **ID:** `STORY-003-06`
- **Historia de Usuario:** HU-3.6
- **Épica:** EPIC-003
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `db` + `api`

---

## 1. Declaración de la Historia
- **Como** Creador, Director Creativo o Artista que trabaja con herramientas externas (Midjourney, Runway, Kling, Sora, Flux local) o que no dispone de cuotas de API de imagen,
- **Quiero** generar, inspeccionar, editar, versionar, actualizar y copiar prompts en texto plano enriquecidos con la identidad de marca (Nivel 1, 2 y 3) al portapapeles con selectores de formato de plataforma,
- **Para que** pueda utilizar cualquier motor generativo externo sin depender de llamadas directas a APIs de renderizado y mantener un repositorio persistente y editable de los prompts maestros aprobados para el lanzamiento.

---

## 2. Criterios de Aceptación
1. **Compilador y Editor Interactivo de Prompts:**
   - Desglosa visualmente el prompt en bloques modulares:
     - *Sujeto & Narrativa Lírica*
     - *Atmósfera & Paleta Cromática Hexadecimal*
     - *Estilo Visual & Iluminación*
     - *Composición de Cámara & Plano*
     - *Prompt Negativo*
   - Permite al usuario editar libremente cualquier parte del texto en un editor enriquecido.
2. **Persistencia, Historial y Actualización en SQLite:**
   - Permite guardar y actualizar (`UPDATE`) prompts asociados al release en la tabla `creative_prompts`.
   - Soporte para versionado (`version: 1, 2, ...`) para no perder borradores al refinar conceptos.
   - Posibilidad de marcar prompts como favoritos (`is_favorite = 1`).
3. **Formateo y Copiado con 1-Clic para Plataformas Externas:**
   - **Preset Midjourney v6:** Añade modificadores automáticos de ratio y estilo:
     `--ar 1:1 --v 6.1 --style raw` (para portadas) o `--ar 9:16 --v 6.1` (para lienzos/reels).
   - **Preset Flux / Stable Diffusion:** Separa el prompt positivo del prompt negativo en cajas independientes con pesos numéricos.
   - **Preset Video Prompts (Runway / Kling / Luma):** Genera descripciones cinemáticas con movimiento de cámara y progresión temporal.
   - **Preset Texto Plano (Neutral):** Para consultar en ChatGPT, Claude o Gemini.
4. **Modo 100% Autónomo (Cero Gasto de APIs de Imagen):**
   - El módulo creativo es totalmente operativo y funcional sin que el usuario requiera ingresar ninguna API key de OpenAI o Stability en el OS Keychain.
5. **Cierre de Ciclo con Importación:**
   - El usuario puede vincular la imagen que generó externamente arrastrando el archivo resultante a la aplicación, quedando automáticamente asociada al prompt y lista para la maquetación tipográfica (HU-3.4) y el Asset Vault (HU-3.5).

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/creative/prompt-schemas.ts`:
  ```typescript
  export const PlatformPresetSchema = z.enum(['MIDJOURNEY_V6', 'FLUX_SD', 'RUNWAY_KLING', 'RAW_TEXT']);
  export type PlatformPreset = z.infer<typeof PlatformPresetSchema>;

  export interface MasterPrompt {
    subject: string;
    atmosphereColor: string;
    styleLighting: string;
    cameraComposition: string;
    negativePrompt?: string;
    targetFormat: TargetFormat;
    platformPreset: PlatformPreset;
  }
  ```
- `apps/web/src/lib/pipelines/creative/platform-prompt-formatter.ts`:
  ```typescript
  export function formatPromptForPlatform(prompt: MasterPrompt, preset: PlatformPreset): string;
  ```

### Capa 4: Infraestructura
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-creative-prompt-repository.ts`:
  ```typescript
  export interface CreativePromptRepository {
    savePrompt(input: CreatePromptInput): CreativePrompt;
    updatePrompt(id: string, text: string, negativePrompt?: string): CreativePrompt;
    getPromptsByReleaseId(releaseId: string): CreativePrompt[];
    toggleFavorite(id: string): void;
  }
  ```

### Capa 1: Presentación
- `apps/web/src/components/creative/prompt-studio-panel.tsx`: Panel con editor de bloques, botón de copiado 1-clic y selectores de plataforma.
