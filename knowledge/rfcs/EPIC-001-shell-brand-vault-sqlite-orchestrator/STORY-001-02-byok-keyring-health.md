---
type: RFC
title: STORY-001-02 HU-1.3/1.5 Gestión Segura de Credenciales BYOK y Motor de Diagnóstico de Salud
description: RFC Story — Custodia criptográfica de API keys en OS Keychain con fallback AES-256-GCM, ciclo de vida en memoria sin fugas y motor de salud HTTP ligero a 3500ms
tags: [rfc, story, security, byok, keychain, encryption, health-check, quotas, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-02-byok-keyring-health

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-02`
- Mapping: `HU-1.3/1.5`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Usuario y Creador musical de la plataforma,
- **Quiero** registrar y custodiar mis propias claves de API para LLMs (OpenAI, Anthropic, Gemini, Groq) en el llavero del sistema operativo, con verificación en vivo de conectividad, latencia y cuotas,
- **Para que** pueda operar con mis cuentas sin intermediarios ni sobrecostos de suscripción y con la seguridad de que mis credenciales jamás se filtrarán ni quedarán en texto plano.

### Criterios de Aceptación Oficiales
1. Permite registrar, actualizar, enmascarar y revocar API keys (OpenAI, Anthropic, Gemini, Groq).
2. Encripta y resguarda los secretos en el Keychain nativo del sistema operativo (`keyring-rs`), activando un fallback determinista cifrado con AES-256-GCM en entornos headless o CI mediante soporte prioritario de variable de entorno `BYOK_MASTER_KEY` / `APP_ENCRYPTION_KEY` antes de derivar de parámetros de máquina local.
3. Garantiza un perímetro estricto de aislamiento de claves en memoria: las claves sin procesar jamás se registran en logs, disco ni serializaciones hacia el frontend; la UI únicamente recibe tokens enmascarados con sufijo genérico (`...${key.slice(-4)}` o `***`) y las instancias en caché en memoria se purgan de forma reactiva y determinista ante actualización o revocación para permitir la recolección por el garbage collector de V8.
4. Implementa un motor de diagnóstico de salud mediante sondeo HTTP ligero a endpoints de metadatos (`/v1/models` para OpenAI/Anthropic con `anthropic-version: 2023-06-01`, `/v1beta/models` para Gemini pasando la credencial mediante cabecera `x-goog-api-key: <key>` y jamás como parámetro de URL `?key=...`) con un timeout estricto e innegociable de 3500ms, redacción obligatoria de cabeceras en logs de error y mapeo de cuota (`healthy`, `low_quota`, `invalid_key`, `unreachable`).

### Problem & Gap Analysis
Almacenar credenciales en variables `.env` o en bases de datos SQLite sin cifrar expone al usuario a robo de claves por malware local o filtraciones en repositorios. Además, probar credenciales mediante llamadas de generación consume tokens reales y puede congelar la interfaz si el proveedor está caído. Esta historia resuelve la custodia criptográfica y la validación no destructiva de salud.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.1: Almacenamiento Seguro Multiplataforma (Keyring Seguro)
*Custodia criptográfica de claves de API sin texto plano en disco ni exposición al navegador.*
- **`SPEC-2.1.1` (Adaptador OS Keychain con Fallback AES-256-GCM y Soporte CI)**:
  - *Problema*: En desarrollo headless, Docker o CI no hay Keychain interactivo del SO, y derivar la clave solo de parámetros de máquina efímeros en contenedores CI resulta frágil o predecible.
  - *Solución*: Puerto `KeyringPort` con implementación primaria basada en `keyring-rs` / `keytar` nativo y fallback transparente (`crypto-fallback.ts`) que cifra con AES-256-GCM. Soporta prioritariamente una clave de cifrado inyectada vía variable de entorno (`process.env.BYOK_MASTER_KEY` o `process.env.APP_ENCRYPTION_KEY`) para entornos CI/headless reproducibles, y como alternativa genera y deriva una clave de máquina local (`node:crypto` PBKDF2 con 100,000 iteraciones, salt de 32 bytes y auth tag de 16 bytes).
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/security/keyring-adapter.ts`, `apps/web/src/infrastructure/security/crypto-fallback.ts`).
  - *Tests RED*: `tests/infrastructure/security/keyring-adapter.test.ts` (cifrado, descifrado, aislamiento de claves, override por variable de entorno).
- **`SPEC-2.1.2` (Servicio de Enmascaramiento y Perímetro en Memoria)**:
  - *Problema*: Fuga de secretos en logs de consola, árbol de componentes de React, volcados de red o persistencia no deseada en memoria.
  - *Solución*: `CredentialService` y `KeyMasker` que delimitan formalmente el perímetro de seguridad: las claves en texto plano jamás se serializan en JSON hacia el cliente ni se registran en logs o disco. El frontend recibe exclusivamente tokens enmascarados con sufijo genérico de 4 caracteres (`...${key.slice(-4)}` o `***` si longitud < 8) compatible con OpenAI, Anthropic, Gemini y Groq. Las referencias en memoria en clientes agénticos se purgan de forma reactiva y determinista ante actualización o revocación mediante bus de eventos, permitiendo su recolección por el garbage collector de V8.
  - *Capa*: `Domain` (`apps/web/src/domain/security/credential-service.ts`, `apps/web/src/domain/security/key-masker.ts`).
  - *Tests RED*: `tests/domain/security/key-masker.test.ts` (enmascaramiento fiel de formatos OpenAI, Anthropic, Gemini `AIzaSy...`, Groq `gsk_...` y purga reactiva).

### 🔹 FEATURE 2.2: Verificador de Conectividad, Latencia y Cuotas BYOK
*Diagnóstico proactivo para evitar que una campaña o entrevista falle por falta de saldo o clave inválida.*
- **`SPEC-2.2.1` (Sondeo Lightweight HTTP con Timeout Estricto y Cabeceras Seguras)**:
  - *Problema*: Probar credenciales haciendo completions consume saldo del usuario, puede bloquearse por latencia o filtrar claves si viajan como parámetros de URL en logs de proxy o trazas de error.
  - *Solución*: Verificador HTTP de bajo costo que consulta endpoints de metadatos (`/v1/models` para OpenAI/Anthropic requiriendo cabecera `anthropic-version: 2023-06-01`, `/v1beta/models` para Gemini inyectando obligatoriamente la cabecera `x-goog-api-key: <key>` y jamás query param `?key=...`) con `AbortController` fijado estrictamente a 3500ms. Mapea headers de cuota (`x-ratelimit-remaining`) y rediseña el interceptor de red para redactar de manera absoluta cabeceras de autorización (`Authorization`, `x-goog-api-key`) de cualquier log o error emitido.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/security/health-checker.ts`).
  - *Tests RED*: `tests/infrastructure/security/health-checker.test.ts` (simulación de 200 OK, 401 Unauthorized, 429 Low Quota, timeout de 3500ms, cabecera x-goog-api-key y redacción de auth headers en errores).
- **`SPEC-2.2.2` (Consola UI de Gestión BYOK e Indicadores Visuales)**:
  - *Problema*: Falta de interfaz unificada para configurar llaves, ver latencia y diagnosticar fallos de proveedor.
  - *Solución*: Panel accesible en Next.js con inputs tipo contraseña, botón interactivo "Probar Conexión", micro-spinner de carga, badges semánticos de salud (`healthy`, `low_quota`, `invalid_key`, `unreachable`) y reporte de latencia en milisegundos.
  - *Capa*: `Presentation` / `Application` (`apps/web/src/components/settings/byok-manager.tsx`, `apps/web/src/application/security/use-byok-credentials.ts`).
  - *Tests RED*: `tests/components/byok-manager.test.tsx` (interacción de prueba, estados de carga y error accesible).

### Contrato de la Interfaz KeyringPort y HealthCheckResult
```typescript
export interface KeyringPort {
  getSecret(service: string, account: string): Promise<string | null>;
  setSecret(service: string, account: string, secret: string): Promise<void>;
  deleteSecret(service: string, account: string): Promise<boolean>;
}

export type ProviderStatus = 'healthy' | 'low_quota' | 'invalid_key' | 'unreachable';

export interface HealthCheckResult {
  provider: string;
  status: ProviderStatus;
  latencyMs: number;
  maskedKey: string;
  details?: string;
}
```

---

## Critique
- **Reviewer(s)**: `security`, `architect`, `ponytail`
- **Critical findings**:
  1. *Fugas en Headers de Error y URLs*: Si un endpoint de health check devuelve 401/403, el cuerpo de respuesta o la traza de error podría contener la clave en el header `Authorization`. Para Gemini, pasar la clave como query param (`?key=...`) la expondría en logs de proxies y servidores; es obligatorio usar la cabecera `x-goog-api-key: <key>` y redactar cabeceras sensibles de todos los logs de error. Para Anthropic se requiere explícitamente `anthropic-version: 2023-06-01`.
  2. *Derivación en CI/Headless*: Confiar solo en atributos efímeros de máquina en contenedores de GitHub Actions genera desincronización o claves predecibles. Se añade soporte prioritario de `BYOK_MASTER_KEY` / `APP_ENCRYPTION_KEY`.
  3. *Perímetro de Memoria y Realidad de V8*: Las cadenas primitivas inmutables en JavaScript no pueden borrarse físicamente in-place en memoria; el perímetro formal garantiza que las claves jamás toquen disco, logs ni serializaciones hacia el frontend, y que las referencias a clientes en caché se purguen reactivamente para habilitar recolección por el GC.
  4. *Timeout Estricto*: Un timeout superior a 4000ms degradaría la percepción del usuario al probar múltiples proveedores simultáneamente. Se fija a 3500ms como invariante.
  5. *Ponytail Lean Evaluation*:
     - Se utiliza `node:crypto` nativo para el cifrado AES-256-GCM y PBKDF2. Descartadas `crypto-js`, `forge` y `bcrypt` (0 dependencias npm añadidas).
     - Se utiliza `fetch` nativo con `AbortSignal.timeout(3500)` en lugar de Axios.
     - Se rechaza almacenar claves en la base SQLite principal, manteniéndolas en el llavero del SO.

## Resolution
- Final approach after critique: Custodia estricta en Keychain con fallback AES-256-GCM autenticado (16-byte auth tag) compatible con `BYOK_MASTER_KEY` en CI, sondeo con cabecera `x-goog-api-key` y timeout estricto de 3500ms, redacción de auth headers en logs y purga reactiva de caché en memoria.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED de cifrado fallback y timeout en `health-checker.test.ts`.
- Exit criteria: Adaptador Keyring funcional en macOS/Linux y health checker con 100% de cobertura de código.

## Test and Validation Plan
- Unit tests: `tests/infrastructure/security/keyring-adapter.test.ts`, `tests/infrastructure/security/crypto-fallback.test.ts`, `tests/domain/security/key-masker.test.ts`.
- Integration tests: `tests/infrastructure/security/health-checker.test.ts`, `tests/components/byok-manager.test.tsx`.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.3`, `HU-1.5`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
