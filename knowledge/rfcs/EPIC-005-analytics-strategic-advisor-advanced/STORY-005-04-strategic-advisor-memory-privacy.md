# RFC: STORY-005-04 - Asesoría Estratégica con Memoria y Control de Privacidad (HU-5.2)

## 1. Declaración del Requerimiento
Como Usuario, quiero dialogar con un asesor estratégico inteligente que recuerde decisiones anteriores y analice mis métricas actuales, con la garantía de que mis conversaciones se almacenan localmente y puedo borrarlas de forma irreversible en cualquier momento.

## 2. Criterios de Aceptación
1. El asesor responde consultas interpretando el contexto de la conversación y las métricas de rendimiento actuales del lanzamiento ($T-0$, streams, CPA, audiencia).
2. Memoria conversacional estructurada en SQLite local (`advisor_conversations`, `advisor_messages`).
3. El usuario puede consultar el historial de conversaciones, cambiar entre sesiones y crear nuevas consultas.
4. Botón de purga irreversible (Hard Delete) que elimina permanentemente los registros de mensajes de la base de datos sin dejar copias ocultas (cumplimiento estricto con GDPR y privacidad local).

## 3. Contratos de Datos & Capas
- **Capa 1 (Presentación)**: `apps/web/src/components/analytics/strategic-advisor-chat.tsx`
- **Capa 2 (Aplicación)**: `apps/web/src/lib/hooks/use-strategic-advisor.ts`
- **Capa 3 (Dominio)**: `apps/web/src/lib/pipelines/analytics/analytics-schemas.ts` (esquema `AdvisorMessageSchema`)
- **Capa 4 (Infraestructura)**: `apps/web/src/lib/infrastructure/db/repositories/sqlite-advisor-conversation-repository.ts`
