# Problem Spec: multichannel-distribution-postiz (Épica 4)

## What problem exists
1. **Dispersión Operativa en Publicación:** Los sellos y artistas independientes, tras aprobar portadas, videos 9:16 y copys de campaña en el Creative Pipeline (Épica 3), deben descargar manualmente los activos y navegar individualmente por múltiples redes sociales (Instagram, TikTok, X, YouTube, Facebook) o herramientas SaaS costosas para programar el contenido.
2. **Desincronización con el Cronograma de Lanzamiento:** Las herramientas convencionales de calendarización social no están integradas con el cronograma estratégico ($T-14$ teaser, $T-7$ pre-save, $T-0$ drop day, $T+7$ playlist push). Si un hito crítico se desplaza (ej. retraso de master o aprobación de DSPs), todas las publicaciones en redes quedan desfasadas y deben reprogramarse manualmente una a una.
3. **Carencia de un Media Handshake Inmutable:** La subida de imágenes de alta resolución (3000×3000 px) y videos hacia la nube carece de un protocolo desacoplado y seguro que vincule el hash criptográfico SHA-256 (`content_hash`) generado en la Épica 3 con URLs prefirmadas en Cloudflare R2 / S3.
4. **Barrera Técnica en Microcampañas de Pauta:** Lanzar campañas de anuncios de bajo presupuesto ($20 a $100 USD) para impulsar el pre-save o el streaming en Meta Ads y TikTok Ads requiere operar paneles de anunciante complejos pensados para agencias, alejando a los creadores independientes de la pauta publicitaria efectiva.
5. **Fragilidad ante Fallos Transitorios de Red y Modo Offline:** Si la conexión a internet falla o las APIs de redes devuelven errores temporales al momento de programar, la operación se pierde sin una cola transaccional Outbox con reintentos exponenciales y alertas audibles/visibles.

## Why it matters
- **Sincronización Crítica de Campaña:** El impacto comercial de un lanzamiento musical depende de la coordinación exacta de contenidos entre el día del estreno ($T-0$) y las semanas de expectativa ($T-14$ a $T-7$). Una publicación a destiempo diluye el impulso en los algoritmos de Spotify y Apple Music.
- **Soberanía y Ahorro en Pauta:** Permitir al usuario inyectar micro-presupuestos ($20–$100 USD) directamente desde su escritorio utilizando sus credenciales BYOK (Meta/TikTok Ads) democratiza la adquisición de oyentes sin comisiones de intermediarios.
- **Resiliencia Local-First:** El sello debe poder trabajar offline o con conexiones inestables, sabiendo que la cola Outbox (`cloud_sync_queue`) garantizará la entrega idempotente hacia Postiz Cloud en cuanto se restablezca la conectividad.

## What outcome is expected
1. **OAuth Hub Unificado (HU-4.3):** Panel de conexiones seguras hacia perfiles sociales y cuentas publicitarias con monitoreo de estado de salud en tiempo real (`CONNECTED`, `EXPIRED`, `DISCONNECTED`) y renovación con 1-clic.
2. **Protocolo Media Handshake & Programación Multicanal (HU-4.1):** Subida atómica de activos aprobados mediante Pre-Signed URLs hacia Cloudflare R2 / S3 indexadas por hash SHA-256 y calendarización en Postiz Headless vinculada al cronograma del release.
3. **Calendario Visual de Contenidos (HU-4.4):** Cuadrícula mensual/semanal drag-and-drop con anclaje visual del hito central $T-0$ (Release Day) y reprogramación reactiva.
4. **Motor de Microcampañas de Pauta ($20–$100 USD) (HU-4.2):** Wizard minimalista para activar anuncios en Meta Ads y TikTok Ads hacia el enlace de pre-save/streaming con credenciales BYOK y confirmación de gasto.
5. **Cola Outbox Resiliente y Alertas de Fallos (HU-4.5):** Procesamiento en segundo plano con hasta 3 reintentos con retroceso exponencial, registro de auditoría y notificaciones de fallos persistentes (*dead-letter*).
6. **Tools de Distribución para el Asistente Lateral (HU-6.1 v4):** Integración conversacional (`programar_publicacion`, `lanzar_campana_pauta`, `consultar_calendario_posts`) con Guardrails Tier 2 para autorizar presupuestos de pauta.

## What gaps exist today
- No existe el esquema relacional de conexiones sociales, publicaciones programadas y campañas de pauta en SQLite (`006_distribution_postiz.sql`).
- La cola Outbox existente (`cloud_sync_queue` de la Épica 1) requiere el despachador de eventos y worker de sincronización con Postiz Cloud (`cloud-sync-worker.ts`).
- Falta el cliente API desacoplado y testeable para la API Headless de Postiz Cloud (`postiz-api-client.ts`).
- No existe la vista de calendario mensual/semanal para publicaciones ni el gestor de cuentas sociales conectadas.

## What questions remain open
- ¿Cómo se maneja la renovación de tokens OAuth en entorno Tauri desktop? (Se usará apertura del navegador por defecto del sistema apuntando a Postiz Cloud Auth Callback, con webhook/polling local seguro de finalización).
- ¿Qué umbral de gasto exige confirmación obligatoria en el Guardrail de pauta? (Cualquier importe > $0 USD exige confirmación explícita con desglose de plataforma y link destino).
