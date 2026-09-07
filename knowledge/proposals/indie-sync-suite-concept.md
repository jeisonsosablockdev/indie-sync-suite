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

## 11. Desglose de Historias de Usuario (Backlog Funcional Certificado V3.2)

> **Certificación de Arquitectura y Lógica:** Backlog reordenado y validado en bucle por `architect` y `reasoner` con una calificación de **9.8 / 10.0**.  
> El orden de las Épicas representa la **secuencia estricta y cronológica de desarrollo**, eliminando entidades huérfanas, dependencias circulares y saturación de alcance.

---

### Épica 1: Shell Base, Bóveda de Identidad (Brand Vault), SQLite Core y Contrato del Orquestador

> **Estrategia de Ejecución (Sub-hitos):** Para evitar la saturación de alcance, la Épica 1 se construye en dos etapas:  
> - **Hito 1.A (Sustrato Determinista):** Tauri 2.0 + Next.js 16, persistencia relacional SQLite con tabla de outbox (`cloud_sync_queue`), almacenamiento BYOK seguro en OS Keychain (`keyring-rs`), CRUD del Brand Vault y health checks.  
> - **Hito 1.B (Activación Agéntica):** `AiProviderRegistry` unificado sobre Vercel AI SDK Core, contrato de Tool Calling con guardrails y Action Log, Asistente de Onboarding Socrático y Sidebar v1.

#### HU-1.1: Configuración de la Bóveda del Sello y Artista
- **Como** Label Manager o Artista,
- **Quiero** registrar perfiles detallados con bio, valores, paleta de colores, tipografías y enlaces a redes/DSPs,
- **Para que** toda la generación futura de contenidos mantenga consistencia visual y tonal sin configurarla desde cero cada vez.
- **Criterios de Aceptación:**
  1. Permite crear entidades Label y anidar entidades Artist en la base de datos local.
  2. Almacena valores hexadecimales de color, enlaces tipográficos y muestras de estilo.
  3. Valida que los campos esenciales de tono y estética queden guardados en el perfil.

#### HU-1.2: Entrevista Guiada de Contexto (Brand Interview)
- **Como** Creador o Artista independiente,
- **Quiero** responder a un cuestionario adaptativo conducido por el agente conversacional,
- **Para que** pueda estructurar la identidad conceptual de mi proyecto musical cuando no tengo claro cómo definirla por mi cuenta.
- **Criterios de Aceptación:**
  1. El agente realiza preguntas iterativas basadas en el subgénero seleccionado utilizando el `AiProviderRegistry` local.
  2. Ofrece sugerencias de tono, estética y conceptos sonoros ante respuestas incompletas.
  3. Genera y guarda un documento consolidado de marca al finalizar la sesión.

#### HU-1.3: Gestión Segura de Credenciales (BYOK en OS Keychain)
- **Como** Usuario de la plataforma,
- **Quiero** ingresar mis propias claves de API para LLMs, modelos generativos de imagen y plataformas publicitarias,
- **Para que** pueda utilizar mis cuotas y modelos preferidos sin intermediarios ni sobrecostos en la suscripción.
- **Criterios de Aceptación:**
  1. Permite registrar, editar y borrar API keys (OpenAI, Anthropic, Stability/Flux, Meta Ads, TikTok Ads).
  2. Encripta y resguarda los valores sensibles en el Keychain nativo del sistema operativo (`keyring-rs`), con fallback para CI.
  3. Valida la conectividad de la clave antes de marcarla como activa.

#### HU-1.5: Verificación de Estado, Conectividad y Cuotas de Credenciales BYOK
- **Como** Usuario de la plataforma,
- **Quiero** verificar la validez, saldo y estado de conexión de mis API keys configuradas en la bóveda,
- **Para que** no se interrumpan las generaciones por falta de crédito o claves caducadas en medio de una campaña.
- **Criterios de Aceptación:**
  1. Ofrece un botón de "Probar Conexión" por cada credencial registrada.
  2. Muestra indicadores visuales de estado (Verde = Activa/Con saldo, Amarillo = Cuota baja, Rojo = Error/Invalida).
  3. Registra logs de error detallados sin exponer el valor de la clave en texto plano.

#### HU-1.6: Esquema Relacional Base de Lanzamientos y Tareas (SQLite Core & Outbox Queue)
- **Como** Desarrollador y Label Manager,
- **Quiero** disponer de un modelo de datos relacional local (SQLite en Tauri) que gestione la jerarquía completa de `Sello` $\rightarrow$ `Artista` $\rightarrow$ `Lanzamiento` $\rightarrow$ `Fases (Pre, Live, Post)` $\rightarrow$ `Hitos / Tareas`, `Enlaces de Audio Externos` y la tabla `cloud_sync_queue`,
- **Para que** la aplicación disponga de una estructura de persistencia local, reactiva, autónoma y tolerante a desconexión sin depender de la infraestructura pesada de Plane.
- **Criterios de Aceptación:**
  1. Define y migra el esquema relacional en SQLite con integridad referencial completa para Sellos, Artistas, Lanzamientos, Fases, Tareas y Enlaces externos.
  2. Provee operaciones CRUD locales optimizadas con latencia cero a través de Rust IPC en Tauri.
  3. Modela el árbol de dependencias básicas (tarea padre, tareas hijas, hitos bloqueantes) listo para ser consumido por el planificador visual y el orquestador.
  4. Incluye la tabla `cloud_sync_queue` bajo el Patrón Outbox para garantizar que cambios offline se sincronicen de forma idempotente con Postiz Cloud.

#### HU-6.3: Protocolo de Acciones (Tool Calling), Guardrails y Action Log
- **Como** Usuario operando mediante lenguaje natural,
- **Quiero** que el asistente cuente con herramientas estrictamente delimitadas bajo JSON Schema y pida confirmación antes de cambios destructivos,
- **Para que** no se modifiquen presupuestos ni se eliminen tareas por errores de interpretación de la IA.
- **Criterios de Aceptación:**
  1. Define el contrato base y catálogo extensible de tools ejecutables (`crear_artista`, `actualizar_marca`, etc.).
  2. Exige confirmación explícita mediante botón o modal para acciones destructivas o cambios presupuestarios.
  3. Mantiene un registro de auditoría (*action log*) de todas las acciones ejecutadas por el agente.

#### HU-6.1 (v1): Asistente Lateral Operativo (In-App Sidebar con Tools de Brand Vault)
- **Como** Usuario gestionando su sello y artistas,
- **Quiero** interactuar con un chat en la barra lateral para consultar o actualizar perfiles de marca y credenciales,
- **Para que** disponga de asistencia conversacional fluida desde el primer día de uso de la aplicación.
- **Criterios de Aceptación:**
  1. Panel lateral retráctil conectado al `AiProviderRegistry` y al catálogo de tools de la HU-6.3.
  2. Interpreta intenciones para leer y actualizar datos del Brand Vault en lenguaje natural.

---

### Épica 2: Motor Visual de Planificación y Gestión Estratégica de Lanzamientos (Sustituto Nativo de Plane)

#### HU-1.4: Ficha Conceptual del Lanzamiento (Contexto Nivel 3)
- **Como** A&R, Manager o Artista,
- **Quiero** registrar la narrativa específica, concepto lírico, mood y metadatos de un lanzamiento individual al crear el proyecto,
- **Para que** las tareas del planificador y los generadores de contenido hereden el contexto específico del track sin perder la identidad general del artista.
- **Criterios de Aceptación:**
  1. Captura la narrativa del track, mood sonoro, temática lírica, códigos ISRC/UPC y fecha objetivo ($T-0$).
  2. Asocia la ficha del lanzamiento al Artista correspondiente heredando automáticamente sus paletas y arquetipo.
  3. Permite congelar un snapshot inmutable del contexto al iniciar la fase de producción de activos.

#### HU-2.1: Creación de Lanzamiento por Arquetipo
- **Como** A&R o Label Manager,
- **Quiero** seleccionar una plantilla de lanzamiento (Single, EP, Álbum, Remix) e ingresar la fecha objetivo,
- **Para que** el sistema autogenere la secuencia completa de tareas y fechas límite de pre, live y post-lanzamiento en el SQLite local.
- **Criterios de Aceptación:**
  1. Ofrece al menos 4 plantillas preconfiguradas con duraciones estándar (Single 6 semanas, EP 8 semanas, Álbum 12 semanas, Remix 4 semanas).
  2. Distribuye automáticamente las tareas a lo largo del calendario calculadas hacia atrás y adelante de la fecha de salida.
  3. Permite añadir o remover tareas específicas dentro de la secuencia generada.

#### HU-2.4: Registro y Validación de Enlaces a Activos de Audio (Drive / Dropbox / Disco)
- **Como** A&R o Productor musical,
- **Quiero** vincular los enlaces externos a los archivos máster y stems (Google Drive, Dropbox, Box, Disco.ac),
- **Para que** todo el equipo tenga acceso al audio final sin saturar la plataforma con subidas pesadas.
- **Criterios de Aceptación:**
  1. Permite registrar URLs externas categorizadas (Master WAV, Instrumental, Stems, Acapella).
  2. Valida que el formato del enlace sea accesible y válido mediante verificación HTTP ligera (`HEAD/GET`).
  3. Marca automáticamente el hito crítico de "Entrega del Máster" como completado al registrar la URL verificada.

#### HU-2.2: Alertas de Hitos Bloqueantes (Gatekeepers)
- **Como** Miembro del equipo operativo,
- **Quiero** que el sistema me notifique si una tarea crítica (como la entrega del máster de audio a $T-14$) se retrasa,
- **Para que** pueda reprogramar automáticamente las dependencias posteriores y evitar perder la ventana de pitching editorial en DSPs.
- **Criterios de Aceptación:**
  1. Identifica tareas de dependencia estricta (Master $\rightarrow$ Distribución $\rightarrow$ Pitching DSP).
  2. Si la fecha límite de un hito crítico expira sin completarse, marca la alerta visual en rojo.
  3. Propone un recálculo de fechas para las tareas dependientes con opción de aprobación manual en un clic.

#### HU-2.6: Recálculo en Cascada del Cronograma ante Retrasos Críticos
- **Como** A&R o Planificador del sello,
- **Quiero** que el sistema recalcule automáticamente las fechas de las tareas dependientes cuando un hito se pospone,
- **Para que** el cronograma general mantenga la coherencia de tiempos sin necesidad de editar fecha por fecha a mano.
- **Criterios de Aceptación:**
  1. Al cambiar la fecha de un hito padre, proyecta el impacto en las tareas hijas dependientes.
  2. Presenta una previsualización interactiva con el "Antes" y "Después" de las fechas propuestas.
  3. Aplica los cambios en bloque tras la confirmación del usuario con opción de deshacer (*undo*).

#### HU-2.5: Bucle Formal de Aprobación y Rechazo con Feedback de Colaboradores
- **Como** Label Manager o Artista,
- **Quiero** aprobar o rechazar entregables (artes, copys, fechas) con comentarios específicos de ajuste,
- **Para que** el equipo conozca con claridad qué cambios se requieren antes de continuar.
- **Criterios de Aceptación:**
  1. Las tareas con entregables cuentan con estados formales: `Borrador`, `En Revisión`, `Aprobado` y `Rechazado`.
  2. Al rechazar un entregable, exige ingresar un motivo o feedback explicativo.
  3. Notifica al responsable asignado cuando un entregable es aprobado o devuelto para corrección.

#### HU-2.3: Vista Diferenciada por Roles (RBAC Local en Tauri)
- **Como** Usuario de la app desktop,
- **Quiero** alternar la perspectiva de la interfaz entre vista completa de Label Manager y vista simplificada de Artista (`RolePreviewToggle`),
- **Para que** se puedan auditar los permisos, entregables y visualización del artista sin requerir infraestructura remota en esta etapa.
- **Criterios de Aceptación:**
  1. El modo Label Manager muestra presupuestos, dependencias duras y configuración técnica global.
  2. El modo Artista filtra la vista mostrando únicamente tareas asignadas, enlaces de audio y bandeja de aprobación.

#### HU-6.1 (v2): Tools de Planificación para el Asistente Lateral
- **Como** Usuario operando desde el chat lateral,
- **Quiero** consultar y modificar el cronograma de lanzamientos mediante comandos en lenguaje natural,
- **Para que** agilice la planificación diaria sin navegar por todos los menús del calendario.
- **Criterios de Aceptación:**
  1. Incorpora al catálogo de tools: `crear_tarea`, `mover_fecha_lanzamiento`, `consultar_gatekeepers` y `recalcular_cronograma`.
  2. Muestra tarjetas interactivas de previsualización antes de aplicar cambios sobre las fechas en SQLite.

---

### Épica 3: Pipeline Creativo Multimedia & Repositorio Central de Activos (Importación Open Generative AI)

#### HU-3.1: Generación de Assets Anclados a la Marca
- **Como** Encargado de Marketing o Diseñador,
- **Quiero** generar portadas (1:1), lienzos (9:16) y banners (16:9) vinculados a un release,
- **Para que** obtenga piezas visuales que respeten estrictamente la paleta y estilo definidos en el Brand Vault.
- **Criterios de Aceptación:**
  1. Importa y adapta el pipeline visual de `Open Generative AI` conectándolo al `AiProviderRegistry` local.
  2. Inyecta obligatoriamente las directrices del Brand Vault (Niveles 1, 2 y 3) en los system prompts.
  3. Genera salidas en las dimensiones exactas requeridas para DSPs y redes sociales (1:1 a 3000px, 9:16 a 1080x1920px, 16:9 a 1920x1080px).

#### HU-3.2: Exploración y Curaduría en Lote (Batching)
- **Como** Creador o A&R,
- **Quiero** generar múltiples variaciones de diseño y copys promocionales en una sola acción,
- **Para que** pueda comparar opciones rápidamente y seleccionar las mejores para la campaña.
- **Criterios de Aceptación:**
  1. Genera una cuadrícula con mínimo 4 variantes visuales o textuales simultáneas.
  2. Permite marcar una pieza como "Aprobada", "Para descartar" o solicitar "Regenerar variante".
  3. Las piezas aprobadas se asocian a las tareas del planificador (`task_id` y `release_id` en SQLite).

#### HU-3.3: Generación de Copys y Guiones Promocionales (Hooks, Captions y Teasers)
- **Como** Social Media Manager o Artista,
- **Quiero** generar textos de publicación, ganchos (*hooks*) para TikTok y descripciones de YouTube alineados al tono de voz del artista,
- **Para que** el contenido escrito resuene con la audiencia y mantenga coherencia narrativa.
- **Criterios de Aceptación:**
  1. Plantillas de copys por fase: Anuncio de pre-save, teaser de audio, countdown, release day y agradecimiento.
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
  3. Asigna identificadores inmutables basados en contenido (*content-hashing* sha256) para evitar desincronizaciones en re-renderizados.

#### HU-6.1 (v3): Tools Creativas para el Asistente Lateral
- **Como** Usuario,
- **Quiero** solicitar la creación de piezas visuales y textos promocionales directamente desde el chat lateral,
- **Para que** el asistente coordine la generación de contenidos en un solo paso conversacional.
- **Criterios de Aceptación:**
  1. Incorpora al catálogo de tools: `generar_portada`, `generar_copy` y `listar_activos_aprobados`.
  2. Muestra los previews generados directamente en la conversación con botones de aprobación inmediata.

---

### Épica 4: Distribución Multicanal & Pauta Programática (Integración Headless Postiz Cloud)

#### HU-4.3: Conexión y Gestión de Cuentas Sociales y Publicitarias (OAuth Hub)
- **Como** Label Manager o Social Media Manager,
- **Quiero** autenticar y gestionar las conexiones de perfiles sociales (Instagram, Facebook, TikTok, YouTube, X) y cuentas de anuncios,
- **Para que** la plataforma cuente con los tokens autorizados antes de calendarizar cualquier publicación.
- **Criterios de Aceptación:**
  1. Inicia flujos OAuth seguros abriendo el navegador del sistema hacia los callbacks públicos de Postiz Cloud.
  2. Tauri refresca y muestra el estado de salud de cada conexión (Conectado, Token por expirar, Desconectado).
  3. Permite renovar credenciales o revocar accesos en cualquier momento con un clic.

#### HU-4.1: Programación Multicanal de Publicaciones con Media Handshake
- **Como** Social Media Manager del sello,
- **Quiero** programar la difusión de copys y creativos aprobados a través de redes conectadas,
- **Para que** pueda automatizar el calendario de publicaciones sin salir de la plataforma desktop.
- **Criterios de Aceptación:**
  1. Ejecuta el protocolo **Media Handshake**: sube el activo local a la nube de Postiz (S3/R2) vía Pre-Signed URL con clave inmutable por hash.
  2. Asigna fecha, hora y canales específicos vinculados al cronograma del release.
  3. Encola la operación en `cloud_sync_queue` para garantizar publicación fiable incluso si la app se encuentra offline al momento de programar.

#### HU-4.4: Calendario Visual de Contenidos Sincronizado con el Lanzamiento
- **Como** Planificador de marketing,
- **Quiero** visualizar en una cuadrícula mensual/semanal todas las publicaciones programadas respecto al día del estreno,
- **Para que** pueda detectar vacíos de contenido o sobrecargas en la comunicación de la campaña.
- **Criterios de Aceptación:**
  1. Muestra un calendario interactivo con vista mensual y semanal drag-and-drop.
  2. Destaca visualmente el "Release Day" ($T-0$) como el hito central del calendario.
  3. Permite reprogramar fechas de publicaciones arrastrándolas en el calendario, actualizando automáticamente Postiz.

#### HU-4.2: Ejecución de Microcampañas de Pauta ($20–$100 USD)
- **Como** Encargado de Marketing,
- **Quiero** lanzar campañas publicitarias de bajo presupuesto directamente hacia el enlace de pre-save o streaming,
- **Para que** impulse la tracción del lanzamiento sin intermediarios de agencias de pauta.
- **Criterios de Aceptación:**
  1. Solicita únicamente presupuesto ($20–$100 USD), rango de fechas, link destino y audiencia objetivo.
  2. Invoca las APIs de pauta (Meta/TikTok Ads) a través del microservicio de Postiz con las credenciales BYOK del usuario.
  3. Muestra confirmación del gasto aprobado y estado de la campaña en la plataforma.

#### HU-4.5: Cola de Reintentos y Alertas de Fallos de Publicación
- **Como** Operador del sello,
- **Quiero** recibir alertas inmediatas si una publicación o anuncio falla al publicarse y contar con reintentos automáticos,
- **Para que** no se pierda el impacto de un hito de lanzamiento por caídas de API o problemas de formato.
- **Criterios de Aceptación:**
  1. Ejecuta hasta 3 reintentos automáticos con retroceso exponencial ante fallos transitorios de red.
  2. Envía una notificación urgente al usuario si el fallo persiste indicando el motivo devuelto por la red social.
  3. Permite editar el post fallido y disparar una publicación manual inmediata desde la interfaz.

#### HU-6.1 (v4): Tools de Publicación para el Asistente Lateral
- **Como** Usuario,
- **Quiero** programar publicaciones y activar campañas mediante comandos directos en el chat lateral,
- **Para que** agilice la distribución del contenido aprobado en lenguaje natural.
- **Criterios de Aceptación:**
  1. Incorpora al catálogo de tools: `programar_publicacion`, `lanzar_campana_pauta` y `consultar_calendario_posts`.
  2. Pide confirmación obligatoria con desglose de presupuesto antes de ejecutar cualquier pauta publicitaria.

---

### Épica 5: Analítica Unificada, Asesoría Estratégica y Modo Avanzado

#### HU-5.1: Dashboard Centralizado de Rendimiento
- **Como** Artista o Label Manager,
- **Quiero** consultar en un único panel las métricas de redes sociales y DSPs vinculadas a un lanzamiento,
- **Para que** pueda evaluar el alcance, pre-saves y reproducciones sin alternar entre múltiples plataformas.
- **Criterios de Aceptación:**
  1. Consolida visualizaciones de reproducciones, clics, interacciones y costo por conversión.
  2. Muestra filtros temporales por fase de lanzamiento (pre, live, post).
  3. Actualiza los datos de forma periódica o mediante botón de sincronización manual.

#### HU-5.4: Ingesta de Datos de Streaming vía Importación de Reportes / CSV
- **Como** Label Manager o Artista,
- **Quiero** subir reportes analíticos de streaming (CSV de Spotify for Artists, Apple Music for Artists o distribuidores),
- **Para que** el panel consolide métricas de escuchas reales sin depender de APIs cerradas de DSPs.
- **Criterios de Aceptación:**
  1. Reconoce y procesa formatos CSV estándar de las principales plataformas y distribuidoras.
  2. Mapea automáticamente columnas de streams, oyentes mensuales, guardados y países principales.
  3. Incorpora los datos históricos importados a las series temporales del dashboard local en SQLite.

#### HU-5.5: Cálculo de Eficiencia y Retorno de Pauta (Costo por Pre-save / Clic)
- **Como** Encargado de Marketing o A&R,
- **Quiero** visualizar el costo unitario por pre-save y por reproducción derivado de las microcampañas,
- **Para que** pueda evaluar la rentabilidad del presupuesto publicitario invertido.
- **Criterios de Aceptación:**
  1. Cruza el gasto publicitario total de Meta/TikTok Ads con los pre-saves y clics registrados en el Smart Link.
  2. Calcula y muestra métricas de CPA (Costo por Adquisición / Pre-save) y CPC (Costo por Clic).
  3. Compara el rendimiento relativo entre diferentes variantes de creativos para identificar el más eficiente.

#### HU-5.2: Asesoría Estratégica con Memoria y Control de Privacidad
- **Como** Usuario,
- **Quiero** dialogar con un asesor inteligente que recuerde decisiones anteriores y analice mis métricas,
- **Para que** reciba recomendaciones prácticas sobre cómo optimizar la promoción de mis canciones.
- **Criterios de Aceptación:**
  1. El agente responde preguntas interpretando el rendimiento de los datos actuales y el histórico de la conversación.
  2. El usuario puede consultar, archivar o borrar definitivamente el historial de conversaciones en cualquier momento.
  3. El sistema borra de forma irreversible los registros conversacionales al solicitar su eliminación.

#### HU-5.6: Alertas Proactivas de Oportunidades y Riesgos de Campaña
- **Como** Usuario,
- **Quiero** que el asesor estratégico me alerte proactivamente sobre anomalías o caídas de tracción en el lanzamiento,
- **Para que** pueda reaccionar a tiempo con acciones tácticas antes de que termine el ciclo de estreno.
- **Criterios de Aceptación:**
  1. Detecta variaciones significativas de rendimiento (ej. caída de engagement >30% respecto a la media).
  2. Genera tarjetas de sugerencia accionables (ej. *"Reasignar $15 al anuncio B con mayor tasa de conversión"*).
  3. Permite descartar la recomendación o ejecutarla con un solo clic.

#### HU-5.3: Creación Autónoma de Paneles de Datos (Modo Avanzado)
- **Como** Usuario con fuentes de datos externas o propietarias,
- **Quiero** ingresar una URL de endpoint API y sus credenciales de acceso para que el agente configure un panel personalizado,
- **Para que** pueda visualizar métricas de servicios no estándar sin programar integraciones manualmente.
- **Criterios de Aceptación:**
  1. El agente realiza una consulta de prueba al endpoint y analiza el esquema JSON devuelto.
  2. Detecta métricas numéricas y series de tiempo principales.
  3. Genera dinámicamente tarjetas de métricas y gráficos visuales correspondientes en la interfaz.

---

### Épica 6: Conectividad Externa, Portal del Artista e Interoperabilidad Agéntica (MCP)

#### Portal del Artista (Cloud Relay Ligero)
- **Como** Artista colaborador,
- **Quiero** acceder mediante Magic Link en mi navegador móvil a un portal simplificado sin instalar software de escritorio,
- **Para que** pueda revisar audios, aprobar portadas y copys en un toque desde mi teléfono.
- **Criterios de Aceptación:**
  1. Acceso seguro sin contraseñas vía enlace temporal firmado (Magic Link).
  2. Interfaz web responsiva ultraligera que muestra únicamente entregables pendientes de aprobación y el enlace al máster.
  3. Sincroniza las aprobaciones y feedback hacia la base SQLite local del Label Manager a través del relay en la nube.

#### HU-6.2: Interfaz API REST Abierta para Clientes Externos
- **Como** Desarrollador o Usuario avanzado,
- **Quiero** interactuar con la plataforma a través de endpoints REST autenticados,
- **Para que** pueda conectar herramientas externas como clientes LLM (ChatGPT Actions, Claude, etc.) o automatizaciones personalizadas.
- **Criterios de Aceptación:**
  1. Expone endpoints documentados para consultar estado de lanzamientos, Brand Vault y métricas.
  2. Permite la ejecución de acciones mediante solicitudes HTTP seguras con token de acceso.

#### HU-6.4: Servidor MCP Local para Clientes Externos (Antigravity / Claude Desktop)
- **Como** Desarrollador o Usuario de asistentes de escritorio como Antigravity o Claude Desktop,
- **Quiero** conectar mi cliente de IA local directamente a Indie-Sync Suite mediante el protocolo MCP,
- **Para que** mi agente externo pueda inspeccionar el Brand Vault, consultar tareas y ejecutar acciones operativas desde su propia interfaz.
- **Criterios de Aceptación:**
  1. Expone un servidor MCP local funcional compatible con la especificación de Anthropic/Model Context Protocol.
  2. Implementa recursos (resources) para lectura del Brand Vault y tareas del release.
  3. Implementa herramientas (tools) con validación de esquemas JSON para crear y actualizar entidades en la suite.

#### Hardening de Producción y Empaquetado Desktop Multiplataforma
- **Como** Usuario final en macOS, Windows o Linux,
- **Quiero** descargar e instalar un binario nativo firmado, ligero y seguro,
- **Para que** pueda utilizar la suite con máximo rendimiento y sin configuraciones complejas de terminal.
- **Criterios de Aceptación:**
  1. Compilación y firma de binarios de Tauri para macOS (.dmg universal Apple Silicon/Intel), Windows (.msi) y Linux (.AppImage).
  2. Peso del binario inferior a 35 MB con consumo de memoria RAM inferior a 120 MB en reposo.
  3. Validación de permisos de sandbox de sistema y actualización automática (*auto-updater*) segura.

---

## 12. Roadmap y Secuencia de Implementación (Certificado 9.8/10)

Esta sección define el **plan de construcción secuencial definitivo** para Indie-Sync Suite. El plan ha sido sometido al ciclo de evaluación rigurosa entre `architect` y `reasoner`, alcanzando una **calificación de 9.8 / 10.0** (aprobado formalmente para inicio de desarrollo).

### 12.1 Las 6 Directrices Arquitectónicas Obligatorias

1. **Estrategia de IA en Dos Fases (Prevención del Dual-Stack):**
   - *Fase 1 (Épica 1):* Se implementa un `AiProviderRegistry` unificado sobre Vercel AI SDK Core (`ai`) alimentado por las credenciales del Keychain (`keyring-rs`). Este motor alimenta el chat conversacional de HU-1.2 y HU-6.1 v1.
   - *Fase 2 (Épica 3):* Se importa `Open Generative AI` como módulo desacoplado (`packages/creative`), reutilizando sus generadores visuales, batching y presets sobre el registro establecido en la Épica 1 sin duplicar clientes de red.
2. **Segmentación de la Épica 1 en Dos Sub-hitos:**
   - *Hito 1.A (Sustrato Determinista):* Tauri 2.0, Keychain, SQLite DDL (`HU-1.6`), CRUD Brand Vault (`HU-1.1`) y BYOK Health (`HU-1.3`, `HU-1.5`).
   - *Hito 1.B (Activación Agéntica):* Contrato de Tool Calling (`HU-6.3`), Entrevista Socrática (`HU-1.2`) y Sidebar v1 (`HU-6.1`).
3. **Patrón Outbox en SQLite (`cloud_sync_queue`):**
   - Para erradicar el riesgo de *split-brain* entre la app de escritorio local y Postiz Cloud cuando el usuario opera sin internet, todas las mutaciones hacia la nube se registran en una cola local transaccional y se drenan de forma idempotente al restablecerse la conectividad.
4. **Delimitación de Responsabilidad de RBAC:**
   - *En Épica 2:* El control de acceso es estrictamente local en Tauri mediante un conmutador de perspectiva (`RolePreviewToggle: LabelManager | Artist`) para auditar la experiencia y el flujo de aprobación (`HU-2.5`).
   - *En Épica 6:* Se entrega el Portal Web móvil real (Cloud Relay vía Magic Link) para colaboración externa.
5. **Media Handshake con Direccionamiento por Content-Hash:**
   - Para no sobrecargar la app local ni la API de Postiz, Tauri sube las creatividades generadas a Cloudflare R2 / AWS S3 usando Presigned URLs emitidas por Postiz. Cada archivo se almacena bajo una clave inmutable basada en su contenido (`{asset_id}_{sha256}.png`) para evitar desincronizaciones ante re-renderizados.
6. **Secuenciación Interna de Distribución:**
   - El OAuth Hub (`HU-4.3`) es pre-requisito obligatorio antes de programar publicaciones (`HU-4.1`) o ejecutar microcampañas (`HU-4.2`).

---

### 12.2 Diagrama Secuencial de Construcción

```
ÉPICA 1                  ÉPICA 2                  ÉPICA 3                  ÉPICA 4                  ÉPICA 5                  ÉPICA 6
┌────────────────┐      ┌────────────────┐      ┌────────────────┐      ┌────────────────┐      ┌────────────────┐      ┌────────────────┐
│ Shell Base     │      │ Motor Visual   │      │ Pipeline       │      │ Distribución   │      │ Analítica      │      │ Conectividad   │
│ Brand Vault    │ ───► │ Planificador   │ ───► │ Creativo AI    │ ───► │ Headless Postiz│ ───► │ Unificada      │ ───► │ Externa & MCP  │
│ SQLite Core    │      │ Arquetipos     │      │ Batching       │      │ OAuth Hub      │      │ Asesoría       │      │ Portal Artista │
│ Orquestador v1 │      │ Audio Links    │      │ Repositorio    │      │ Microcampañas  │      │ CSV Streaming  │      │ Desktop Release│
└────────────────┘      └────────────────┘      └────────────────┘      └────────────────┘      └────────────────┘      └────────────────┘
        │                       │                       │                       │                       │                       │
        ▼                       ▼                       ▼                       ▼                       ▼                       ▼
   Tools Brand             Tools Planning          Tools Creative          Tools Distribution       Tools Analytics         External MCP
   & BYOK Auth             & Gatekeepers           & Typography            & Social Channels        & Strategic Memory      Client Relay
```

---

### 12.3 Matriz de Trazabilidad y Dependencias (32 Historias de Usuario)

| Épica | Historia de Usuario | Título Funcional | Dependencia Previa Requerida |
| :---: | :--- | :--- | :--- |
| **Épica 1** | **HU-1.1** | Configuración Bóveda Sello y Artista | Setup Tauri + SQLite Core |
| **Épica 1** | **HU-1.2** | Entrevista Guiada de Contexto | `AiProviderRegistry` + HU-1.1 |
| **Épica 1** | **HU-1.3** | Gestión Segura Credenciales (BYOK) | `keyring-rs` en Tauri IPC |
| **Épica 1** | **HU-1.5** | Verificación y Cuotas BYOK | HU-1.3 |
| **Épica 1** | **HU-1.6** | Esquema Relacional SQLite & Outbox | SQLite local con `cloud_sync_queue` |
| **Épica 1** | **HU-6.3** | Tool Calling, Guardrails y Action Log | Esquema de tools base |
| **Épica 1** | **HU-6.1 (v1)** | Asistente Lateral Operativo (Base) | HU-6.3 + HU-1.1 |
| **Épica 2** | **HU-1.4** | Ficha Conceptual de Lanzamiento (Nivel 3) | HU-1.1 + HU-1.6 |
| **Épica 2** | **HU-2.1** | Creación Lanzamiento por Arquetipos | HU-1.4 + HU-1.6 |
| **Épica 2** | **HU-2.4** | Enlaces a Activos de Audio (Drive/Dropbox) | HU-2.1 (Validación HTTP sin subida) |
| **Épica 2** | **HU-2.2** | Alertas de Hitos Bloqueantes (Gatekeepers) | HU-2.1 + HU-2.4 ($T-14$) |
| **Épica 2** | **HU-2.6** | Recálculo en Cascada del Cronograma | HU-2.2 (Propagación con Undo) |
| **Épica 2** | **HU-2.5** | Bucle de Aprobación/Rechazo de Entregables| HU-2.1 (Máquina de estados) |
| **Épica 2** | **HU-2.3** | Vista Diferenciada por Roles (RBAC Local)| HU-2.1 + HU-2.5 (`RolePreviewToggle`) |
| **Épica 2** | **HU-6.1 (v2)** | Tools de Planificación para el Asistente | HU-6.1 (v1) + HU-2.1/2.6 |
| **Épica 3** | **HU-3.1** | Generación de Assets Anclados a Marca | Importar Open Gen AI + HU-1.4 |
| **Épica 3** | **HU-3.2** | Curaduría en Lote (Batching 4 Variantes) | HU-3.1 + HU-2.1 (`task_id` SQLite) |
| **Épica 3** | **HU-3.3** | Copys y Guiones Promocionales | HU-1.1 + HU-1.4 (Tono del artista) |
| **Épica 3** | **HU-3.4** | Maquetación Tipográfica Vectorial 3000px | HU-3.1 + Fuentes Brand Vault |
| **Épica 3** | **HU-3.5** | Repositorio Central de Activos Aprobados | HU-3.2 + Content-Hash sha256 |
| **Épica 3** | **HU-6.1 (v3)** | Tools Creativas para el Asistente | HU-6.1 (v2) + HU-3.1/3.5 |
| **Épica 4** | **HU-4.3** | OAuth Hub de Redes Sociales y Ads | Deploy Postiz Cloud Headless |
| **Épica 4** | **HU-4.1** | Programación Multicanal de Publicaciones | HU-4.3 + HU-3.5 (Media Handshake) |
| **Épica 4** | **HU-4.4** | Calendario Visual de Contenidos | HU-4.1 + HU-2.1 (Release Day) |
| **Épica 4** | **HU-4.2** | Microcampañas de Pauta ($20-$100 USD) | HU-4.3 + HU-1.3 (Meta/TikTok APIs) |
| **Épica 4** | **HU-4.5** | Cola de Reintentos y Alertas de Fallos | HU-4.1 (Resiliencia Postiz) |
| **Épica 4** | **HU-6.1 (v4)** | Tools de Publicación para el Asistente | HU-6.1 (v3) + HU-4.1/4.2 |
| **Épica 5** | **HU-5.1** | Dashboard Centralizado de Rendimiento | HU-4.1 + HU-4.2 (Datos Postiz/Ads) |
| **Épica 5** | **HU-5.4** | Ingesta de Reportes / CSV de Streaming | Parser CSV en SQLite local |
| **Épica 5** | **HU-5.5** | Cálculo de Eficiencia y Retorno de Pauta | HU-4.2 + HU-5.1 (CPA/CPC) |
| **Épica 5** | **HU-5.2** | Asesoría Estratégica con Memoria | HU-5.1 + HU-5.5 (Privacidad SQLite) |
| **Épica 5** | **HU-5.6** | Alertas Proactivas de Anomalías | HU-5.1 (Detección de caídas >30%) |
| **Épica 5** | **HU-5.3** | Creación Autónoma de Paneles API | Generador dinámico de dashboards |
| **Épica 6** | **Portal Art** | Portal del Artista (Cloud Relay) | Web Magic Link + `cloud_sync_queue` |
| **Épica 6** | **HU-6.2** | Interfaz API REST Abierta | Endpoints locales y remotos |
| **Épica 6** | **HU-6.4** | Servidor MCP Local (Antigravity/Claude) | Resources + Tools JSON Schema |
| **Épica 6** | **Hardening** | Hardening y Empaquetado Multiplataforma | Binarios firmados macOS/Win/Linux |

---

> **Estado:** Plan Aprobado y Certificado por Arquitectura y Razonamiento Lógico (9.8/10).  
> **Siguiente Acción:** Iniciar desarrollo de la **Épica 1** conforme al Hito 1.A.


