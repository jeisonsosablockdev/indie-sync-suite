# STORY-003-04: Maquetación Tipográfica Vectorial sobre Portadas (HU-3.4)

## Metadatos
- **ID:** `STORY-003-04`
- **Historia de Usuario:** HU-3.4
- **Épica:** EPIC-003
- **Estado:** `APPROVED`
- **Asignación:** `frontend`

---

## 1. Declaración de la Historia
- **Como** Diseñador o A&R,
- **Quiero** superponer el título del tema y el nombre del artista con tipografía limpia, nítida y posicionamiento exacto sobre la imagen generada,
- **Para que** la portada final cumpla con los estándares tipográficos profesionales de los DSPs sin depender del texto defectuoso de los modelos de imagen.

---

## 2. Criterios de Aceptación
1. **Tipografías Oficiales del Artista:** Permite utilizar las fuentes declaradas en el perfil del Brand Vault o seleccionar tipografías estándar del sistema.
2. **Controles de Composición y Estilo:**
   - Posicionamiento: Superior (`TOP`), Centro (`CENTER`), Inferior (`BOTTOM`) con ajuste fino de márgenes.
   - Alineación: Izquierda, Centro, Derecha.
   - Tamaño de fuente, color hexadecimal contrastante y sombra protectora (*drop-shadow*) para legibilidad sobre fondos complejos.
3. **Exportación a 3000×3000 px:** Renderizado vectorial en alta resolución exportable a PNG/JPG sin pérdida de nitidez, cumpliendo los requisitos técnicos de distribución en Spotify y Apple Music.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/creative/typography-compositor.ts`:
  ```typescript
  export interface TypographyLayout {
    titleBounds: { x: number; y: number; width: number; height: number };
    artistBounds: { x: number; y: number; width: number; height: number };
    contrastColor: string;
  }
  ```

### Capa 1: Presentación
- `apps/web/src/components/creative/typography-stamping-canvas.tsx`: Canvas interactivo con previsualización en tiempo real.
