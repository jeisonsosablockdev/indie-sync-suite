# STORY-004-02: Ejecución de Microcampañas de Pauta ($20–$100 USD) (HU-4.2)

## Metadatos
- **ID:** `STORY-004-02`
- **Historia de Usuario:** HU-4.2
- **Épica:** EPIC-004
- **Estado:** `APPROVED`
- **Asignación:** `frontend` + `api`

---

## 1. Declaración de la Historia
- **Como** Encargado de Marketing,
- **Quiero** lanzar campañas publicitarias de bajo presupuesto directamente hacia el enlace de pre-save o streaming,
- **Para que** impulse la tracción del lanzamiento sin intermediarios de agencias de pauta.

---

## 2. Criterios de Aceptación
1. **Rango Presupuestario Estricto:** Valida que el presupuesto se encuentre estrictamente entre $20 y $100 USD.
2. **Invocación Segura BYOK:** Invoca las APIs de pauta (Meta Ads y TikTok Ads) a través del microservicio de Postiz con las credenciales BYOK resguardadas del usuario.
3. **Confirmación Obligatoria:** Exige confirmación explícita del gasto y muestra el estado de la campaña en la plataforma.

---

## 3. Contratos de Arquitectura en 4 Capas

### Capa 3: Dominio
- `apps/web/src/lib/pipelines/distribution/ad-campaign-calculator.ts`:
  ```typescript
  export interface AdCampaignParams {
    budgetUsd: number;
    platform: 'META_ADS' | 'TIKTOK_ADS';
    destinationUrl: string;
    targetAudience: string;
    startDate: string;
    endDate: string;
  }
  export function validateAndAllocateAdBudget(params: AdCampaignParams): AdAllocationResult;
  ```

### Capa 1: Presentación
- `apps/web/src/components/distribution/micro-campaign-modal.tsx`: Modal interactivo con slider de presupuesto ($20–$100 USD) y desglose de proyección de clics.
