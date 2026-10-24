# STORY-004-06: Tools de Distribución para el Asistente Lateral (HU-6.1 v4)

## Metadatos
- **ID:** `STORY-004-06`
- **Historia de Usuario:** HU-6.1 (v4)
- **Épica:** EPIC-004
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `api`

---

## 1. Declaración de la Historia
- **Como** Usuario,
- **Quiero** programar publicaciones y activar campañas mediante comandos directos en el chat lateral,
- **Para que** agilice la distribución del contenido aprobado en lenguaje natural.

---

## 2. Criterios de Aceptación
1. **Catálogo de Tools Agénticas:**
   - `programar_publicacion(releaseId, assetId, plataforma, fechaHora)`
   - `lanzar_campana_pauta(releaseId, plataforma, presupuestoUsd, urlDestino)`
   - `consultar_calendario_posts(releaseId)`
2. **Guardrails Tier 2 Obligatorios:** Toda invocación a `lanzar_campana_pauta` exige confirmación explícita con desglose presupuestario antes de invocar la API externa.
3. **Badges de Streaming en Chat:** Renderiza tarjetas interactivas de previsualización en el chat lateral.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/distribution/tools/distribution-tools.ts`:
  ```typescript
  export const distributionTools: AgentToolDefinition[];
  ```

### Capa 1: Presentación
- `apps/web/src/components/assistant/distribution-tool-badge.tsx`: Tarjeta interactiva en el streaming del chat.
