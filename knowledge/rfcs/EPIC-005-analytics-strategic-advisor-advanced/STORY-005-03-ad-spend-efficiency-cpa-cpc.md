# RFC: STORY-005-03 - Cálculo de Eficiencia y Retorno de Pauta (HU-5.5)

## 1. Declaración del Requerimiento
Como Encargado de Marketing o A&R, quiero visualizar el costo unitario por pre-save (CPA), por clic (CPC) y la tasa de conversión derivada de las microcampañas publicitarias ($20–$100 USD en Meta/TikTok Ads), para evaluar la rentabilidad del presupuesto publicitario invertido y optimizar la pauta.

## 2. Criterios de Aceptación
1. Algoritmo puramente matemático (`ad-efficiency-calculator.ts`) que cruza el gasto registrado en `ad_campaigns` con los clics y pre-saves obtenidos en el Smart Link.
2. Cálculo determinista de:
   - $\text{CPA} = \frac{\text{Gasto Total (USD)}}{\text{Pre-saves Totales}}$
   - $\text{CPC} = \frac{\text{Gasto Total (USD)}}{\text{Clics Totales}}$
   - $\text{Tasa de Conversión (CR \%)} = \left(\frac{\text{Pre-saves Totales}}{\text{Clics Totales}}\right) \times 100$
3. Manejo seguro de divisiones por cero (retornando `$0.00` o `0%` cuando no existan eventos).
4. Comparador de variantes creativas para determinar el anuncio más eficiente con badge visual "Top Performer".

## 3. Contratos de Datos & Capas
- **Capa 1 (Presentación)**: `apps/web/src/components/analytics/ad-efficiency-card.tsx`
- **Capa 2 (Aplicación)**: `apps/web/src/lib/hooks/use-ad-efficiency.ts`
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/analytics/ad-efficiency-calculator.ts`
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/db/repositories/sqlite-ad-campaign-repository.ts` (unión con métricas de campaña)
