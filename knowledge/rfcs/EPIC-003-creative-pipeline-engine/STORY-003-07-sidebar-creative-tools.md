# STORY-003-07: Tools Creativas para el Asistente Lateral (HU-6.1 v3)

## Metadatos
- **ID:** `STORY-003-07`
- **Historia de Usuario:** HU-6.1 (v3)
- **Épica:** EPIC-003
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `api`

---

## 1. Declaración de la Historia
- **Como** Usuario operando desde el chat en la barra lateral,
- **Quiero** solicitar la creación de piezas visuales, textos promocionales y copiado de prompts mediante lenguaje natural,
- **Para que** el asistente coordine la generación de contenidos en un solo paso conversacional sin tener que navegar por todos los menús del estudio creativo.

---

## 2. Criterios de Aceptación
1. **Catálogo Extensible de Tools Creativas:**
   - `generar_portada(releaseId, formato, estilo)`: Dispara la compilación del prompt y generación de portada.
   - `generar_copy(releaseId, fase, canal)`: Produce texto promocional adaptado a la red social seleccionada.
   - `copiar_prompt(releaseId, formato, plataforma)`: Devuelve el texto exacto del prompt formateado listo para copiar.
   - `actualizar_prompt(promptId, nuevoTexto)`: Permite refinar el texto persistido en SQLite mediante lenguaje natural.
   - `listar_activos_aprobados(releaseId)`: Devuelve el resumen de piezas aprobadas en el Asset Vault.
2. **Guardrails y Clasificación de Riesgo:**
   - Las operaciones de generación de imagen que consuman API externa se clasifican como `HIGH_RISK` exigiendo confirmación en modal.
   - Las operaciones de consulta y copiado de prompt en texto plano son `LOW_RISK` con ejecución inmediata.
3. **Previsualización Interactiva en Chat:** Renderiza badges y tarjetas interactivas de previsualización directamente en el hilo conversacional con botón de aprobación inmediata.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/creative/tools/creative-tools.ts`:
  ```typescript
  export const creativeTools: AgentToolDefinition[];
  ```

### Capa 1: Presentación
- `apps/web/src/components/assistant/creative-tool-badge.tsx`: Componente de renderizado de tarjeta en el streaming del chat.
