# STORY-003-01: Generación de Assets Anclados a la Marca (HU-3.1)

## Metadatos
- **ID:** `STORY-003-01`
- **Historia de Usuario:** HU-3.1
- **Épica:** EPIC-003
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `api`

---

## 1. Declaración de la Historia
- **Como** Encargado de Marketing o Diseñador de un sello discográfico independiente,
- **Quiero** generar directrices visuales y piezas gráficas en las 3 dimensiones maestras de la industria musical (1:1 a 3000px, 9:16 a 1080x1920px y 16:9 a 1920x1080px) vinculadas a un lanzamiento específico,
- **Para que** obtenga piezas visuales profesionales que respeten estrictamente la paleta cromática, texturas y estética del Brand Vault sin alucinaciones de IA.

---

## 2. Criterios de Aceptación
1. **Dimensiones Oficiales de la Industria:** Soporte estricto para:
   - `COVER_1_1`: 3000×3000 px (DSPs como Spotify, Apple Music, Tidal).
   - `CANVAS_9_16`: 1080×1920 px (Spotify Canvas, Instagram Reels, TikTok, YouTube Shorts).
   - `BANNER_16_9`: 1920×1080 px (Cabeceras de YouTube, Twitter/X y perfiles de artista).
2. **Inyección Contextual de 3 Niveles:** El compilador de prompts inyecta:
   - *Nivel 1 (Sello):* Identidad global del sello, directrices de calidad.
   - *Nivel 2 (Artista):* Paleta de colores primarios y de acento, tipografías y arquetipo visual.
   - *Nivel 3 (Lanzamiento):* Narrativa lírica, mood sonoro y estética particular del release.
3. **Conector Multimodal Seguro:** Utiliza el `AiProviderRegistry` para invocar proveedores configurados por el usuario (OpenAI DALL-E, Stability/Flux) de forma no bloqueante con manejo adecuado de timeouts.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/creative/creative-schemas.ts`:
  ```typescript
  export const TargetFormatSchema = z.enum(['COVER_1_1', 'CANVAS_9_16', 'BANNER_16_9', 'SOCIAL_COPY']);
  export type TargetFormat = z.infer<typeof TargetFormatSchema>;

  export const FormatDimensions: Record<TargetFormat, { width: number; height: number; aspectRatio: string }> = {
    COVER_1_1: { width: 3000, height: 3000, aspectRatio: '1:1' },
    CANVAS_9_16: { width: 1080, height: 1920, aspectRatio: '9:16' },
    BANNER_16_9: { width: 1920, height: 1080, aspectRatio: '16:9' },
    SOCIAL_COPY: { width: 0, height: 0, aspectRatio: 'N/A' }
  };
  ```

### Capa 1: Presentación
- `apps/web/src/components/creative/creative-studio-view.tsx`: Contenedor principal con selector de formato y visualizador de estado.
