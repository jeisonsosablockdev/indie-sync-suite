---
okf_version: "0.1"
type: Specification
id: SPEC-ISS-V3
title: "INDIE-SYNC SUITE: Arquitectura y Especificación Funcional V3"
status: canonical-concept
owner: "czambrano (jaymusicmachine)"
created_at: 2026-09-06
updated_at: 2026-09-06
tags: [specification, concept, indie-sync-suite, architecture, brand-vault, plane, open-generative-ai, postiz, byok, epics]
---

# INDIE-SYNC SUITE: Arquitectura y Especificación Funcional V3

> **Estado**: Documento Canónico de Especificación & Concepto Base  
> **Propietario / Owner**: Carlos Zambrano (`czambrano` / `jaymusicmachine`)  
> **Propósito**: Fuente única de verdad funcional y arquitectónica para guiar el diseño de interfaces (UI/UX), la definición de RFCs/Épicas y el plan de implementación técnica.

---

## 1. Visión General del Sistema

**Indie-Sync Suite** es un sistema operativo integral y modular diseñado para sellos discográficos independientes y creadores musicales. Su propósito es estructurar, automatizar y potenciar:
- La planificación estratégica de lanzamientos.
- La consistencia de marca a través del tiempo.
- La generación de contenido multimedia de alta fidelidad.
- La distribución multicanal y pauta programática.
- La analítica unificada de streaming y redes.
- La toma de decisiones asistida por agentes autónomos de Inteligencia Artificial bajo el modelo **BYOK** (*Bring Your Own Key*).

La plataforma unifica en un solo entorno de trabajo las tareas fragmentadas que actualmente se gestionan mediante herramientas dispersas (hojas de cálculo, tableros genéricos, múltiples generadores de IA y canales de mensajería), proporcionando un flujo continuo y coherente a lo largo de todo el ciclo de vida del lanzamiento musical.

---

## 2. Estrategia de Código Abierto e Integración de Ecosistema

Para acelerar el desarrollo sin reinventar la rueda, la suite adopta e integra paradigmas probados de proyectos open-source líderes, adaptándolos a las necesidades particulares de la industria musical:

| Base de Referencia / Fork | Módulo en Indie-Sync Suite | Adaptaciones y Responsabilidad Específica |
| :--- | :--- | :--- |
| **Plane** (`makeplane/plane`) | **Motor de Planificación y Gestión de Lanzamientos** | Conversión de sprints y epics en fases musicales (Pre-save, Release Day, Post-lanzamiento), gestión de dependencias duras (gatekeepers de máster y pitching) y vistas simplificadas RBAC. |
| **Open Generative AI** (`anil-matcha/open-generative-ai`) | **Pipeline Creativo Multimedia & Núcleo BYOK** | Bóveda centralizada de credenciales (BYOK), inyección obligatoria del Brand Vault en system prompts, presets de resolución para la industria (1:1 a 3000px, 9:16 Canvas/Reels, 16:9 Banners) y generación en lote. |
| **Postiz** (`gitroomhq/postiz`) | **Distribución Multicanal & Pauta Programática** | Conexión con la bandeja de creativos aprobados, programación de publicaciones vinculada a hitos del cronograma, ejecución de microcampañas ($20–$100 USD) y lectura de métricas orgánicas/pagas. |

---

## 3. Jerarquía de Contexto e Identidad de Marca (Brand Vault)

El sistema implementa una herencia estricta de contexto estructurada en tres niveles para impedir alucinaciones o desviaciones estéticas en la creación de contenidos:

| Nivel | Entidad | Datos del Contexto | Impacto Operativo |
| :---: | :--- | :--- | :--- |
| **Nivel 1** | **Sello (Label)** | Valores fundacionales, subgéneros principales, directrices de splits/derechos estándar y canales de distribución predeterminados. | Establece políticas de negocio globales y directrices institucionales del catálogo. |
| **Nivel 2** | **Artista (Artist)** | Biografía, arquetipo de personalidad, tono de voz discursivo, directrices visuales (paletas de color, tipografías, LoRA IDs) y perfiles en redes sociales. | Asegura la coherencia a largo plazo de la identidad del artista a través de múltiples lanzamientos. |
| **Nivel 3** | **Lanzamiento (Release)** | Concepto narrativo del track/álbum, metadatos (códigos ISRC/UPC), fecha objetivo, presupuesto de pauta y créditos detallados. | Inyecta el contexto específico a las tareas de Plane, los prompts generativos y los copys de publicación en Postiz. |

---

## 4. Flujo de Onboarding Asistido por Agente (Brand Context Interview)

La creación del `BrandContextDocument` se realiza mediante un proceso interactivo guiado:
1. **Ingesta Inicial:** El usuario suministra insumos base (pistas preliminares de audio, textos biográficos, enlaces a DSPs/redes o referencias visuales).
2. **Entrevista Socrática / Cuestionario Adaptativo:** El agente detecta omisiones clave (ej. narrativa de la canción, diferenciador sonoro, estética visual) y formula preguntas orientadas con sugerencias basadas en el subgénero musical del proyecto.
3. **Generación y Aprobación del Documento:** Se genera una ficha estructurada e inmutable que actúa como referencia fija para todas las generaciones creativas y de planificación.

---

## 5. Módulo de Planificación de Lanzamientos (Motor Musical Adaptado)

- **Arquetipos de Lanzamiento:** Flujos de trabajo preconfigurados según el formato:
  - Single Debut
  - EP de 6 semanas
  - Álbum de 12 semanas
  - Remix / Edición Deluxe
- **Hitos Bloqueantes y Dependencias Duras (Gatekeepers):** Reglas automáticas de negocio que alertan y recalculan fechas si se producen retrasos críticos (ej. entrega tardía del máster que compromete la ventana de pitching editorial en Spotify for Artists o la distribución a plataformas).
- **Control de Acceso Basado en Roles (RBAC):**
  - **Label Manager / A&R:** Supervisión total sobre presupuestos, cronogramas globales, activos y aprobaciones de pauta publicitaria.
  - **Artista / Manager:** Espacio de trabajo centrado en la revisión de tareas, aprobación ágil de copys/artes y visualización del progreso.

---

## 6. Pipeline Creativo Multimedia

- **Anclaje Estético Obligatorio:** Síntesis de piezas visuales alineadas rigurosamente al Brand Vault mediante prompts estructurados y adaptadores de estilo (LoRA / ControlNet):
  - Portadas 1:1 en alta resolución (hasta 3000px).
  - Lienzos y videos verticales 9:16 (Spotify Canvas, Instagram Reels, TikTok).
  - Banners 16:9 (YouTube, plataformas DSP, web).
- **Generación en Lote (Batching) y Curaduría:** Exploración simultánea de variantes visuales y narrativas para selección rápida antes de su paso a programación.

---

## 7. Distribución y Pauta Programática

- **Programación Multicanal Unificada:** Planificación sincronizada de teasers, anuncios de lanzamiento y contenido post-release en redes sociales y DSPs.
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

- **Chat Integrado en Barra Lateral (In-App Sidebar):** Asistente operativo contextual capaz de ejecutar acciones directas en la plataforma (agendar tareas, redactar textos, proponer ajustes al calendario y disparar generaciones).
- **Interoperabilidad vía API REST / Webhooks:** Capacidad de conexión con herramientas externas y clientes de modelos de lenguaje (ChatGPT Actions, Claude, Antigravity) para interactuar con la plataforma de forma remota.
- **Bóveda de Credenciales (BYOK):** Almacenamiento seguro bajo control exclusivo del usuario para claves de modelos generativos (OpenAI, Anthropic, Stability/Flux) y cuentas publicitarias.

---

## 11. Desglose de Historias de Usuario (Backlog Funcional)

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
