# Problem Spec: release-planner-engine (Épica 2)

## What problem exists
La industria musical independiente carece de herramientas de gestión de proyectos diseñadas específicamente para la dinámica de lanzamientos musicales:
1. **Sobrecarga de Herramientas Genéricas:** Soluciones de software como Plane, Jira o Asana son monolíticas, complejas y requieren pesadas infraestructuras de microservicios (12 contenedores Docker en el caso de Plane) que resultan inviables para una aplicación de escritorio liviana local-first en Tauri.
2. **Falta de Semántica Musical:** Las herramientas estándar no comprenden el concepto de fecha objetivo ($T-0$), ventanas de pitching editorial en DSPs (Spotify for Artists exige mínimo 7 días de antelación), arquetipos de formato (Single, EP, Álbum, Remix) ni la estricta relación de dependencia que existe entre la entrega del máster de audio y las tareas de distribución.
3. **Fricción en el Manejo de Audio:** Intentar subir archivos WAV gigantescos (50MB–200MB) y stems a la base de datos o almacenamiento local satura los discos y rompe la sincronización.
4. **Fragilidad ante Retrasos:** En un lanzamiento musical, si la masterización se retrasa 4 días, mover manualmente 25 tareas dependientes una por una en un calendario genera errores humanos que derivan en lanzamientos fallidos o pérdida de listas editoriales.
5. **Brecha de Colaboración entre Sello y Artista:** Los managers necesitan ver presupuestos y detalles técnicos, mientras que los artistas solo necesitan aprobar artes y revisar sus fechas clave sin abrumarse.

## Why it matters
- **Viabilidad Técnica y Rendimiento:** Implementar el motor de planificación 100% nativo y ligero en SQLite elimina dependencias de servidores pesados de bases de datos externas, reduce el consumo de memoria a menos de 80MB de RAM y garantiza funcionamiento offline total.
- **Ventana Editorial de DSPs Protegida:** Un retraso no detectado en el hito del máster arruina la posibilidad de entrar en playlists editoriales de Spotify y Apple Music, lo cual representa hasta el 70% del alcance inicial de un artista independiente.
- **Eficiencia Operativa:** El recálculo automático en cascada con visualización Antes/Después ahorra horas de reprogramación manual a los A&R y Label Managers.
- **Adopción del Artista:** Una interfaz conmutada que permite al manager auditar la perspectiva simplificada del artista garantiza que la experiencia del creador sea limpia y centrada en la aprobación de entregables.

## What outcome is expected
Al completar la Épica 2, la plataforma dispondrá de:
1. **Ficha Conceptual del Lanzamiento (Contexto Nivel 3):** Captura de narrativa, mood sonoro, temática lírica, ISRC/UPC y presupuesto con herencia automática de la marca del Artista y Sello, y congelamiento de snapshot inmutable (`snapshot_frozen = 1`).
2. **Generador de Cronogramas por Arquetipo:** Creación atómica en SQLite de fases (`PRE_RELEASE`, `LIVE_RELEASE`, `POST_RELEASE`) y 15-30 tareas maestras a partir de 4 plantillas estándar de la industria (Single 6 sem, EP 8 sem, Álbum 12 sem, Remix 4 sem) calculadas respecto a $T-0$.
3. **Gestor de Enlaces de Audio Externos:** Registro de URLs categorizadas (`MASTER_WAV`, `INSTRUMENTAL`, `STEMS`, `ACAPELLA`) con comprobación HTTP ligera (`HEAD/GET`, timeout 3.5s), protección anti-SSRF y marcado automático del hito del máster como completado.
4. **Motor de Gatekeepers y Camino Crítico:** Identificación de cuellos de botella con alertas visuales de alta visibilidad cuando un hito crítico se vence o cuando la ventana de pitching editorial queda en riesgo.
5. **Recálculo en Cascada Atómico con Undo:** Propagación topológica de retrasos sobre tareas dependientes, con tabla comparativa de previsualización Antes/Después y posibilidad de deshacer el cambio (*undo*).
6. **Bucle Formal de Aprobación de Entregables:** Flujo de estados `DRAFT` $\rightarrow$ `IN_REVIEW` $\rightarrow$ `APPROVED` o `REJECTED`, exigiendo feedback explicativo obligatorio ante rechazos.
7. **Perspectiva Asimétrica de Roles (`RolePreviewToggle`):** Conmutador interactivo para alternar entre la visión completa de Label Manager y la vista filtrada de Artista en la app desktop.
8. **Herramientas de Planificación en el Asistente Lateral:** Tools ejecutables (`crear_tarea`, `mover_fecha_lanzamiento`, `consultar_gatekeepers`, `recalcular_cronograma`) con clasificación de riesgo e interceptor de Guardrails.

## What gaps exist today
1. El esquema relacional en SQLite cuenta con las tablas básicas de `labels` y `artists`, pero carece de la migración `004_release_planner.sql` para soportar conceptos de lanzamiento, fases, dependencias de tareas (DAG), enlaces externos de audio y feedback de entregables.
2. No existe el motor de cálculo de arquetipos ni la biblioteca de plantillas musicales temporales calculadas en base a offsets de días relativos.
3. El asistente lateral v1 solo cuenta con herramientas de Brand Vault (`crear_artista`, `consultar_marca`), careciendo de herramientas para consultar o alterar el cronograma de lanzamientos.
4. No existe el validador anti-SSRF para URLs de audio ni el mecanismo de auto-completado de hitos críticos.

## What questions remain open
1. *Días Hábiles vs Días Naturales:* ¿El motor de recálculo en cascada debe saltar fines de semana para tareas administrativas (ej. distribución legal) o mantener días naturales estrictos? Decisión técnica: Las tareas operativas operan en días naturales para mantener sincronización estricta con las semanas musicales (viernes de estreno $T-0$), pero se añade opción de configuración por tarea.
2. *Profundidad del Undo Stack:* ¿Cuántos niveles de deshacer se mantendrán en la sesión? Decisión técnica: Pila de 1 nivel de deshacer inmediato (*single-step undo*) con snapshot transaccional atómico, priorizando simplicidad y bajo consumo de memoria.
