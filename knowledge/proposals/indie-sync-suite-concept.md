---
okf_version: "0.1"
type: Specification
id: SPEC-ISS-V3.1
title: "INDIE-SYNC SUITE: Arquitectura y Especificación Funcional V3.1"
status: canonical-concept
owner: "czambrano (jaymusicmachine)"
created_at: 2026-09-06
updated_at: 2026-09-06
tags: [specification, concept, indie-sync-suite, architecture, tauri, brand-vault, plane, open-generative-ai, postiz, byok, mcp, epics]
---

# INDIE-SYNC SUITE: Arquitectura y Especificación Funcional V3.1

> **Estado**: Documento Canónico de Especificación & Concepto Base (Aprobado)  
> **Propietario / Owner**: Carlos Zambrano (`czambrano` / `jaymusicmachine`)  
> **Cliente de Escritorio**: **Tauri** + **Next.js 16**  
> **Topología**: Híbrido Pragmático (Desktop Studio Local + Cloud Distribution Hub)

---

## 1. Visión General del Sistema

**Indie-Sync Suite** es un sistema operativo integral y modular diseñado para sellos discográficos independientes y creadores musicales. Su propósito es estructurar, automatizar y potenciar la planificación estratégica de lanzamientos, la consistencia de marca, la generación de contenido multimedia, la distribución programática, la analítica unificada y la toma de decisiones asistida por agentes autónomos de Inteligencia Artificial (BYOK - Bring Your Own Key).

La plataforma unifica en un solo entorno de trabajo las tareas fragmentadas que actualmente se gestionan mediante herramientas dispersas (hojas de cálculo, tableros genéricos, múltiples generadores de IA y canales de mensajería), proporcionando un flujo continuo y coherente a lo largo de todo el ciclo de vida del lanzamiento musical.

---

## 2. Estrategia de Código Abierto e Integración de Ecosistema

Para acelerar el desarrollo sin reinventar la rueda, la suite adopta e integra paradigmas probados de proyectos open-source líderes bajo una **topología híbrida pragmática** (Aplicación de escritorio nativa en **Tauri** para el Sello/Manager + Servicio en la nube para distribución 24/7 y colaboración).

> [!IMPORTANT]
> **Descarte de Plane como dependencia de código:** Inicialmente se evaluó `makeplane/plane` para la gestión de proyectos. No obstante, su infraestructura (12 contenedores Docker, Django/Python, Celery, RabbitMQ, Redis, PostgreSQL y microservicios Live) representa una sobrecarga técnica inviable para una app de escritorio ligera.  
> Por lo tanto, **el repositorio de Plane se descarta como código importado**. En su lugar, el **Motor de Planificación y Gestión se construye 100% nativo y ligero en Next.js + SQLite/Tauri** (estableciendo su base de datos y modelo de entidades en la **Épica 1**).  
> 
> Los **únicos dos proyectos de código abierto que se clonan, importan y ejecutan como código** son:

| Base de Referencia / Fork | Módulo en Indie-Sync Suite | Adaptaciones y Responsabilidad Específica |
| :--- | :--- | :--- |
| [**Open Generative AI**](https://github.com/anil-matcha/open-generative-ai) (`anil-matcha/open-generative-ai`) | **Pipeline Creativo Multimedia & Núcleo BYOK** | Clonado e integrado en la app de escritorio. Bóveda centralizada de credenciales (BYOK), inyección obligatoria del Brand Vault en system prompts, presets de resolución para la industria (1:1 a 3000px, 9:16 Canvas/Reels, 16:9 Banners) y generación en lote. |
| [**Postiz**](https://github.com/gitroomhq/postiz-app) (`gitroomhq/postiz-app`) | **Distribución Multicanal & Pauta Programática** | Desplegado como microservicio headless en la nube. Conexión con la bandeja de creativos aprobados, programación de publicaciones vinculada a hitos del cronograma, ejecución de microcampañas ($20–$100 USD) y lectura de métricas orgánicas/pagas. |

### Repositorios de Referencia Importados
- **Open Generative AI**: [https://github.com/anil-matcha/open-generative-ai](https://github.com/anil-matcha/open-generative-ai) — Pipeline generativo multi-proveedor con integración de modelos de texto, imagen y video bajo enfoque BYOK.
- **Postiz**: [https://github.com/gitroomhq/postiz-app](https://github.com/gitroomhq/postiz-app) — Plataforma de automatización de programación de contenidos en redes sociales y orquestación de publicaciones.

---

## 3. Jerarquía de Contexto e Identidad de Marca (Brand Vault)

El sistema implementa una herencia estricta de contexto estructurada en tres niveles para impedir alucinaciones o desviaciones estéticas en la creación de contenidos:

| Nivel | Entidad | Datos del Contexto | Impacto Operativo |
| :---: | :--- | :--- | :--- |
| **Nivel 1** | **Sello (Label)** | Valores fundacionales, subgéneros principales, directrices de splits/derechos estándar y canales de distribución predeterminados. | Establece políticas de negocio globales y directrices institucionales del catálogo. |
| **Nivel 2** | **Artista (Artist)** | Biografía, arquetipo de personalidad, tono de voz discursivo, directrices visuales (paletas de color, tipografías, LoRA IDs) y perfiles en redes sociales. | Asegura la coherencia a largo plazo de la identidad del artista a través de múltiples lanzamientos. |
| **Nivel 3** | **Lanzamiento (Release)** | Concepto narrativo del track/álbum, metadatos (códigos ISRC/UPC), fecha objetivo, presupuesto de pauta y créditos detallados. | Inyecta el contexto específico a las tareas del planificador, los prompts generativos y los copys de publicación en Postiz. |

---

## 4. Flujo de Onboarding Asistido por Agente (Brand Context Interview)

La creación del `BrandContextDocument` se realiza mediante un proceso interactivo guiado:
1. **Ingesta Inicial:** El usuario suministra insumos base (pistas preliminares de audio, textos biográficos, enlaces a DSPs/redes o referencias visuales).
2. **Entrevista Socrática / Cuestionario Adaptativo:** El agente detecta omisiones clave (ej. narrativa de la canción, diferenciador sonoro, estética visual) y formula preguntas orientadas con sugerencias basadas en el subgénero musical del proyecto.
3. **Generación y Aprobación del Documento:** Se genera una ficha estructurada e inmutable que actúa como referencia fija para todas las generaciones creativas y de planificación.

---

## 5. Módulo de Planificación de Lanzamientos (Motor Musical Nativo en SQLite)

> **Arquitectura Nativa:** Al descartarse el backend de Plane, este módulo opera directamente sobre el esquema relacional local en **SQLite + Rust IPC** implementado en la **Épica 1**, garantizando cero latencia, portabilidad y funcionamiento offline sin necesidad de contenedores Docker ni servidores de base de datos externos.

- **Arquetipos de Lanzamiento:** Flujos de trabajo preconfigurados según el formato:
  - Single Debut
  - EP de 6 semanas
  - Álbum de 12 semanas
  - Remix / Edición Deluxe
- **Gestión de Activos por Enlace Externo (Cero Fricción de Subida):**
  - Indie-Sync Suite no aloja ni procesa archivos pesados de audio en servidores propios.
  - Los usuarios enlazan directamente a sus servicios existentes de almacenamiento (**Google Drive, Dropbox, Box, Disco.ac, WeTransfer o enlaces privados de SoundCloud/Audius**).
- **Hitos Bloqueantes y Dependencias Duras (Gatekeepers):** Reglas automáticas de negocio que alertan y recalculan fechas si se producen retrasos críticos. El hito crítico de entrega del máster se considera cumplido al registrar y verificar el enlace externo al audio.
- **Control de Acceso Basado en Roles (RBAC) y Colaboración Asimétrica:**
  - **Label Manager / A&R:** Supervisión total sobre presupuestos, cronogramas globales, activos y aprobaciones de pauta desde la app de escritorio en **Tauri**.
  - **Artista / Manager:** Espacio de trabajo simplificado (web móvil vía Magic Link sin descargas) centrado en la revisión de tareas, acceso al enlace del máster, aprobación ágil de copys/artes y visualización del progreso.

---

## 6. Pipeline Creativo Multimedia

- **Anclaje Estético Obligatorio:** Síntesis de piezas visuales alineadas rigurosamente al Brand Vault mediante prompts estructurados y adaptadores de estilo (LoRA / ControlNet):
  - Portadas 1:1 en alta resolución (hasta 3000px).
  - Lienzos y videos verticales 9:16 (Spotify Canvas, Instagram Reels, TikTok).
  - Banners 16:9 (YouTube, plataformas DSP, web).
- **Generación en Lote (Batching) y Curaduría:** Exploración simultánea de variantes visuales y narrativas para selección rápida antes de su paso a programación.

---

## 7. Distribución y Pauta Programática

- **Programación Multicanal Unificada:** Planificación sincronizada de teasers, anuncios de lanzamiento y contenido post-release en redes sociales y DSPs a través del motor headless de Postiz en la nube.
- **Microcampañas Publicitarias Adaptativas:** Gestión optimizada de presupuestos reducidos ($20–$100 USD) orientados a maximizar pre-saves, reproducciones y conversiones mediante pruebas A/B de copys y creativos.

---

## 8. Dashboard de Analítica Unificada y Asesoría Contextual

- **Centralización de Datos Sociales y de Streaming:** Panel visual interactivo que agrega métricas procedentes de Instagram, Facebook, TikTok y plataformas de streaming (retención de audiencia, interacciones orgánicas, clics a pre-saves y costo por conversión publicitaria).
- **Consejero Estratégico con Memoria Persistente:** Asistente conversacional que cruza el rendimiento en tiempo real con los objetivos fijados para emitir diagnósticos cualitativos y recomendaciones tácticas aplicables a lanzamientos futuros.
- **Soberanía y Gestión del Historial:** Registro persistente de conversaciones para garantizar la continuidad estratégica a lo largo del tiempo, con opciones completas para que el usuario pueda editar, archivar o eliminar hilos de conversación.

---

## 9. Modo Avanzado: Generador Autónomo de Dashboards y Conectores

- **Configuración Guiada por Credenciales / Endpoints:** El usuario aporta llaves API o URLs de endpoints de plataformas externas (distribuidoras, servicios de analítica de terceros o herramientas propietarias).
- **Inspección Autónoma de Datos:** El agente analiza la estructura de los objetos devueltos (JSON), detecta variables analíticas relevantes (oyentes, geolocalización, engagement) y compone dinámicamente cuadros de mando, gráficos de series temporales y tablas comparativas sin requerir configuración manual de código.

---

## 10. Capa de Orquestación y Conectividad Externa (BYOK)

- **Chat Integrado en Barra Lateral:** Asistente operativo contextual capaz de ejecutar acciones directas en la plataforma (agendar tareas, redactar textos, proponer ajustes al calendario y disparar generaciones).
- **Interoperabilidad vía API REST / Webhooks y MCP:** Capacidad de conexión con herramientas externas y clientes de modelos de lenguaje (ChatGPT Actions, Claude, Antigravity) para interactuar con la plataforma de forma local o remota.
- **Bóveda de Credenciales (BYOK):** Almacenamiento seguro bajo control exclusivo del usuario para claves de modelos generativos (OpenAI, Anthropic, Stability/Flux) y cuentas publicitarias.

---

## 11. Desglose de Historias de Usuario (Backlog Funcional Completo)

### Épica 1: Identidad y Contexto de Marca (Brand Vault)

#### HU-1.1: Configuración de la Bóveda del Sello y Artista
- **Como** Label Manager o Artista,
- **Quiero** registrar perfiles detallados con bio, valores, paleta de colores, tipografías y enlaces a redes/DSPs,
- **Para que** toda la generación futura de contenidos mantenga consistencia visual y tonal sin configurarla desde cero cada vez.
- **Criterios de Aceptación:**
  1. Permite crear entidades Label y anidar entidades Artist.
  2. Almacena valores hexadecimales de color, enlaces tipográficos y muestras de estilo.
  3. Valida que los campos esenciales de tono y estética queden guardados en el perfil.

#### HU-1.2: Entrevista Guiada de Contexto (Brand Interview)
- **Como** Creador o Artista independiente,
- **Quiero** responder a un cuestionario adaptativo conducido por el agente conversacional,
- **Para que** pueda estructurar la identidad conceptual de mi proyecto musical cuando no tengo claro cómo definirla por mi cuenta.
- **Criterios de Aceptación:**
  1. El agente realiza preguntas iterativas basadas en el subgénero seleccionado.
  2. Ofrece sugerencias de tono, estética y conceptos sonoros ante respuestas incompletas.
  3. Genera y guarda un documento consolidado de marca al finalizar la sesión.

#### HU-1.3: Gestión Segura de Credenciales (BYOK)
- **Como** Usuario de la plataforma,
- **Quiero** ingresar mis propias claves de API para LLMs, modelos generativos de imagen y plataformas publicitarias,
- **Para que** pueda utilizar mis cuotas y modelos preferidos sin intermediarios ni sobrecostos en la suscripción.
- **Criterios de Aceptación:**
  1. Permite registrar, editar y borrar API keys (OpenAI, Anthropic, Stability/Flux, Meta Ads, TikTok Ads).
  2. Encripta los valores sensibles antes de guardarlos.
  3. Valida la conectividad de la clave antes de marcarla como activa.

#### HU-1.4: Ficha Conceptual del Lanzamiento (Contexto Nivel 3)
- **Como** A&R, Manager o Artista,
- **Quiero** registrar la narrativa específica, concepto lírico, mood y metadatos de un lanzamiento individual,
- **Para que** las tareas del planificador y los generadores de contenido hereden el contexto específico del track sin perder la identidad general del artista.
- **Criterios de Aceptación:**
  1. Permite capturar la narrativa del track, mood sonoro, temática lírica, códigos ISRC/UPC y fecha objetivo.
  2. Asocia la ficha del lanzamiento al Artista correspondiente heredando automáticamente sus paletas y arquetipo.
  3. Permite congelar un snapshot inmutable del contexto al iniciar la fase de producción de activos.

#### HU-1.5: Verificación de Estado, Conectividad y Cuotas de Credenciales BYOK
- **Como** Usuario de la plataforma,
- **Quiero** verificar la validez, saldo y estado de conexión de mis API keys configuradas en la bóveda,
- **Para que** no se interrumpan las generaciones por falta de crédito o claves caducadas en medio de una campaña.
- **Criterios de Aceptación:**
  1. Ofrece un botón de "Probar Conexión" por cada credencial registrada.
  2. Muestra indicadores visuales de estado (Verde = Activa/Con saldo, Amarillo = Cuota baja, Rojo = Error/Invalida).
  3. Registra logs de error detallados sin exponer el valor de la clave en texto plano.

#### HU-1.6: Esquema Relacional Base de Lanzamientos y Tareas (Fundamento Nativo sin Plane)
- **Como** Desarrollador y Label Manager,
- **Quiero** disponer de un modelo de datos relacional local (SQLite en Tauri) que gestione la jerarquía completa de `Sello` $\rightarrow$ `Artista` $\rightarrow$ `Lanzamiento` $\rightarrow$ `Fases (Pre, Live, Post)` $\rightarrow$ `Hitos / Tareas` y `Enlaces de Audio Externos`,
- **Para que** la aplicación disponga de una estructura de persistencia local, reactiva y autónoma para gestionar el ciclo de vida del lanzamiento sin depender de la infraestructura pesada de Plane.
- **Criterios de Aceptación:**
  1. Define y migra el esquema relacional en SQLite con integridad referencial completa para Sellos, Artistas, Lanzamientos, Fases, Tareas y Enlaces externos.
  2. Provee operaciones CRUD locales optimizadas con latencia cero a través de Rust IPC en Tauri.
  3. Modela el árbol de dependencias básicas (tarea padre, tareas hijas, hitos bloqueantes) listo para ser consumido por el planificador visual y el orquestador.
  4. Almacena metadatos del lanzamiento (ISRC, UPC, fecha objetivo, enlaces a masters en Drive/Dropbox/Disco) de forma estructurada.

---

### Épica 2: Planificación y Gestión de Lanzamientos

#### HU-2.1: Creación de Lanzamiento por Arquetipo
- **Como** A&R o Label Manager,
- **Quiero** seleccionar una plantilla de lanzamiento (Single, EP, Álbum, Remix) e ingresar la fecha objetivo,
- **Para que** el sistema autogenere la secuencia completa de tareas y fechas límite de pre, live y post-lanzamiento.
- **Criterios de Aceptación:**
  1. Ofrece al menos 4 plantillas preconfiguradas con duraciones estándar (6 a 12 semanas).
  2. Distribuye automáticamente las tareas a lo largo del calendario calculadas a partir de la fecha de salida.
  3. Permite añadir o remover tareas específicas dentro de la secuencia generada.

#### HU-2.2: Alertas de Hitos Bloqueantes (Gatekeepers)
- **Como** Miembro del equipo operativo,
- **Quiero** que el sistema me notifique si una tarea crítica (como la entrega del máster de audio) se retrasa,
- **Para que** pueda reprogramar automáticamente las dependencias posteriores y evitar perder la ventana de pitching editorial en DSPs.
- **Criterios de Aceptación:**
  1. Identifica tareas de dependencia estricta (Master $\rightarrow$ Distribución $\rightarrow$ Pitching DSP).
  2. Si la fecha límite de un hito crítico expira sin completarse, marca la alerta visual en rojo.
  3. Propone un recálculo de fechas para las tareas dependientes con opción de aprobación manual en un clic.

#### HU-2.3: Vista Diferenciada por Roles (RBAC)
- **Como** Artista o Colaborador externo,
- **Quiero** acceder a una interfaz simplificada enfocada en mis aprobaciones y entregables,
- **Para que** no me abrume con configuraciones presupuestarias o técnicas del sello.
- **Criterios de Aceptación:**
  1. El rol Label Manager tiene acceso completo a presupuestos, dependencias y configuración global.
  2. El rol Artista/Manager solo ve tareas asignadas, bandeja de aprobación de contenidos y dashboard de métricas.

#### HU-2.4: Registro y Validación de Enlaces a Activos de Audio (Drive / Dropbox / Disco)
- **Como** A&R o Productor musical,
- **Quiero** vincular los enlaces externos a los archivos máster y stems (Google Drive, Dropbox, Box, Disco.ac),
- **Para que** todo el equipo tenga acceso al audio final sin saturar la plataforma con subidas pesadas.
- **Criterios de Aceptación:**
  1. Permite registrar URLs externas categorizadas (Master WAV, Instrumental, Stems, Acapella).
  2. Valida que el formato del enlace sea accesible y válido antes de guardarlo.
  3. Marca automáticamente el hito de "Entrega del Máster" como completado al registrar la URL verificada.

#### HU-2.5: Bucle Formal de Aprobación y Rechazo con Feedback de Colaboradores
- **Como** Label Manager o Artista,
- **Quiero** aprobar o rechazar entregables (artes, copys, fechas) con comentarios específicos de ajuste,
- **Para que** el equipo conozca con claridad qué cambios se requieren antes de continuar.
- **Criterios de Aceptación:**
  1. Las tareas con entregables cuentan con estados formales: `Borrador`, `En Revisión`, `Aprobado` y `Rechazado`.
  2. Al rechazar un entregable, exige ingresar un motivo o feedback explicativo.
  3. Notifica al responsable asignado cuando un entregable es aprobado o devuelto para corrección.

#### HU-2.6: Recálculo en Cascada del Cronograma ante Retrasos Críticos
- **Como** A&R o Planificador del sello,
- **Quiero** que el sistema recalcule automáticamente las fechas de las tareas dependientes cuando un hito se pospone,
- **Para que** el cronograma general mantenga la coherencia de tiempos sin necesidad de editar fecha por fecha a mano.
- **Criterios de Aceptación:**
  1. Al cambiar la fecha de un hito padre, proyecta el impacto en las tareas hijas dependientes.
  2. Presenta una previsualización interactiva con el "Antes" y "Después" de las fechas propuestas.
  3. Aplica los cambios en bloque tras la confirmación del usuario con opción de deshacer (*undo*).

---

### Épica 3: Pipeline Creativo Multimedia

#### HU-3.1: Generación de Assets Anclados a la Marca
- **Como** Encargado de Marketing o Diseñador,
- **Quiero** solicitar al sistema la creación de portadas (1:1), lienzos (9:16) y banners (16:9) vinculados a un release,
- **Para que** obtenga piezas visuales que respeten estrictamente la paleta y estilo definidos en el Brand Vault.
- **Criterios de Aceptación:**
  1. El motor inyecta las directrices visuales del artista/release en los prompts de los modelos generativos.
  2. Genera salidas en las dimensiones exactas requeridas para DSPs y redes sociales.
  3. Permite exportar los archivos en alta resolución.

#### HU-3.2: Exploración y Curaduría en Lote (Batching)
- **Como** Creador o A&R,
- **Quiero** generar múltiples variaciones de diseño y copys promocionales en una sola acción,
- **Para que** pueda comparar opciones rápidamente y seleccionar las mejores para la campaña.
- **Criterios de Aceptación:**
  1. Genera una cuadrícula con mínimo 4 variantes visuales o textuales por solicitud.
  2. Permite marcar una pieza como "Aprobada", "Para descartar" o solicitar "Regenerar variante".
  3. Las piezas aprobadas se vinculan automáticamente a las tareas del planificador.

#### HU-3.3: Generación de Copys y Guiones Promocionales (Hooks, Captions y Teasers)
- **Como** Social Media Manager o Artista,
- **Quiero** generar textos de publicación, ganchos (*hooks*) para TikTok y descripciones de YouTube alineados al tono de voz del artista,
- **Para que** el contenido escrito resuene con la audiencia y mantenga coherencia narrativa.
- **Criterios de Aceptación:**
  1. Ofrece plantillas de copys por fase: Anuncio de pre-save, teaser de audio, countdown, release day y agradecimiento.
  2. Inyecta el arquetipo de personalidad y vocabulario característico del artista desde el Brand Vault.
  3. Genera al menos 3 variantes de texto por publicación con conteo de caracteres y hashtags sugeridos.

#### HU-3.4: Maquetación Tipográfica Vectorial sobre Artes de Portada
- **Como** Diseñador o A&R,
- **Quiero** superponer el título del tema y el nombre del artista con tipografía limpia y posicionamiento exacto sobre la imagen generada,
- **Para que** la portada final cumpla con los estándares tipográficos profesionales de los DSPs sin depender del texto defectuoso de la IA.
- **Criterios de Aceptación:**
  1. Permite seleccionar fuentes tipográficas oficiales definidas en el perfil del artista.
  2. Dispone de controles de tamaño, alineación, color, contraste y ubicación (superior, centro, inferior).
  3. Renderiza y exporta la composición final a 3000x3000px en formato PNG/JPG sin pérdida.

#### HU-3.5: Repositorio Central de Activos Aprobados del Release
- **Como** Miembro del equipo de marketing,
- **Quiero** acceder a una galería unificada de todos los artes, videos y copys aprobados para un lanzamiento,
- **Para que** los activos estén listos para ser programados en redes sin búsquedas dispersas en carpetas locales.
- **Criterios de Aceptación:**
  1. Organiza los activos por formato (1:1 Portada, 9:16 Canvas/Reel, 16:9 Banner, Textos).
  2. Permite previsualizar, descargar en alta resolución o enviar directamente al módulo de distribución.
  3. Muestra el estado de aprobación y fecha de creación de cada elemento.

---

### Épica 4: Publicación y Pauta Programática

#### HU-4.1: Programación Multicanal de Publicaciones
- **Como** Social Media Manager del sello,
- **Quiero** programar la difusión de copys y creativos aprobados a través de redes conectadas,
- **Para que** pueda automatizar el calendario de publicaciones sin salir de la plataforma.
- **Criterios de Aceptación:**
  1. Permite asignar fecha, hora y canales específicos a cada publicación.
  2. Previsualiza cómo se verá el post en cada red seleccionada.
  3. Actualiza el estado de la tarea en el planificador una vez publicado con éxito.

#### HU-4.2: Ejecución de Microcampañas de Pauta
- **Como** Encargado de Marketing,
- **Quiero** lanzar campañas publicitarias de bajo presupuesto ($20–$100 USD) directamente hacia el enlace de pre-save o reproducción,
- **Para que** impulse la tracción del lanzamiento sin intermediarios de agencias de pauta.
- **Criterios de Aceptación:**
  1. Solicita únicamente presupuesto, rango de fechas, link destino y audiencia objetivo.
  2. Realiza llamadas a las APIs de pauta (Meta/TikTok Ads) usando las credenciales BYOK del usuario.
  3. Muestra confirmación del gasto aprobado y estado de la campaña en la plataforma.

#### HU-4.3: Conexión y Gestión de Cuentas Sociales y Publicitarias (OAuth Hub)
- **Como** Label Manager o Social Media Manager,
- **Quiero** autenticar y gestionar las conexiones de perfiles sociales (Instagram, Facebook, TikTok, YouTube, X) y cuentas de anuncios,
- **Para que** la plataforma pueda publicar y pautar en nombre del sello o artista de forma autorizada.
- **Criterios de Aceptación:**
  1. Permite iniciar flujos de autorización OAuth estándar para cada red soportada.
  2. Muestra el estado de salud de cada conexión (Conectado, Token por expirar, Desconectado).
  3. Permite renovar credenciales o revocar accesos en cualquier momento con un clic.

#### HU-4.4: Calendario Visual de Contenidos Sincronizado con el Lanzamiento
- **Como** Planificador de marketing,
- **Quiero** visualizar en una cuadrícula mensual/semanal todas las publicaciones programadas respecto al día del estreno,
- **Para que** pueda detectar vacíos de contenido o sobrecargas en la comunicación de la campaña.
- **Criterios de Aceptación:**
  1. Muestra un calendario interactivo con vista mensual y semanal drag-and-drop.
  2. Destaca visualmente el "Release Day" como el hito central del calendario.
  3. Permite reprogramar fechas de publicaciones simplemente arrastrándolas en el calendario.

#### HU-4.5: Cola de Reintentos y Alertas de Fallos de Publicación
- **Como** Operador del sello,
- **Quiero** recibir alertas inmediatas si una publicación o anuncio falla al publicarse y contar con reintentos automáticos,
- **Para que** no se pierda el impacto de un hito de lanzamiento por caídas de API o problemas de formato.
- **Criterios de Aceptación:**
  1. Ejecuta hasta 3 reintentos automáticos con retroceso exponencial ante fallos transitorios de red.
  2. Envía una notificación urgente al usuario si el fallo persiste indicando el motivo devuelto por la red social.
  3. Permite editar el post fallido y disparar una publicación manual inmediata desde la interfaz.

---

### Épica 5: Analítica Unificada, Asesoría y Modo Avanzado

#### HU-5.1: Dashboard Centralizado de Rendimiento
- **Como** Artista o Label Manager,
- **Quiero** consultar en un único panel las métricas de redes sociales y DSPs vinculadas a un lanzamiento,
- **Para que** pueda evaluar el alcance, pre-saves y reproducciones sin alternar entre múltiples plataformas.
- **Criterios de Aceptación:**
  1. Consolida visualizaciones de reproducciones, clics, interacciones y costo por conversión.
  2. Muestra filtros temporales por fase de lanzamiento (pre, live, post).
  3. Actualiza los datos de forma periódica o mediante botón de sincronización manual.

#### HU-5.2: Asesoría Estratégica con Memoria y Control de Privacidad
- **Como** Usuario,
- **Quiero** dialogar con un asesor inteligente que recuerde decisiones anteriores y analice mis métricas,
- **Para que** reciba recomendaciones prácticas sobre cómo optimizar la promoción de mis canciones.
- **Criterios de Aceptación:**
  1. El agente responde preguntas interpretando el rendimiento de los datos actuales y el histórico de la conversación.
  2. El usuario puede consultar, archivar o borrar definitivamente el historial de conversaciones en cualquier momento.
  3. El sistema borra de forma irreversible los registros conversacionales al solicitar su eliminación.

#### HU-5.3: Creación Autónoma de Paneles de Datos (Modo Avanzado)
- **Como** Usuario con fuentes de datos externas o propietarias,
- **Quiero** ingresar una URL de endpoint API y sus credenciales de acceso para que el agente configure un panel personalizado,
- **Para que** pueda visualizar métricas de servicios no estándar sin programar integraciones manualmente.
- **Criterios de Aceptación:**
  1. El agente realiza una consulta de prueba al endpoint y analiza el esquema JSON devuelto.
  2. Detecta métricas numéricas y series de tiempo principales.
  3. Genera dinámicamente tarjetas de métricas y gráficos visuales correspondientes en la interfaz.

#### HU-5.4: Ingesta de Datos de Streaming vía Importación de Reportes / CSV
- **Como** Label Manager o Artista,
- **Quiero** subir reportes analíticos de streaming (CSV de Spotify for Artists, Apple Music for Artists o distribuidores),
- **Para que** el panel consolide métricas de escuchas reales sin depender de APIs cerradas de DSPs.
- **Criterios de Aceptación:**
  1. Reconoce y procesa formatos CSV estándar de las principales plataformas y distribuidoras.
  2. Mapea automáticamente columnas de streams, oyentes mensuales, guardados y países principales.
  3. Incorpora los datos históricos importados a las series temporales del dashboard.

#### HU-5.5: Cálculo de Eficiencia y Retorno de Pauta (Costo por Pre-save / Clic)
- **Como** Encargado de Marketing o A&R,
- **Quiero** visualizar el costo unitario por pre-save y por reproducción derivado de las microcampañas,
- **Para que** pueda evaluar la rentabilidad del presupuesto publicitario invertido.
- **Criterios de Aceptación:**
  1. Cruza el gasto publicitario total de Meta/TikTok Ads con los pre-saves y clics registrados en el Smart Link.
  2. Calcula y muestra métricas de CPA (Costo por Adquisición / Pre-save) y CPC (Costo por Clic).
  3. Compara el rendimiento relativo entre diferentes variantes de creativos para identificar el más eficiente.

#### HU-5.6: Alertas Proactivas de Oportunidades y Riesgos de Campaña
- **Como** Usuario,
- **Quiero** que el asesor estratégico me alerte proactivamente sobre anomalías o caídas de tracción en el lanzamiento,
- **Para que** pueda reaccionar a tiempo con acciones tácticas antes de que termine el ciclo de estreno.
- **Criterios de Aceptación:**
  1. Detecta variaciones significativas de rendimiento (ej. caída de engagement >30% respecto a la media).
  2. Genera tarjetas de sugerencia accionables (ej. *"Reasignar $15 al anuncio B con mayor tasa de conversión"*).
  3. Permite descartar la recomendación o ejecutarla con un solo clic.

---

### Épica 6: Orquestador y Conectividad Externa

#### HU-6.1: Asistente Lateral Operativo (In-App Sidebar)
- **Como** Usuario gestionando un lanzamiento,
- **Quiero** dar órdenes en lenguaje natural en un panel lateral (ej. *"aplaza 2 días la tarea de portada y ajusta el presupuesto a $50"*),
- **Para que** modifique el proyecto rápidamente sin navegar por múltiples menús.
- **Criterios de Aceptación:**
  1. El chat interpreta intenciones operativas y muestra una previsualización de la acción antes de ejecutarla.
  2. Modifica el estado de las tareas o configuraciones tras la confirmación del usuario.

#### HU-6.2: Interfaz API REST Abierta para Clientes Externos
- **Como** Desarrollador o Usuario avanzado,
- **Quiero** interactuar con la plataforma a través de endpoints REST autenticados,
- **Para que** pueda conectar herramientas externas como clientes LLM (ChatGPT Actions, Claude, etc.) o automatizaciones personalizadas.
- **Criterios de Aceptación:**
  1. Expone endpoints documentados para consultar estado de lanzamientos, Brand Vault y métricas.
  2. Permite la ejecución de acciones mediante solicitudes HTTP seguras con token de acceso.

#### HU-6.3: Protocolo de Acciones (Tool Calling) y Guardrails de Confirmación para el Chat
- **Como** Usuario operando mediante lenguaje natural,
- **Quiero** que el asistente cuente con herramientas estrictamente delimitadas y pida confirmación antes de cambios destructivos,
- **Para que** no se modifiquen presupuestos ni se eliminen tareas por errores de interpretación de la IA.
- **Criterios de Aceptación:**
  1. Define un catálogo explícito de tools ejecutables (`crear_tarea`, `mover_fecha`, `ajustar_presupuesto`, `redactar_copy`).
  2. Exige confirmación explícita mediante botón o modal para acciones destructivas o cambios presupuestarios.
  3. Mantiene un registro de auditoría (*action log*) de todas las acciones ejecutadas por el agente.

#### HU-6.4: Servidor MCP Local para Clientes Externos (Antigravity / Claude Desktop)
- **Como** Desarrollador o Usuario de asistentes de escritorio como Antigravity o Claude Desktop,
- **Quiero** conectar mi cliente de IA local directamente a Indie-Sync Suite mediante el protocolo MCP,
- **Para que** mi agente externo pueda inspeccionar el Brand Vault, consultar tareas y ejecutar acciones operativas desde su propia interfaz.
- **Criterios de Aceptación:**
  1. Expone un servidor MCP local funcional compatible con la especificación de Anthropic/Model Context Protocol.
  2. Implementa recursos (resources) para lectura del Brand Vault y tareas del release.
  3. Implementa herramientas (tools) con validación de esquemas JSON para crear y actualizar entidades en la suite.

---

## 12. Roadmap y Secuencia de Implementación (Build-First)

Esta sección organiza las **32 Historias de Usuario** en **fases de construcción secuencial e incremental**, estructuradas a partir de la importación y adaptación de los módulos de código abierto y la construcción nativa del núcleo que sustituye a Plane.

### 12.1 Principios de Secuenciación

1. **Reutilización Real de Credenciales (Sin Reconstruir la Rueda):**
   - **Modelos Generativos:** `Open Generative AI` ya incluye el gateway multi-modelo y la ingesta de API keys (vía Muapi o directas). No se construye un backend de bóveda desde cero; se expone su gestión a través de la UI de Tauri y se persiste de forma segura en el Keychain del sistema.
   - **Autenticación Social y Anuncios:** `Postiz` ya resuelve de forma nativa los flujos OAuth 2.0 y el manejo de tokens con Meta, TikTok, YouTube, X y LinkedIn. La suite se limita a invocar y unificar esta capa visualmente.
2. **Construcción Nativa del Motor de Proyectos (Sustituto de Plane):**
   - Al descartarse Plane por inviabilidad de infraestructura (12 contenedores), la base relacional de proyectos, fases, tareas y enlaces externos se construye de forma 100% nativa y ligera sobre SQLite en Tauri desde la **Épica 1** (`HU-1.6`).
3. **Orquestación Transversal (Épica 6 Distribuida):**
   - La capa de orquestación ya **no se posterga como un bloque final aislado**. 
   - El catálogo de herramientas ejecutables (*tool calling* y guardrails de `HU-6.3`) se define en la fase inicial como contrato de integración.
   - El asistente lateral (`HU-6.1`) se activa tempranamente y va incorporando nuevas *tools* a medida que cada módulo funcional (Brand Vault, Planificador, Creativo, Distribución) entra en operación.
4. **Flujo de Ejecución por Módulo:**
   $$\text{Importar Base OS / Crear Base Nativa} \longrightarrow \text{Adaptar al Dominio Musical} \longrightarrow \text{Conectar al Orquestador} \longrightarrow \text{Siguiente Módulo}$$

---

### 12.2 Fases del Backlog de Implementación

```
Fase 0               Fase 1                  Fase 2               Fase 3
┌─────────────┐  ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
│ Tauri Shell  │  │ Fork Open Gen AI │  │ UI Planificador  │  │ Adaptar pipeline │
│ Key UI / Byok│→│ Brand Vault CRUD │→│ Timeline/Gantt   │→│ al dominio       │
│ Tool Catalog │  │ SQLite Release/  │  │ Arquetipos+Deps  │  │ Brand Injection  │
│  (Contrato)  │  │ Tasks (HU-1.6)   │  │ RBAC + Sidebar v2│  │ Batching+Gallery │
└─────────────┘  └──────────────────┘  └──────────────────┘  └──────────────────┘
                                                                       │
                         ┌─────────────────────────────────────────────┘
                         ▼
                  Fase 4                  Fase 5               Fase 6
              ┌──────────────────┐  ┌──────────────────┐  ┌──────────────────┐
              │ Deploy Postiz    │  │ Dashboard + CSV   │  │ Portal Artista   │
              │ OAuth Hub UI     │→│ ROI + Asesor      │→│ API REST pública │
              │ Scheduling+Pauta │  │ Alertas proactiv  │  │ MCP Server       │
              │ Calendar+Retry   │  │ Paneles autónomos │  │                  │
              └──────────────────┘  └──────────────────┘  └──────────────────┘
```

#### Fase 0 · Shell Base, Contrato del Orquestador y Exposición de Credenciales
- **Infraestructura Base:** Inicialización del proyecto de escritorio con Tauri + Next.js 16 (layout base, navegación, motor SQLite local y Tailwind CSS).
- **HU-1.3 & HU-1.5 (Credenciales & Health Check):** Conexión de la UI de configuración con el Keychain local de Tauri para almacenar y verificar el estado de las API keys sin desarrollar microservicios propietarios de custodia.
- **HU-6.3 (Tool Calling & Guardrails - Contrato Base):** Definición del esquema inicial de tools ejecutables, modal de confirmación para acciones críticas y registro de auditoría (*action log*).

#### Fase 1 · Brand Vault, Esquema Base de Lanzamientos y Activación del Asistente
- **Integración Inicial:** Fork/clon de `Open Generative AI` e integración de su pipeline local en el workspace.
- **HU-1.1 (Bóveda del Sello y Artista):** Modelo de datos Label $\rightarrow$ Artist (paletas, tipografías, bio, LoRAs).
- **HU-1.2 (Entrevista Guiada Socrática):** Onboarding conversacional adaptativo para autogenerar el BrandContextDocument.
- **HU-1.4 (Ficha Conceptual del Lanzamiento - Contexto Nivel 3):** Creación de ficha por track/álbum con herencia automática y snapshot inmutable.
- **HU-1.6 (Esquema Relacional Base de Lanzamientos y Tareas):** Modelado y migración en SQLite de la jerarquía completa de Lanzamientos, Fases, Tareas, Dependencias y Enlaces a masters externos (la base nativa que reemplaza a Plane).
- **HU-6.1 (Asistente Lateral v1):** Activación del chat lateral con capacidad para leer y modificar el Brand Vault y consultar releases en lenguaje natural.

#### Fase 2 · Motor Visual de Planificación Musical (Nativo en SQLite/Tauri)
- **Construcción Visual:** Implementación de la vista de cronograma y árbol de tareas conectada directamente a la base SQLite de la Fase 1.
- **HU-2.1 (Creación de Lanzamiento por Arquetipo):** Plantillas de Single, EP, Álbum y Remix con distribución de calendario.
- **HU-2.4 (Registro y Validación de Enlaces a Audio):** Vinculación sin subida de archivos (Drive, Dropbox, Disco.ac) y validación de enlace.
- **HU-2.2 (Alertas de Hitos Bloqueantes - Gatekeepers):** Dependencias duras (Master $\rightarrow$ Distribución $\rightarrow$ Pitching) con alertas visuales.
- **HU-2.6 (Recálculo en Cascada del Cronograma):** Propagación automática de retrasos con previsualización interactiva y opción de deshacer (*undo*).
- **HU-2.5 (Bucle de Aprobación/Rechazo con Feedback):** Estados formales de entregables (`Borrador`, `En Revisión`, `Aprobado`, `Rechazado`).
- **HU-2.3 (Vista Diferenciada por Roles - RBAC):** Filtro de permisos entre vista Label Manager y vista Artista.
- **Expansión HU-6.1 (Asistente Lateral v2):** Registro de tools operativas de planificación (`crear_tarea`, `mover_fecha`, `consultar_cronograma`).

#### Fase 3 · Pipeline Creativo Multimedia Adaptado
- **HU-3.1 (Generación de Assets Anclados a Marca):** Inyección obligatoria de directrices del Brand Vault en los prompts de los modelos generativos.
- **HU-3.2 (Exploración y Curaduría en Lote - Batching):** Generación simultánea de mínimo 4 variantes con selector de aprobación/descarte.
- **HU-3.3 (Generación de Copys y Guiones Promocionales):** Redacción de textos promocionales con inyección del tono de voz del artista.
- **HU-3.4 (Maquetación Tipográfica Vectorial):** Superposición de textos y títulos con fuentes oficiales sobre las portadas (exportación a 3000x3000px).
- **HU-3.5 (Repositorio Central de Activos Aprobados):** Galería unificada por formato (1:1, 9:16, 16:9, textos) lista para distribución.
- **Expansión HU-6.1 (Asistente Lateral v3):** Registro de tools creativas (`generar_portada`, `generar_copy`, `listar_activos`).

#### Fase 4 · Distribución Multicanal & Pauta (Importación Headless de Postiz)
- **Despliegue Headless:** Fork/deploy del microservicio Postiz en cloud (NestJS + Prisma + PostgreSQL + Redis + Temporal).
- **HU-4.3 (OAuth Hub de Redes Sociales):** Exposición unificada de los flujos OAuth nativos de Postiz para conectar perfiles sociales y publicitarios.
- **HU-4.1 (Programación Multicanal de Publicaciones):** Programación de posts sincronizada con los activos aprobados en la Fase 3.
- **HU-4.4 (Calendario Visual de Contenidos):** Cuadrícula interactiva mensual/semanal con el Release Day como eje central.
- **HU-4.2 (Ejecución de Microcampañas de Pauta):** Lanzamiento de pauta de bajo presupuesto ($20–$100 USD) mediante APIs de Meta/TikTok Ads.
- **HU-4.5 (Cola de Reintentos y Alertas de Fallos):** Reintentos exponenciales automáticos y notificaciones de error con edición manual.
- **Expansión HU-6.1 (Asistente Lateral v4):** Registro de tools de publicación (`programar_post`, `lanzar_campana`).

#### Fase 5 · Analítica Unificada, Asesoría & Paneles Autónomos
- **HU-5.1 (Dashboard Centralizado de Rendimiento):** Visualización unificada de métricas sociales y de streaming filtradas por fase.
- **HU-5.4 (Ingesta de Datos vía Reportes / CSV):** Importación y mapeo de datos de Spotify for Artists, Apple Music y distribuidoras.
- **HU-5.5 (Cálculo de Eficiencia y Retorno de Pauta):** Cálculo automático de CPA (Costo por Pre-save) y CPC cruzando gasto publicitario y conversiones.
- **HU-5.2 (Asesoría Estratégica con Memoria Persistente):** Consultoría conversacional sobre métricas con gestión de privacidad (borrado de historial).
- **HU-5.6 (Alertas Proactivas de Oportunidades y Riesgos):** Detección de anomalías de rendimiento y tarjetas de recomendación ejecutables en un clic.
- **HU-5.3 (Creación Autónoma de Paneles - Modo Avanzado):** Ingesta dinámica de endpoints API arbitrarios con análisis de JSON y composición de dashboards.

#### Fase 6 · Conectividad Externa, Portal del Artista y MCP
- **Portal del Artista (Cloud Relay):** Web app ligera y responsiva para artistas (Magic Link, cero instalación) para revisión de tareas y entregables.
- **HU-6.2 (Interfaz API REST Abierta):** Endpoints autenticados y documentados para interacción con plataformas externas.
- **HU-6.4 (Servidor MCP Local):** Implementación de servidor MCP para conexión nativa con Antigravity, Claude Desktop u otros entornos agénticos.

