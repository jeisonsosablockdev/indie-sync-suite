# Problem Spec: analytics-strategic-advisor-advanced (EPIC-05)

## What problem exists
Los sellos discográficos independientes y artistas autogestionados enfrentan una dispersión masiva de datos analíticos tras lanzar un proyecto musical. Actualmente, los datos de reproducciones y oyentes residen en silos cerrados (Spotify for Artists, Apple Music for Artists, paneles de distribuidoras como DistroKid o TuneCore), mientras que las métricas de interacción social y de microcampañas publicitarias ($20–$100 USD en Meta Ads o TikTok Ads) residen en dashboards independientes.

Esto genera los siguientes problemas críticos:
1. **Ceguera de Retorno Real (ROI / CPA)**: No existe una correlación automática entre el presupuesto publicitario invertido en microcampañas y los pre-saves o escuchas reales generadas en DSPs.
2. **Dependencia de APIs Cerradas**: Las plataformas de streaming (Spotify/Apple Music) imponen barreras extremas o cuotas cerradas para APIs analíticas directas, imposibilitando la sincronización automatizada para artistas independientes sin ingesta estructurada de reportes CSV.
3. **Falta de Detección Temprana de Anomalías**: El equipo no recibe alertas tempranas cuando una canción pierde tracción (caídas > 30% en reproducciones o interacciones) durante la ventana crítica de estreno ($T-0$ a $T+14$).
4. **Ausencia de Asesoría Estratégica con Memoria Local**: Los modelos de IA genéricos carecen de memoria sobre lanzamientos previos, métricas históricas del sello y decisiones tomadas, o comprometen la privacidad comercial del artista al enviar datos analíticos confidenciales a servidores en la nube sin control del usuario.
5. **Rigidez de Paneles de Analítica**: No existe un mecanismo para que usuarios avanzados o sellos con APIs propietarias puedan crear tableros personalizados de métricas de forma autónoma a partir de esquemas JSON dinámicos.

## Why it matters
La ventana de lanzamiento de un fonograma ($T-14$ a $T+21$) concentra más del 70% del potencial de descubrimiento orgánico y editorial en DSPs (algoritmos Release Radar, Discover Weekly, Radio).
- Sin un cálculo inmediato de CPA (Costo por Adquisición) y CPC (Costo por Clic), los presupuestos publicitarios indie se diluyen en anuncios ineficientes sin capacidad de pivotar hacia los creativos ganadores.
- La ingesta local de reportes CSV permite democratizar la analítica profesional de streaming sin costes mensuales de plataformas SaaS externas (Chartmetric, Soundcharts) que cobran tarifas inaccesibles para el sector independiente.
- Mantener la memoria analítica y las conversaciones en SQLite local garantiza soberanía de datos y cumplimiento con privacidad (GDPR / supresión local irreversible), protegiendo la confidencialidad financiera de los sellos.

## What outcome is expected
Al completar la Épica 5, Indie-Sync Suite dispondrá de un sistema integral de inteligencia analítica local-first gobernado por la arquitectura funcional de 4 capas:
1. **Dashboard Centralizado de Rendimiento (HU-5.1)**: Vista unificada de métricas consolidadas (streams, clics, conversiones, engagement) con segmentación temporal por fases ($T-14$ a $T-1$, $T-0$ a $T+7$, $T+8$ en adelante) y refresco local.
2. **Parser e Ingesta de Reportes CSV de DSPs (HU-5.4)**: Ingestor determinista y tolerante a fallos para exportaciones estándar de Spotify for Artists, Apple Music for Artists, DistroKid y distribuidoras, mapeando reproducciones, oyentes, saves y países a SQLite.
3. **Motor de Eficiencia Publicitaria CPA/CPC (HU-5.5)**: Cálculo matemático puro cruzando el gasto publicitario de Meta/TikTok Ads (Épica 4) con los pre-saves y clics para evaluar el retorno real por variante de anuncio.
4. **Asesor Estratégico Local con Memoria y Privacidad (HU-5.2)**: Chat inteligente contextualizado con las analíticas del lanzamiento, memoria conversacional en SQLite y comando de purga irreversible de datos.
5. **Detector Proactivo de Anomalías y Sugerencias Accionables (HU-5.6)**: Motor heurístico que identifica desviaciones > 30% y emite tarjetas tácticas accionables con un solo clic (ej. reasignación presupuestaria o refuerzo de publicaciones).
6. **Constructor Autónomo de Paneles API (HU-5.3 - Modo Avanzado)**: Intérprete dinámico de endpoints REST que detecta series temporales y métricas numéricas a partir de respuestas JSON y renderiza tarjetas visuales configurables.
7. **Herramientas de Analítica para el Asistente Lateral (HU-6.1 v5)**: Tools agénticas (`consultar_metricas_rendimiento`, `analizar_eficiencia_pauta`, `generar_panel_custom`) para interactuar con los datos en lenguaje natural.

## What gaps exist today
1. **Falta de Modelo de Datos Analítico en SQLite**: No existen tablas para `streaming_reports`, `streaming_metrics`, `campaign_analytics`, `advisor_conversations`, `advisor_messages` ni `custom_api_dashboards`.
2. **Ausencia de Parser CSV**: No hay un servicio en el dominio para procesar, validar encabezados y normalizar archivos CSV de DSPs.
3. **Falta de Motor de Fórmulas Financieras/CPA**: No se dispone de un calculador determinista de CPA, CPC y tasa de conversión entre ad campaigns y métricas de streaming.
4. **Ausencia de Historial Conversacional Persistente**: El asistente lateral actual no almacena mensajes estructurados en SQLite con capacidad de borrado selectivo o purga irreversible.
5. **Sin Detección de Anomalías**: No existen comparadores de promedios móviles ni reglas heurísticas para caídas de tracción.

## What questions remain open
1. **¿Qué esquemas CSV específicos se soportarán de inicio?** Se soportarán los formatos oficiales de Spotify for Artists (Canciones / Audiencia por País), DistroKid (Reportes de Streaming) y formato genérico normalizado.
2. **¿Cómo se maneja la privacidad en el asesor?** Las conversaciones se almacenan exclusivamente en la base de datos local SQLite (`node:sqlite`). Se provee un botón de purga irreversible (`DELETE FROM advisor_conversations WHERE id = ?`).
3. **¿Cuál es el umbral para las alertas de anomalía?** Una variación negativa > 30% respecto al promedio móvil de los últimos 7 días o una tasa de conversión de anuncio inferior al 0.5%.
