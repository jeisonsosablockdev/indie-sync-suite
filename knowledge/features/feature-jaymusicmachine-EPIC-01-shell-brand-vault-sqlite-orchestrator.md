# Problem Spec: shell-brand-vault-sqlite-orchestrator

## What problem exists
El proyecto Indie-Sync Suite (ISS) requiere un sustrato de ejecución local, offline-first y determinista para gestionar la identidad del sello discográfico y de los artistas (Brand Vault), el modelo relacional de datos de lanzamientos musicales y el pipeline agéntico conversacional con salvaguardas operativas.
Actualmente:
1. No existe el esquema relacional local en SQLite que modele la jerarquía fundamental `Label` -> `Artist` -> `Release` -> `ReleasePhase` -> `Task` -> `Asset` y la cola de sincronización asíncrona outbox (`cloud_sync_queue`).
2. No existe un mecanismo seguro de gestión de credenciales BYOK (Bring Your Own Key) anclado al llavero nativo del sistema operativo (`keyring-rs` / fallback cifrado) con validación activa de conectividad y cuotas.
3. No existe un registro unificado de proveedores de IA (`AiProviderRegistry`) desacoplado sobre Vercel AI SDK Core (`ai`) que provea contratos estrictos de Tool Calling con esquemas JSON Schema, guardrails contra acciones destructivas y registro de auditoría (*action log*).
4. No existe la interfaz de usuario ni el asistente lateral operativo (Sidebar v1) para orquestar la entrevista socrática de marca (Brand Interview) y el onboarding de artistas.

## Why it matters
La Épica 1 es la piedra angular y el fundamento técnico de todo el sistema Indie-Sync Suite:
- Sin una base de datos local SQLite reactiva e integrada mediante Rust IPC / Tauri, las épicas posteriores de planificación cronológica (Épica 2), generación creativa (Épica 3), distribución multicanal (Épica 4) y analítica (Épica 5) carecerían de un modelo de persistencia estructurado y requerirían costosos servicios externos como Docker o Plane.
- El modelo BYOK permite a los sellos y creadores independientes operar con sus propias cuotas y modelos de lenguaje (OpenAI, Anthropic, Gemini, Groq) sin incurrir en márgenes inflados de SaaS ni depender de custodias centralizadas de credenciales en servidores de terceros.
- El protocolo de Tool Calling con guardrails y action log garantiza la seguridad operativa: el agente de IA no puede modificar presupuestos de campañas ni eliminar tareas o metadatos sin consentimiento explícito del usuario.

## What outcome is expected
Al finalizar la Épica 1, el sistema contará con:
1. **Sustrato SQLite Core & Outbox**: Esquema relacional normalizado con migraciones deterministas, integridad referencial y tabla outbox `cloud_sync_queue` para sincronización eventual con Postiz Cloud.
2. **Bóveda de Credenciales BYOK**: Almacenamiento seguro de API keys en el OS Keychain, interfaz de gestión, botón de verificación en vivo ("Probar Conexión") e indicadores de estado visual.
3. **Bóveda de Marca (Brand Vault)**: CRUD completo de perfiles de Sello y Artista con paleta cromática hexadecimal, tipografías, enlaces a redes/DSPs y lineamientos de tono/voz.
4. **AiProviderRegistry & Contratos Agénticos**: Adaptador unificado con Vercel AI SDK Core, catálogo de tools delimitadas bajo JSON Schema, sistema de confirmación interactiva para acciones de alto impacto y log inmutable de auditoría.
5. **Brand Interview & Sidebar v1**: Entrevista adaptativa socrática para sintetizar el manual de identidad del artista y asistente lateral integrado en la interfaz Next.js.

## What gaps exist today
- No se han inicializado las migraciones de SQLite para las entidades de marca (`labels`, `artists`, `brand_profiles`) ni la jerarquía de lanzamientos (`releases`, `tasks`, `cloud_sync_queue`).
- Falta la abstracción de almacenamiento de claves de API en el keychain del SO con soporte seguro en Node/Electron/Tauri y modo fallback de desarrollo/CI.
- Falta la implementación del `AiProviderRegistry` que inicialice clientes dinámicos de OpenAI, Anthropic o Gemini a partir de las claves almacenadas.
- La aplicación Next.js carece del componente de Sidebar agéntico interactivo y del flujo wizard para la entrevista guiada de marca.

## What questions remain open
1. ¿La persistencia inicial en entorno web puro (Next.js en navegador durante desarrollo sin Tauri lanzado) usará SQLite vía WebAssembly/WASM o un adapter SQLite/libsql/better-sqlite3 local en Node? (Se recomienda `better-sqlite3` en backend Next.js local y SQLite embebido en Tauri para el desktop final).
2. ¿Qué modelo por defecto del registry se asignará a la entrevista socrática de contexto cuando el usuario ingrese múltiples claves (OpenAI vs Anthropic vs Gemini)? (Se recomienda auto-seleccionar el modelo de razonamiento más capaz configurado con fallback ordenado).
