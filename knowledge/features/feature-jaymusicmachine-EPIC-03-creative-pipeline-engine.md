# Problem Spec: creative-pipeline-engine (Épica 3)

## What problem exists
La creación de material promocional y activos visuales para lanzamientos musicales independientes enfrenta serios obstáculos técnicos y operativos:
1. **Desconexión con la Identidad de Marca y Alucinación Estética:** Los modelos generativos comerciales (DALL-E, Midjourney, Stable Diffusion, Flux) carecen de contexto histórico sobre el artista. Cuando un creador ingresa un prompt genérico, el modelo inventa colores, estéticas y estilos incongruentes con el universo visual del sello y el artista, diluyendo la identidad de marca construida en el Brand Vault.
2. **Dependencia Forzada de APIs de Renderizado y Costos Imprevistos:** Las plataformas generativas tradicionales obligan al usuario a consumir créditos de API directos para renderizar imágenes. Artistas y sellos independientes que utilizan herramientas externas dedicadas (como Midjourney vía Discord/Web, Runway Gen-3, Kling AI, Sora o software local) quedan excluidos si la plataforma no ofrece un modo autónomo para generar, inspeccionar, editar y exportar **únicamente los prompts estructurados en texto plano** sin costo.
3. **Formatos y Dimensiones Desalineados con DSPs y Redes:** Las plataformas de streaming y redes sociales exigen especificaciones técnicas exactas e inflexibles:
   - Portada oficial para DSPs (Spotify, Apple Music, Tidal): Formato 1:1 estricto a **3000×3000 px** en PNG/JPG.
   - Videos y lienzos verticales: Formato 9:16 a **1080×1920 px** (Spotify Canvas, Instagram Reels, TikTok, YouTube Shorts).
   - Banners horizontales: Formato 16:9 a **1920×1080 px** (YouTube Channel Art, cabeceras de Spotify for Artists y Twitter/X).
   Generar manualmente estos ratios en herramientas no especializadas genera deformaciones, recortes indeseados y pérdida de calidad visual.
4. **Tipografía Deforme generada por Modelos de Imagen:** Los modelos generativos basados en difusión cometen errores flagrantes al renderizar texto tipográfico: deforman caracteres, escriben mal los nombres de las canciones y artistas, o generan texto ininteligible que es rechazado de inmediato por los agregadores y DSPs (Spotify rechaza portadas con tipografía ilegible o artefactos de IA evidentes).
5. **Generación Aislada de Copys y Guiones Promocionales:** La redacción de textos para redes suele hacerse en silos desconectados del cronograma de lanzamiento. Los copys no respetan las fases temporales del lanzamiento ($T-14$ teaser, $T-7$ pre-save, $T-0$ drop day, $T+7$ playlist push) ni el vocabulario específico del arquetipo del artista.
6. **Dispersión de Activos Aprobados y Falta de Inmutabilidad:** Los archivos gráficos y textos aprobados terminan dispersos en carpetas locales, chats de WhatsApp o hilos de correo, sin trazabilidad hacia las tareas del cronograma ni hashes de contenido inmutables que preparen la distribución multicanal hacia Postiz (Épica 4).

## Why it matters
- **Preservación Incondicional de la Identidad Visual:** Al obligar al compilador de prompts a inyectar las directrices de los 3 niveles de contexto (Nivel 1: Sello, Nivel 2: Artista, Nivel 3: Release Concept), se erradica la alucinación estilística y se garantiza consistencia cromática, tonal y estética.
- **Soberanía del Usuario y Cero Barrera de Costo (Modo Prompt-Only):** Permitir al usuario obtener y editar los prompts maestros en texto plano con un clic (con presets para Midjourney `--ar 1:1`, Flux o Runway) habilita a creadores sin API keys a beneficiarse del 100% de la inteligencia conceptual de la plataforma sin gastar un centavo en renderizado.
- **Cumplimiento de Estándares Profesionales de Distribución Digital:** Garantizar portadas 1:1 a 3000×3000 px con maquetación tipográfica vectorial limpia (sobreimpresión nítida del track y artista con tipografías oficiales) asegura que el arte sea aceptado sin rechazos por distribuidoras como DistroKid, TuneCore, CD Baby o The Orchard.
- **Alineación Temporal del Mensaje Promocional:** La generación contextual de copys y ganchos (*hooks*) por fase del lanzamiento maximiza el engagement y las conversiones a pre-saves en momentos críticos del cronograma.
- **Base Determinista para la Automatización de Distribución:** Un repositorio de activos centralizado (*Asset Vault*) con identificadores SHA-256 e inmutabilidad de contenido permite el protocolo *Media Handshake* con Postiz en la nube sin transferencias duplicadas ni fallos de sincronización.

## What outcome is expected
Al finalizar la Épica 3, la suite contará con:
1. **Generador Multi-Formato Anclado a la Marca (HU-3.1):** Motor de generación de directrices visuales y piezas gráficas en las 3 dimensiones maestras de la industria musical (1:1 a 3000px, 9:16 a 1080x1920px y 16:9 a 1920x1080px), inyectando estrictamente paleta, arquetipo y narrativa lírica del Brand Vault.
2. **Cuadrícula de Exploración y Curaduría en Lote (HU-3.2):** Generación de cuadrículas con 4 variantes simultáneas por prompt, permitiendo triage ágil (`Aprobar`, `Descartar`, `Regenerar Variante`) y vinculación directa del activo aprobado a la tarea correspondiente del planificador en SQLite.
3. **Generador de Copys y Guiones por Fase de Lanzamiento (HU-3.3):** Asistente de redacción promocional que genera ganchos (*hooks*) para TikTok/Reels, descripciones para YouTube y copys para Instagram/X por fase de campaña, con conteo estricto de caracteres y sugerencias de hashtags.
4. **Compositor Tipográfico Vectorial sobre Portadas (HU-3.4):** Herramienta visual de maquetación tipográfica que sobrepone limpiamente el título de la canción y nombre del artista utilizando tipografías oficiales del perfil del artista, con controles de posición, alineación, color, sombra y exportación a 3000×3000 px sin artefactos de IA.
5. **Repositorio Central de Activos Aprobados con Content-Hashing (HU-3.5):** Galería unificada y filtrable por formato de todos los artes, videos y copys aprobados para un lanzamiento, con cálculo automático de hash SHA-256 para garantizar inmutabilidad y preparar el *Media Handshake* con Postiz Cloud.
6. **Estudio y Gestión de Prompts Editables - Text-Only Workflow (HU-3.6):** Editor interactivo de prompts maestros en texto plano que permite inspeccionar, editar, versionar, actualizar y copiar los prompts enriquecidos al portapapeles con selectores de formato (Midjourney, Flux/SD, Runway/Kling, Texto Plano), funcionando al 100% sin requerir claves de API de imagen.
7. **Tools Creativas en el Asistente Lateral (HU-6.1 v3):** Expansión del catálogo del orquestador conversacional con herramientas ejecutables (`generar_portada`, `generar_copy`, `copiar_prompt`, `actualizar_prompt`, `listar_activos_aprobados`) y tarjetas interactivas de previsualización en el chat.

## What gaps exist today
1. La base de datos SQLite cuenta con las migraciones `001_initial_schema.sql` y `004_release_planner.sql`, pero carece del esquema DDL `005_creative_pipeline.sql` para persistir activos generados (`creative_assets`), lotes de variantes (`generation_batches`), prompts editables (`creative_prompts`) y presets tipográficos (`typography_presets`).
2. Aunque existe el `AiProviderRegistry` para LLMs (OpenAI, Anthropic, Gemini), no existe la integración especializada para síntesis multimodal de imágenes (vía Vercel AI SDK / Stability / Flux) ni la abstracción desacoplada para el modo Prompt-Only.
3. No existe un compilador determinista de prompts que transforme el `UnifiedBrandContext` y el `ReleaseConcept` en prompts artísticos estructurados con modificadores de plataforma.
4. No existe el motor de renderizado y composición tipográfica vectorial en alta resolución para exportación a 3000×3000 px.
5. El chat lateral carece de las tools creativas registradas en su catálogo de Guardrails.

## What questions remain open
1. *Renderizado Tipográfico en Entorno Local-First:* ¿Se debe utilizar HTML5 Canvas en navegador o renderizado vectorial con Satori/SVG en servidor local?  
   **Decisión Técnica:** Se implementa un motor híbrido basado en Canvas nativo de alta resolución en Capa 1 y un compositor de coordenadas matemáticas en Capa 3 (`typography-compositor.ts`), garantizando exportación nítida a 3000×3000 px tanto en cliente como en entornos sin servidor.
2. *Almacenamiento Local de Archivos de Imagen:* ¿Dónde residen físicamente las imágenes generadas o importadas?  
   **Decisión Técnica:** Los archivos se almacenan en el directorio local de datos de usuario de la app (vía Tauri/Node filesystem abstraction) bajo la ruta `$APP_DATA/assets/<release_id>/<content_hash>.<ext>`, mientras que SQLite almacena metadatos, ruta relativa, hash SHA-256 y dimensiones para mantener la base de datos liviana y reactiva.
3. *Compatibilidad Multi-Herramienta de Prompts:* ¿Qué plataformas de generación externa se soportan en la exportación?  
   **Decisión Técnica:** Se soportan 4 perfiles estandarizados: (1) Midjourney v6 (`--ar <ratio> --v 6.1 --style raw`), (2) Stable Diffusion / Flux (cajas separadas de prompt positivo y negativo con pesos numéricos), (3) Runway Gen-3 / Kling / Luma (prompt cinemático de movimiento y cámara), y (4) Texto Plano enriquecido para ChatGPT/Claude/Gemini.
