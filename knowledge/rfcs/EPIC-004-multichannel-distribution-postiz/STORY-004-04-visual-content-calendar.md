# STORY-004-04: Calendario Visual de Contenidos Sincronizado (HU-4.4)

## Metadatos
- **ID:** `STORY-004-04`
- **Historia de Usuario:** HU-4.4
- **Épica:** EPIC-004
- **Estado:** `APPROVED`
- **Asignación:** `frontend`

---

## 1. Declaración de la Historia
- **Como** Planificador de marketing,
- **Quiero** visualizar en una cuadrícula mensual/semanal todas las publicaciones programadas respecto al día del estreno,
- **Para que** pueda detectar vacíos de contenido o sobrecargas en la comunicación de la campaña.

---

## 2. Criterios de Aceptación
1. **Cuadrícula Mensual/Semanal:** Muestra un calendario interactivo con vista mensual y semanal drag-and-drop.
2. **Anclaje al Release Day ($T-0$):** Destaca visualmente el "Release Day" como el hito central de la campaña.
3. **Reprogramación Reactiva:** Permite cambiar fechas de publicaciones arrastrándolas o editándolas, recalculando automáticamente en Postiz.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/distribution/calendar-slot-calculator.ts`:
  ```typescript
  export interface CalendarSlotOptions {
    targetReleaseDate: string;
    existingPosts: ScheduledPostSummary[];
  }
  export function computeRecommendedCalendarSlots(options: CalendarSlotOptions): CalendarSlotAllocation[];
  ```

### Capa 1: Presentación
- `apps/web/src/components/distribution/social-calendar-view.tsx`: Vista completa de calendario mensual/semanal con etiquetas de canal e insignias de estado.
