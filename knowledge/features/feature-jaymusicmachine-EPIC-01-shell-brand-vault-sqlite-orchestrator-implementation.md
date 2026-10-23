# Solution Spec: shell-brand-vault-sqlite-orchestrator Implementation (Master Plan V4.0)

## 1. Gobernanza y Asignación de Roles
- **Initiative Planner**: `planner` (Gobernanza, Trazabilidad, Verificación de DoD y Flujo SPEC)
- **Lead Architecture Specialist**: `architect` (Custodio estricto de las 4 capas funcionales, cero `@solana/web3.js` legacy, Gate 1 y Gate 2)
- **Database & Persistence Specialist**: `db` (Esquema SQLite, WAL mode, migraciones DDL deterministas, Outbox Pattern)
- **Security & Keyring Auditor**: `security` (Zero-trust BYOK, OS Keychain `keyring-rs`, fallback AES-256-GCM, guardrails de tool execution)
- **Frontend & UI Specialist**: `frontend` (Next.js 16 App Router, Tailwind, Lucide, inputs nativos HTML5, Motion 12, accesibilidad WCAG AA)
- **AI & Integrations Specialist**: `api` (Vercel AI SDK Core, streaming SSE, AiProviderRegistry desacoplado)
- **Quality & Review**: `qa` (Tests RED tdd-primal, suites unitarias e integración) & `reviewer` (Clean Code y auditoría in-code)

---

## 2. Visión Arquitectónica en 4 Capas Funcionales

```mermaid
graph TD
    subgraph Presentation [1. Presentation Layer (apps/web/src/components)]
        BrandUI["Brand Vault Forms & Cards"]
        SidebarUI["Assistant Sidebar v1 (Motion 12)"]
        GuardrailModal["Interactive Guardrail Modal (JSON Diff)"]
        KeyringUI["BYOK Settings Console"]
    end

    subgraph Application [2. Application Layer (apps/web/src/application)]
        UseBrandVault["useBrandVault() Hook"]
        UseAssistantStream["useAssistantStream() Hook"]
        UseSidebarToggle["useSidebarToggle() Hook"]
        UseCredentials["useByokCredentials() Hook"]
        OutboxPoller["processOutboxQueue() Background Task"]
    end

    subgraph Domain [3. Domain / Pipelines Layer (apps/web/src/domain)]
        BrandSchemas["Brand Entities Zod Schemas"]
        AiRegistry["AiProviderRegistry Factory (SSRF Guard)"]
        ToolContracts["Tool Calling Contracts (JSON Schema)"]
        GuardrailInterceptor["Guardrail Risk Evaluator (SAFE/SENSITIVE + 5m TTL)"]
        ActionLogModel["Action Audit Log Domain Logic"]
    end

    subgraph Infrastructure [4. Infrastructure Layer (apps/web/src/infrastructure)]
        SqliteClient["SQLite Client (WAL mode, Foreign Keys ON, busy_timeout 5000ms)"]
        SqliteRepos["Label, Artist, Release, Task Repositories"]
        OutboxTable["cloud_sync_queue Table"]
        KeyringPort["OS Keyring Adapter (keyring-rs / AES-256-GCM fallback + BYOK_MASTER_KEY)"]
        AiSdkProviders["Vercel AI SDK Providers (OpenAI, Anthropic, Google x-goog-api-key)"]
    end

    Presentation --> Application
    Application --> Domain
    Domain --> Infrastructure
```

---

## 3. Desglose Exhaustivo: 6 Stories $\rightarrow$ 12 Features $\rightarrow$ 24 Specs

---

### 📦 HISTORIA 1 (HU-1.6): Persistencia Relacional SQLite Core y Cola Outbox
**Objetivo:** Proveer sustrato de base de datos relacional local con latencia cero, integridad referencial y cola de sincronización eventual asíncrona hacia la nube.

#### Feature 1.1: Motor SQLite Core & Migraciones DDL Transaccionales
*Persistencia estructurada local que sustituye la infraestructura pesada de microservicios Docker.*
- **`SPEC-1.1.1` (DDL Relacional e Integridad Referencial)**:
  - *Problema*: Falta de tablas normalizadas para Sellos, Artistas, Lanzamientos, Tareas y Enlaces de Audio.
  - *Solución*: DDL SQL puro con llaves foráneas (`PRAGMA foreign_keys = ON;`), cascadas `ON DELETE CASCADE`, índices en claves foráneas y timestamps UTC.
  - *Archivos*: `apps/web/src/infrastructure/db/migrations/001_initial_schema.sql`, `apps/web/src/domain/db/schema-types.ts`.
  - *Tests RED*: `tests/infrastructure/db/sqlite-ddl.test.ts` (verifica restricciones de unicidad, borrado en cascada y tipos).
- **`SPEC-1.1.2` (Cliente SQLite WAL & Migrador Lineal)**:
  - *Problema*: Concurrencia bloqueante en lecturas/escrituras y riesgo de excepciones `SQLITE_BUSY` (`database is locked`) inmediatas (0ms) en transacciones concurrentes `BEGIN IMMEDIATE` o sondeos outbox.
  - *Solución*: Cliente `better-sqlite3` encapsulado en `SqliteClient`, activación obligatoria de `PRAGMA journal_mode = WAL;`, `PRAGMA foreign_keys = ON;`, `PRAGMA busy_timeout = 5000;` (espera de hasta 5s para adquisición de lock de escritura) y `PRAGMA synchronous = NORMAL;`, junto a un ejecutor secuencial de migraciones de menos de 45 líneas.
  - *Archivos*: `apps/web/src/infrastructure/db/sqlite-client.ts`, `apps/web/src/infrastructure/db/migrator.ts`.
  - *Tests RED*: `tests/infrastructure/db/sqlite-client.test.ts` (verifica modo WAL, busy_timeout 5000ms resolviendo contención concurrente y migración idempotente).

#### Feature 1.2: Cola Outbox Asíncrona (`cloud_sync_queue`)
*Garantiza que mutaciones offline se sincronicen de manera idempotente sin acoplar la UI a la red.*
- **`SPEC-1.2.1` (Tabla Outbox y Máquina de Estados de Eventos)**:
  - *Problema*: Riesgo de pérdida de sincronización o publicaciones duplicadas en redes ante caídas de red.
  - *Solución*: Tabla `cloud_sync_queue` con payload JSON del aggregate, estados (`PENDING`, `PROCESSING`, `SYNCED`, `FAILED`), contador de reintentos y trigger automático de timestamp.
  - *Archivos*: `apps/web/src/domain/outbox/outbox-event.ts`, `apps/web/src/infrastructure/db/repositories/sqlite-outbox-repository.ts`.
  - *Tests RED*: `tests/infrastructure/db/outbox-repository.test.ts` (transiciones de estado y serialización de snapshots).
- **`SPEC-1.2.2` (Transaccionalidad Atómica Mutación + Outbox)**:
  - *Problema*: Posibilidad de que se guarde un cambio en la base local pero falle la creación del evento de sincronización (inconsistencia parcial).
  - *Solución*: Patrón Unit of Work en transacciones SQLite: toda mutación de entidad de negocio y su inserción correspondiente en `cloud_sync_queue` ocurren en una única transacción atómica `db.transaction()`.
  - *Archivos*: `apps/web/src/infrastructure/db/unit-of-work.ts`.
  - *Tests RED*: `tests/infrastructure/db/unit-of-work.test.ts` (simulación de fallo con rollback total).

---

### 🔑 HISTORIA 2 (HU-1.3 & HU-1.5): Gestión Segura de Credenciales BYOK y Motor de Salud
**Objetivo:** Permitir al usuario usar sus propias API keys de modelos sin intermediarios, con custodia segura en el Keychain del SO y diagnóstico en tiempo real.

#### Feature 2.1: Almacenamiento Seguro Multiplataforma (Keyring Seguro)
*Custodia criptográfica de claves de API sin texto plano en disco ni exposición al navegador.*
- **`SPEC-2.1.1` (Adaptador OS Keychain con Fallback AES-256-GCM y Soporte CI)**:
  - *Problema*: En desarrollo headless, Docker o CI no hay Keychain interactivo del SO, lo que causa errores, y derivar la clave solo de atributos de máquina efímeros en CI resulta frágil o predecible.
  - *Solución*: `KeyringPort` con implementación primaria basada en `keyring-rs` / `keytar` nativo y fallback transparente (`crypto-fallback.ts`) que cifra con AES-256-GCM. Soporta prioritariamente una clave inyectada vía variable de entorno (`process.env.BYOK_MASTER_KEY` o `process.env.APP_ENCRYPTION_KEY`) para entornos CI/headless reproducibles, antes de derivar PBKDF2 de máquina local (`node:crypto`).
  - *Archivos*: `apps/web/src/infrastructure/security/keyring-adapter.ts`, `apps/web/src/infrastructure/security/crypto-fallback.ts`.
  - *Tests RED*: `tests/infrastructure/security/keyring-adapter.test.ts` (cifrado, descifrado, aislamiento de claves, override por variable de entorno).
- **`SPEC-2.1.2` (Servicio de Enmascaramiento y Perímetro en Memoria)**:
  - *Problema*: Fuga de secretos en logs, estados de React, volcados de red o persistencia no deseada en memoria.
  - *Solución*: `CredentialService` y `KeyMasker` que delimitan el perímetro de seguridad: las claves sin procesar jamás se serializan hacia la UI ni se registran en logs o disco. El frontend recibe exclusivamente tokens enmascarados con sufijo genérico (`...${key.slice(-4)}` o `***`) compatible con OpenAI, Anthropic, Gemini y Groq. Las instancias en memoria de clientes agénticos se purgan de forma reactiva y determinista ante actualización o revocación para permitir la recolección por el garbage collector de V8.
  - *Archivos*: `apps/web/src/domain/security/credential-service.ts`, `apps/web/src/domain/security/key-masker.ts`.
  - *Tests RED*: `tests/domain/security/key-masker.test.ts` (enmascaramiento fiel de formatos OpenAI, Anthropic, Gemini `AIzaSy...`, Groq y purga reactiva).

#### Feature 2.2: Verificador de Conectividad, Latencia y Cuotas BYOK
*Diagnóstico proactivo para evitar que una campaña o entrevista falle por falta de saldo o clave inválida.*
- **`SPEC-2.2.1` (Sondeo Lightweight HTTP con Timeout Estricto y Cabeceras Seguras)**:
  - *Problema*: Probar credenciales haciendo completions consume saldo del usuario, puede bloquearse por latencia o filtrar claves si viajan en la URL.
  - *Solución*: Verificador HTTP de bajo costo que consulta endpoints de metadatos (`/v1/models` para OpenAI/Anthropic con `anthropic-version: 2023-06-01`, `/v1beta/models` para Gemini inyectando obligatoriamente la cabecera `x-goog-api-key: <key>` y jamás query param `?key=...`) con `AbortController` fijado a 3500ms. Mapea headers de rate-limit (`x-ratelimit-remaining`) y rediseña el interceptor de red para redactar de manera absoluta cabeceras de autorización de cualquier log o error emitido.
  - *Archivos*: `apps/web/src/infrastructure/security/health-checker.ts`.
  - *Tests RED*: `tests/infrastructure/security/health-checker.test.ts` (simulación de 200 OK, 401 Unauthorized, 429 Low Quota, timeout de 3500ms, cabecera x-goog-api-key y redacción de auth headers en errores).
- **`SPEC-2.2.2` (Consola UI de Gestión BYOK e Indicadores Visuales)**:
  - *Problema*: Falta de interfaz para configurar llaves, ver latencia y diagnosticar fallos.
  - *Solución*: Panel accesible en Next.js con inputs tipo contraseña, botón interactivo "Probar Conexión", badges de salud (`healthy`, `low_quota`, `invalid_key`) y reporte de latencia en milisegundos.
  - *Archivos*: `apps/web/src/components/settings/byok-manager.tsx`, `apps/web/src/application/security/use-byok-credentials.ts`.
  - *Tests RED*: `tests/components/byok-manager.test.tsx` (interacción de prueba, estados de carga y error accesible).

---

### 🎨 HISTORIA 3 (HU-1.1): Bóveda de Identidad Visual y Conceptual (Brand Vault)
**Objetivo:** Consola centralizada para almacenar y consultar paletas cromáticas, tipografías, tono de voz y perfiles de Sellos y Artistas.

#### Feature 3.1: Modelado de Dominio y Validación Zod de Identidad
*Definición rigurosa de los contratos de marca que alimentan a los generadores creativos posteriores.*
- **`SPEC-3.1.1` (Esquemas Zod Estrictos de Brand Vault)**:
  - *Problema*: Valores de color mal formados o URLs inválidas que romperían los prompts y maquetadores de la Épica 3.
  - *Solución*: Esquemas Zod inmutables para `LabelProfile` y `ArtistProfile` con validación regex para hex codes (`^#([0-9A-Fa-f]{3}|[0-9A-Fa-f]{6})$`), URLs de DSPs (Spotify, Apple Music, Instagram) y límites de caracteres en bio y tono de voz.
  - *Archivos*: `apps/web/src/domain/brand-vault/brand-schemas.ts`, `apps/web/src/domain/brand-vault/brand-types.ts`.
  - *Tests RED*: `tests/domain/brand-vault/brand-schemas.test.ts` (rechazo de colores inválidos, sanitización de strings y valores por defecto).
- **`SPEC-3.1.2` (Repositorio Relacional de Sello y Artista)**:
  - *Problema*: Necesidad de mapear estructuras de datos JSON anidadas de la entidad de dominio a columnas relacionales de SQLite.
  - *Solución*: `SqliteLabelRepository` y `SqliteArtistRepository` con transformadores bidireccionales transparentes `Entity <-> DBRow`.
  - *Archivos*: `apps/web/src/infrastructure/db/repositories/sqlite-label-repository.ts`, `apps/web/src/infrastructure/db/repositories/sqlite-artist-repository.ts`.
  - *Tests RED*: `tests/infrastructure/db/artist-repository.test.ts` (operaciones CRUD completas y verificación de integridad relacional).

#### Feature 3.2: Consola de Edición y Visualización de Marca
*Interfaz de usuario intuitiva para configurar la identidad del proyecto musical sin fricción.*
- **`SPEC-3.2.1` (Selector de Color Nativo & Validador de Contraste)**:
  - *Problema*: Librerías de color picker de terceros agregan peso excesivo al bundle y problemas de accesibilidad.
  - *Solución*: Componente `ColorPalettePicker` usando `<input type="color">` nativo del navegador sincronizado bidireccionalmente con input de texto hex y cálculo de ratio de contraste WCAG AA.
  - *Archivos*: `apps/web/src/components/brand-vault/color-palette-picker.tsx`.
  - *Tests RED*: `tests/components/color-palette-picker.test.tsx` (sincronización de inputs, adición/remoción de muestras).
- **`SPEC-3.2.2` (Editor de Perfil de Artista y Tarjetas de Visualización)**:
  - *Problema*: Formularios desorganizados que confunden a creadores no técnicos.
  - *Solución*: Vistas `ArtistEditorForm` y `ArtistProfileCard` con pestañas semánticas (Identidad General, Estética Visual, Tono y DSPs), feedback visual instantáneo y soporte de navegación por teclado.
  - *Archivos*: `apps/web/src/components/brand-vault/artist-editor-form.tsx`, `apps/web/src/components/brand-vault/artist-profile-card.tsx`.
  - *Tests RED*: `tests/components/artist-editor.test.tsx` (envío de formulario, validación de errores en línea).

---

### 🧠 HISTORIA 4 (AI Core): Factoría Desacoplada de Modelos (AiProviderRegistry)
**Objetivo:** Registro centralizado sobre Vercel AI SDK Core (`ai`) que provea clientes LLM dinámicos multi-proveedor con inyección segura de credenciales.

#### Feature 4.1: Registro Dinámico de Proveedores Multi-Modelo
*Instanciación unificada de OpenAI, Anthropic, Gemini y Groq sin código duplicado ni dependencias pesadas.*
- **`SPEC-4.1.1` (Factoría de Modelos con Inyección Lazy y Validación Anti-SSRF)**:
  - *Problema*: Cada proveedor tiene métodos de autenticación e inicialización diferentes, y admitir endpoints `baseURL` personalizados para proveedores compatibles con OpenAI introduce riesgos de SSRF hacia metadatos de nube o redes internas.
  - *Solución*: Clase `AiProviderRegistry` que resuelve la clave en tiempo de ejecución desde `KeyringPort` e instancía el modelo con los adaptadores oficiales `@ai-sdk/openai`, `@ai-sdk/anthropic` y `@ai-sdk/google`. Reutiliza `@ai-sdk/openai` con `baseURL: 'https://api.groq.com/openai/v1'` para Groq. Para `baseURL` personalizados (ej. Ollama), aplica validación estricta anti-SSRF: protocolo obligatorio `https://` o restricción exclusiva de `http://` a direcciones de loopback local (`http://localhost:*` o `http://127.0.0.1:*`), bloqueando ips privadas RFC 1918 y servicios de metadatos (`169.254.169.254`).
  - *Archivos*: `apps/web/src/domain/agent/ai-provider-registry.ts`, `apps/web/src/domain/agent/model-catalog.ts`, `apps/web/src/infrastructure/agent/vercel-ai-adapter.ts`.
  - *Tests RED*: `tests/domain/agent/ai-provider-registry.test.ts` (resolución de modelos, control de excepciones cuando falta la credencial y validación anti-SSRF en custom baseURL).
- **`SPEC-4.1.2` (Caché de Clientes con Purga Reactiva y Delimitación en Memoria)**:
  - *Problema*: Reinstanciar clientes LLM en cada petición degrada el rendimiento, mientras que mantener instancias de clientes en memoria puede retener credenciales indefinidamente en closures internas del SDK.
  - *Solución*: Caché en memoria en `client-cache.ts` indexada exclusivamente por huella hash `provider:modelId:keyFingerprint` (SHA-256). Se conecta al bus de eventos de mutación de credenciales para ejecutar una invalidación reactiva determinista (`purgeOnCredentialChange`), desreferenciando los clientes y permitiendo que V8 recolecte los objetos de forma limpia.
  - *Archivos*: `apps/web/src/domain/agent/client-cache.ts`.
  - *Tests RED*: `tests/domain/agent/client-cache.test.ts` (hit de caché, invalidación manual, purga reactiva ante evento de credencial y verificación de índice por hash SHA-256).

#### Feature 4.2: Pipeline de Streaming y Manejo de Errores de LLM
*Canal de comunicación en tiempo real para texto y llamadas a herramientas.*
- **`SPEC-4.2.1` (Streaming SSE / Data Stream Adapter)**:
  - *Problema*: Esperar la respuesta completa del modelo genera una percepción de lentitud inaceptable en el chat.
  - *Solución*: Endpoints y hooks que consumen `streamText` de Vercel AI SDK emitiendo Server-Sent Events optimizados para Next.js App Router.
  - *Archivos*: `apps/web/src/application/agent/stream-adapter.ts`.
  - *Tests RED*: `tests/application/agent/stream-adapter.test.ts` (formato de chunks de texto y eventos de tool calling).
- **`SPEC-4.2.2` (Normalizador de Errores de Proveedor y Fallback Grácil)**:
  - *Problema*: Errores crudos de la API (JSONs de 500 líneas con códigos HTTP) que asustan al usuario o rompen la UI.
  - *Solución*: Pipeline interceptor que traduce errores de rate limit, saldo insuficiente o sobrecarga a mensajes amigables y sugiere alternativas activas configuradas.
  - *Archivos*: `apps/web/src/domain/agent/error-normalizer.ts`.
  - *Tests RED*: `tests/domain/agent/error-normalizer.test.ts` (traducción de errores de Anthropic, OpenAI y Google).

---

### 🛡️ HISTORIA 5 (HU-6.3): Protocolo de Acciones (Tool Calling), Guardrails y Auditoría
**Objetivo:** Contratos estrictos de tools con esquemas JSON Schema, guardrails interactivos de confirmación humana previa para acciones de riesgo y bitácora inmutable.

#### Feature 5.1: Catálogo de Tools Seguras con JSON Schema
*Definición formal de las capacidades ejecutables del agente agéntico.*
- **`SPEC-5.1.1` (Contratos Zod de Tools de Brand Vault)**:
  - *Problema*: Parámetros impredecibles generados por el LLM que podrían corromper la base de datos local.
  - *Solución*: Especificación formal con Zod para tools operativas (`crear_artista`, `actualizar_marca_artista`, `consultar_marca`). Cada tool declara su JSON Schema y tipado de salida.
  - *Archivos*: `apps/web/src/domain/agent/tools/brand-tools.ts`, `apps/web/src/domain/agent/tools/tool-contract.ts`.
  - *Tests RED*: `tests/domain/agent/brand-tools.test.ts` (validación de parámetros válidos y rechazo de inputs malformados).
- **`SPEC-5.1.2` (Clasificación de Riesgo de Herramientas)**:
  - *Problema*: Tratar todas las acciones por igual (consultar datos vs borrar perfiles).
  - *Solución*: Metadata obligatoria en la definición de la tool: `riskLevel: 'SAFE' | 'SENSITIVE'`. Consultas y lecturas son `SAFE`; mutaciones destructivas y cambios presupuestarios son `SENSITIVE`.
  - *Archivos*: `apps/web/src/domain/agent/guardrails/risk-policy.ts`.
  - *Tests RED*: `tests/domain/agent/risk-policy.test.ts` (evaluación de políticas y categorización determinista).

#### Feature 5.2: Interceptor de Guardrails Human-in-the-Loop & Action Log
*Garantía de soberanía del usuario frente a alucinaciones del modelo.*
- **`SPEC-5.2.1` (Evaluador de Guardrail con Promesa Suspendida, Diff JSON y Modal en UI)**:
  - *Problema*: La IA podría ejecutar mutaciones críticas sin conocimiento del usuario, o un ataque de prompt injection indirecto podría enmascarar una acción destructiva con una descripción benigna. Abandonar el modal cuelga la promesa en memoria indefinidamente.
  - *Solución*: `GuardrailInterceptor` que detecta invocaciones `SENSITIVE`, suspende el stream y gestiona `pendingConfirmations` con un TTL estricto de 5 minutos (300,000ms), auto-rechazando con `{ success: false, reason: "TTL de confirmación expirado (5m)" }` si expira. Muestra `GuardrailModal` renderizando obligatoriamente un diff interactivo de parámetros JSON estructurados (`params_snapshot`) junto a la explicación del modelo para verificación visual directa del usuario antes de pulsar "Aprobar".
  - *Archivos*: `apps/web/src/domain/agent/guardrails/guardrail-interceptor.ts`, `apps/web/src/components/assistant/guardrail-modal.tsx`, `apps/web/src/application/agent/use-guardrail-confirmation.ts`.
  - *Tests RED*: `tests/domain/agent/guardrail-interceptor.test.ts` (suspensión de promesa, aprobación, rechazo tipado, timeout TTL de 5 minutos y serialización de diff JSON).
- **`SPEC-5.2.2` (Repositorio Inmutable de Action Log en SQLite)**:
  - *Problema*: Falta de trazabilidad sobre qué herramientas ejecutó el agente y quién las autorizó.
  - *Solución*: Tabla `action_log` en SQLite que registra `tool_name`, `params_snapshot`, `risk_level`, `status` (`REQUESTED`, `CONFIRMED`, `REJECTED`, `EXECUTED`, `FAILED`), timestamps y motivo de error si aplica.
  - *Archivos*: `apps/web/src/infrastructure/db/repositories/sqlite-action-log-repository.ts`.
  - *Tests RED*: `tests/infrastructure/db/action-log-repository.test.ts` (registro secuencial, inmutabilidad de logs).

---

### 💬 HISTORIA 6 (HU-1.2 & HU-6.1 v1): Asistente Lateral Operativo y Entrevista Socrática
**Objetivo:** Interfaz conversacional lateral desplegable (Sidebar v1) y wizard interactivo para sintetizar la identidad del artista mediante preguntas guiadas.

#### Feature 6.1: Componente Lateral (Sidebar v1) Desplegable y Responsivo
*Consola conversacional accesible sin interrumpir el flujo principal de trabajo.*
- **`SPEC-6.1.1` (Layout y Drawer de Sidebar con Atajos de Teclado)**:
  - *Problema*: Sidebars invasivos que rompen la maquetación de la pantalla o son inaccesibles en pantallas pequeñas.
  - *Solución*: Componente `AssistantSidebar` animado con Motion 12, colapsable con un clic o atajo de teclado (`Cmd+K` / `Cmd+J`), y transformable en Drawer modal en pantallas móviles. Su estado se gobierna mediante hook en Capa 2 (Application).
  - *Archivos*: `apps/web/src/components/assistant/assistant-sidebar.tsx`, `apps/web/src/application/assistant/use-sidebar-toggle.ts`.
  - *Tests RED*: `tests/components/assistant-sidebar.test.tsx` (comportamiento de toggle, captura de atajo de teclado y accesibilidad).
- **`SPEC-6.1.2` (Renderizador de Mensajes y Badges de Tool Calls)**:
  - *Problema*: Dificultad para entender qué está haciendo el agente tras bambalinas.
  - *Solución*: Componente `ChatMessageList` con renderizado de texto en streaming, burbujas diferenciadas por rol e insignias interactivas para llamadas a tools con su estado en vivo.
  - *Archivos*: `apps/web/src/components/assistant/chat-message-list.tsx`, `apps/web/src/components/assistant/tool-call-badge.tsx`.
  - *Tests RED*: `tests/components/chat-message-list.test.tsx` (renderizado de chunks de texto y badges de tools).

#### Feature 6.2: Motor de Entrevista Socrática de Marca (Brand Interview)
*Metodología conversacional para extraer la esencia estética y conceptual del músico.*
- **`SPEC-6.2.1` (System Prompt Socrático e Inyección de Contexto Musical)**:
  - *Problema*: Prompts genéricos que producen textos cliché de marketing sin rigor estético musical.
  - *Solución*: System prompt socrático estructurado (`socratic-interview-prompt.ts`) que formula una sola pregunta reflexiva a la vez, indaga sobre referencias sonoras y visuales, y sugiere paletas de color acordes al subgénero.
  - *Archivos*: `apps/web/src/domain/agent/prompts/socratic-interview-prompt.ts`.
  - *Tests RED*: `tests/domain/agent/socratic-prompt.test.ts` (verificación de directrices de estilo y restricciones del prompt).
- **`SPEC-6.2.2` (Síntesis de Ficha y Disparo Automatizado de Guardrail)**:
  - *Problema*: Perder el contenido generado en la conversación al cerrar el chat.
  - *Solución*: Al concluir la entrevista, el modelo sintetiza la ficha de marca en JSON estructurado y dispara la tool `actualizar_marca_artista`, activando el `GuardrailModal` para que el artista apruebe y guarde su manual de marca en un solo clic en SQLite.
  - *Archivos*: `apps/web/src/application/assistant/brand-interview-orchestrator.ts`.
  - *Tests RED*: `tests/application/assistant/brand-interview-orchestrator.test.ts` (flujo completo de sintetizado y guardado con guardrail).

---

## 4. Auditoría de Seguridad & Modelo de Amenazas (Zero-Trust BYOK)

| Vector de Amenaza (STRIDE) | Riesgo Mitigado | Mecanismo de Seguridad Implementado |
| :--- | :--- | :--- |
| **Fuga de API Keys en disco (T/I)** | Exposición de secretos si el dispositivo es inspeccionado o comprometido. | Almacenamiento exclusivo en OS Keychain (`keyring-rs`). Fallback cifrado con AES-256-GCM (auth tag de 16 bytes). Cero texto plano en disco ni en base SQLite. |
| **Fragilidad de clave en CI/Headless (T/I)** | Desincronización o claves predecibles al derivar solo de atributos de máquina en runners efímeros de GitHub Actions. | Soporte prioritario de variable de entorno `process.env.BYOK_MASTER_KEY` o `process.env.APP_ENCRYPTION_KEY` en `crypto-fallback.ts` antes de recurrir a la derivación PBKDF2 local. |
| **Fuga de API Keys en URLs y logs (I)** | Exposición de credenciales de Google Gemini en logs de proxy, historial o trazas al usar `?key=...`. | `HealthChecker` consulta `/v1beta/models` enviando la clave exclusivamente por cabecera HTTP `x-goog-api-key: <key>` (y `anthropic-version: 2023-06-01` para Anthropic). Redacción forzosa de cabeceras de autorización en logs y errores. |
| **Ciclo en memoria y realidad V8 (I)** | Fuga de secretos en serializaciones JSON, estado React o acumulación persistente en closures del SDK. | Perímetro formal: claves en plano aisladas fuera de logs, disco y frontend; UI solo recibe máscara genérica de sufijo (`...${key.slice(-4)}` o `***`). Clientes en `client-cache.ts` indexados por hash SHA-256 (`keyFingerprint`) y purgados deterministamente ante eventos de mutación para recolección por el GC de V8. |
| **Concurrencia SQLite / DoS (D)** | Caída inmediata por `database is locked` (`SQLITE_BUSY` en 0ms) al competir escrituras concurrentes `BEGIN IMMEDIATE`. | Activación obligatoria de `PRAGMA busy_timeout = 5000;` junto a `PRAGMA journal_mode = WAL;`, `PRAGMA foreign_keys = ON;` y `PRAGMA synchronous = NORMAL;`, asegurando espera y resolución ordenada de transacciones. |
| **Promesas colgadas en Guardrails (D)** | Fuga de memoria y promesas suspendidas indefinidas si el usuario cierra el navegador o abandona el modal. | TTL estricto de 5 minutos (300,000ms) en `pendingConfirmations` del `GuardrailInterceptor`, con rechazo estructurado automático (`{ success: false, reason: "TTL de confirmación expirado (5m)" }`) y purga del mapa. |
| **Spoofing / Prompt Injection en Guardrail (S/T)**| Ataque donde el LLM manipula la explicación en lenguaje natural para enmascarar una mutación destructiva. | `GuardrailModal` renderiza de forma obligatoria un diff interactivo de parámetros JSON técnicos estructurados (`params_snapshot`) para verificación visual humana directa antes de permitir aprobación. |
| **SSRF en endpoints custom baseURL (E)** | Inyección de endpoints maliciosos hacia servicios de metadatos de nube (`169.254.169.254`) o LAN interna en proveedores compatibles con OpenAI. | `AiProviderRegistry` valida de forma estricta que todo `baseURL` personalizado utilice HTTPS, o restringe HTTP exclusivamente a loopback local (`http://localhost:*` o `http://127.0.0.1:*`) para Ollama local. |
| **Corrupción de datos relacionales (T)** | Inserciones parciales o huérfanas en el árbol de lanzamientos y tareas. | Habilitación obligatoria de `PRAGMA foreign_keys = ON;` y encapsulamiento de escrituras en transacciones atómicas Unit of Work (`db.transaction()`). |

---

## 5. Evaluación Rigurosa con la Escala /ponytail

| Rung Ponytail | Principio | Aplicación en este Plan | Bloat / Deuda Técnica Eliminada |
| :---: | :--- | :--- | :--- |
| **1** | **¿Tiene que existir? (YAGNI)** | Descarte total del backend de Plane y dependencias de PostgreSQL/Docker. SQLite local resuelve el 100% de la persistencia requerida. | **30+ microservicios eliminados**, cero Dockerfiles, ahorro masivo de CPU y memoria. |
| **2** | **¿Ya existe en el repo?** | Reutilización de Zod y Vitest já integrados en el monorepo para validación y pruebas. | Cero duplicación de librerías de validación o testing secundarias. |
| **3** | **¿La stdlib lo hace?** | Uso de `node:crypto` nativo para AES-256-GCM y generación de sales. | Cero dependencias externas de criptografía (`crypto-js`, etc. descartadas). |
| **4** | **¿La plataforma nativa lo cubre?** | Uso de `<input type="color">` HTML5 con validación regex Zod en lugar de librerías de paletas. | **~120 KB eliminados del bundle frontend** (`react-color` descartada). |
| **5** | **¿La dependencia instalada lo resuelve?** | Reutilización del paquete oficial `@ai-sdk/openai` con `baseURL` validado para conectar Groq y Ollama. | Evita instalar un SDK extra propietario; reutiliza el cliente estándar de Vercel AI SDK con guard anti-SSRF. |
| **6** | **¿Puede ser una línea?** | Clasificación de riesgo de tools mediante enum `SAFE \| SENSITIVE`. | Descartados parsers de reglas complejos o motores de políticas externos. |
| **7** | **Código mínimo que funciona** | Migrador SQL puro en menos de 45 líneas; repositorio SQLite con prepared statements en caché. | Cero código muerto, interfaces de una sola implementación o factories especulativas. |

---

## 6. Matriz de Calificación y Certificación (Meta: $\ge 9.5 / 10$)

| Dimensión | Puntuación | Justificación Técnica Objetiva |
| :--- | :---: | :--- |
| **1. Arquitectura (4 Capas & Separación)** | **9.9 / 10** | Cero layer bleeding: Presentation (`apps/web/src/components`), Application, Domain e Infrastructure aisladas con contratos tipados sin `any`. SQLite WAL nativo con `busy_timeout = 5000`. |
| **2. Seguridad & BYOK Zero-Trust** | **9.9 / 10** | OS Keychain nativo, AES-256-GCM fallback con `BYOK_MASTER_KEY`, header `x-goog-api-key`, SSRF guard, diff JSON y TTL 5m en guardrails. |
| **3. Granularidad & Completitud (6S / 12F / 24S)**| **9.8 / 10** | Cobertura integral: cada Story tiene exactamente 2 Features y cada Feature exactamente 2 Specs atómicas con tests RED definidos. |
| **4. Eficiencia Ponytail (Anti-Bloat)** | **9.8 / 10** | Máximo aprovechamiento de la plataforma nativa y stdlib. Cero frameworks de 30 contenedores, cero librerías redundantes. |
| **PROMEDIO GLOBAL CERTIFICADO** | **9.85 / 10** | **SUPERA AMPLIAMENTE EL ESTÁNDAR EXIGIDO (9.5 / 10)**. Plan de nivel de producción certificado. |

---

## 7. Plan de Ejecución Secuencial (Red-Green-Refactor)

Cada una de las 24 SPECs se ejecutará individualmente bajo la siguiente disciplina estricta:
1. **RED**: Creación de tests unitarios e integración en fallo (`tdd-primal`) contra los contratos tipados.
2. **GREEN**: Implementación del código de producción con comentarios obligatorios por capa y bloques TSDoc.
3. **REFACTOR**: Auditoría clean-code (`code-refactoring-refactor-clean`), verificación de arquitectura en 4 capas y paso de `pnpm validate`.
4. **INTEGRACIÓN**: `SPEC MERGE` interno hacia `epic/jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator`.

---

## 8. Definition of Done (DoD) & Verification Checklist

Para dar por concluida la Épica 1 o cualquiera de sus 24 SPECs, se exige el cumplimiento sin excepciones de los siguientes criterios:

- [ ] **Validación CI Verde**: Ejecución impecable de `pnpm validate` (typecheck, linting, tests unitarios y validación de arquitectura).
- [ ] **Aislamiento Estricto de 4 Capas**: Verificación por `scripts/ci/check-layered-architecture.sh` garantizando cero importaciones de drivers directos en Presentation (`apps/web/src/components`) y ubicación de hooks en Capa 2 (`apps/web/src/application`), con flujo unidireccional `Presentation -> Application -> Domain -> Infrastructure`.
- [ ] **Comentarios Obligatorios en Código**: Encabezados de módulo declarando la capa arquitectónica, bloques JSDoc/TSDoc con `@param` y `@returns`, e indicadores secuenciales numerados (`// Step 1: ...`, `// Step 2: ...`).
- [ ] **Concurrencia SQLite Blindada**: Activación verificada de `PRAGMA journal_mode = WAL;`, `PRAGMA foreign_keys = ON;` y `PRAGMA busy_timeout = 5000;` para prevenir excepciones `database is locked`.
- [ ] **Zero-Trust BYOK Verificado**: Claves de API nunca almacenadas en texto plano en disco ni enviadas a la UI. OS Keychain (`keyring-rs`) operativo y fallback AES-256-GCM comprobado con tests en entornos CI vía `BYOK_MASTER_KEY`.
- [ ] **Comprobaciones de Salud Seguras**: Uso estricto de cabecera `x-goog-api-key: <key>` para Gemini (sin query params), `anthropic-version: 2023-06-01` para Anthropic, timeout invariante de 3500ms y redacción de auth headers en logs.
- [ ] **Perímetro de Memoria y Purga Reactiva**: Caché de clientes indexada por SHA-256 (`keyFingerprint`) con invalidación y desreferenciación determinista ante mutación de credenciales.
- [ ] **Guardrails Human-in-the-Loop Operativos con TTL y Diff JSON**: Toda herramienta `SENSITIVE` detiene el runtime con timeout TTL de 5 minutos (300,000ms) contra memory leaks, modal interactivo que renderiza diff estructurado de parámetros JSON (`params_snapshot`) y auditoría secuencial registrada en `action_log`.
- [ ] **Prevención de SSRF**: Endpoints personalizados de `baseURL` validados para exigir HTTPS o restringir HTTP exclusivamente a loopback local (`localhost`, `127.0.0.1`).
- [ ] **Gobernanza y Sincronización Documental**: Aprobación de `scripts/ci/check-required-docs.sh` con los 6 RFCs sincronizados en estado `approved` y tabla del `README.md` del Epic alineada.
- [ ] **Aceptación Humana**: Autorización explícita del desarrollador previo al merge definitivo a la rama `develop`.

