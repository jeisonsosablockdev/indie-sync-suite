# STORY-003-02: Exploración y Curaduría en Lote (HU-3.2)

## Metadatos
- **ID:** `STORY-003-02`
- **Historia de Usuario:** HU-3.2
- **Épica:** EPIC-003
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `db`

---

## 1. Declaración de la Historia
- **Como** Creador o A&R,
- **Quiero** generar y visualizar 4 variantes simultáneas de diseño en una cuadrícula de curaduría rápida,
- **Para que** pueda comparar alternativas visuales en paralelo y seleccionar la mejor opción sin procesos repetitivos individuales.

---

## 2. Criterios de Aceptación
1. **Lote de 4 Variantes Paralelas:** Ejecuta la generación en paralelo produciendo un lote (`generation_batches`) con 4 opciones visuales basadas en distintas semillas o leves variaciones compositivas.
2. **Acciones de Triage Instantáneo:**
   - `Aprobar`: Marca la pieza con `curation_status = 'APPROVED'`, la asocia a una tarea del planificador (`task_id`) y la envía al Repositorio Central de Activos.
   - `Descartar`: Marca con `curation_status = 'DISCARDED'`.
   - `Regenerar`: Desencadena un nuevo lote manteniendo los elementos favoritos.
3. **Persistencia Transaccional en SQLite:** Las acciones de curaduría se persisten atómicamente a través de `sqlite-batch-repository.ts`.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 4: Infraestructura
- `apps/web/src/lib/infrastructure/db/repositories/sqlite-batch-repository.ts`:
  ```typescript
  export interface BatchRepository {
    createBatch(batch: CreateBatchInput): GenerationBatch;
    getBatchById(id: string): GenerationBatch | null;
    updateBatchStatus(id: string, status: BatchStatus): void;
  }
  ```

### Capa 1: Presentación
- `apps/web/src/components/creative/batch-generation-grid.tsx`: Renderiza la cuadrícula de 4 tarjetas con controles táctiles de aprobación.
