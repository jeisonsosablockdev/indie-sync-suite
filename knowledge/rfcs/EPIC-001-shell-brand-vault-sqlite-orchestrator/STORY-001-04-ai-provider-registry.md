---
type: RFC
title: STORY-001-04 Factoría Desacoplada de Modelos de Lenguaje (AiProviderRegistry)
description: RFC Story — Factoría desacoplada sobre Vercel AI SDK Core para instanciación lazy de modelos LLM (OpenAI, Anthropic, Google, Groq), streaming SSE y caché reactiva
tags: [rfc, story, ai, vercel-ai-sdk, registry, streaming, sse, agent, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-04-ai-provider-registry

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-04`
- Mapping: `AI Core / Provider Registry`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Desarrollador y Usuario del runtime agéntico,
- **Quiero** disponer de un registro centralizado y desacoplado (`AiProviderRegistry`) construido sobre Vercel AI SDK Core (`ai`) que resuelva modelos de OpenAI, Anthropic, Gemini, Groq u Ollama de forma transparente inyectando las claves desde el Keyring seguro,
- **Para que** los pipelines de la entrevista socrática, generación de tareas y generación de copy puedan invocar al modelo óptimo para cada tarea sin depender de SDKs propietarios dispersos ni acoplarse a un solo proveedor.

### Criterios de Aceptación Oficiales
1. Instancia modelos oficiales (`@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`) resolviendo las API keys en tiempo de ejecución de manera perezosa (*lazy*) desde `KeyringPort`.
2. Soporta proveedores compatibles con la API de OpenAI (como Groq y Ollama) reutilizando `@ai-sdk/openai` con endpoints base personalizados (`baseURL`) protegidos por validación estricta anti-SSRF: protocolo obligatorio `https://` o restricción exclusiva de `http://` a direcciones de loopback local (`localhost`, `127.0.0.1`) para Ollama local, bloqueando terminantemente IPs privadas no-loopback y metadatos de nube (`169.254.169.254`).
3. Mantiene una caché en memoria de instancias de clientes delimitada y segura, indexada por `provider:modelId:keyFingerprint` (hash SHA-256 sin almacenar la clave en plano) con invalidación reactiva determinista mediante bus de eventos ante cualquier actualización o revocación de credenciales para desreferenciar clientes y permitir la recolección por el garbage collector de V8.
4. Implementa pipelines de streaming unificados emitiendo Server-Sent Events (SSE) y un normalizador de errores que traduce respuestas crudas de las APIs en diagnósticos claros y accionables.

### Problem & Gap Analysis
Los frameworks monolíticos como LangChain o LlamaIndex imponen un peso masivo de bundle (>150MB en node_modules), tipos opacos y abstracciones difíciles de depurar. Vercel AI SDK Core proporciona el estándar moderno de streaming y llamadas a herramientas; esta historia construye la factoría desacoplada que conecta el Keyring local con el runtime agéntico.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 4.1: Registro Dinámico de Proveedores Multi-Modelo
*Instanciación unificada de OpenAI, Anthropic, Gemini y Groq sin código duplicado ni dependencias pesadas.*
- **`SPEC-4.1.1` (Factoría de Modelos con Inyección Lazy de Claves y Validación Anti-SSRF)**:
  - *Problema*: Cada proveedor tiene métodos de autenticación e inicialización diferentes, y admitir endpoints `baseURL` personalizados para proveedores compatibles con OpenAI introduce riesgos de Server-Side Request Forgery (SSRF) hacia metadatos de nube o redes internas.
  - *Solución*: Clase `AiProviderRegistry` que resuelve la clave en tiempo de ejecución desde `KeyringPort` e instancía el modelo con los adaptadores oficiales `@ai-sdk/openai`, `@ai-sdk/anthropic` y `@ai-sdk/google`. Reutiliza `@ai-sdk/openai` con `baseURL: 'https://api.groq.com/openai/v1'` para Groq. Para `baseURL` personalizados (ej. Ollama), aplica un validador estricto anti-SSRF que exige protocolo HTTPS, o restringe HTTP estrictamente a direcciones de loopback local (`http://localhost:*` o `http://127.0.0.1:*`), bloqueando ips privadas RFC 1918 y servicios de metadatos (`169.254.169.254`).
  - *Capa*: `Domain` / `Infrastructure` (`apps/web/src/domain/agent/ai-provider-registry.ts`, `apps/web/src/domain/agent/model-catalog.ts`, `apps/web/src/infrastructure/agent/vercel-ai-adapter.ts`).
  - *Tests RED*: `tests/domain/agent/ai-provider-registry.test.ts` (resolución de modelos, control de excepciones cuando falta la credencial y validación anti-SSRF en custom baseURL).
- **`SPEC-4.1.2` (Caché de Clientes con Purga Reactiva y Delimitación en Memoria)**:
  - *Problema*: Reinstanciar clientes LLM en cada petición o token de streaming degrada el rendimiento, mientras que mantener instancias de clientes en memoria puede retener credenciales indefinidamente en closures internas del SDK.
  - *Solución*: Caché en memoria en `client-cache.ts` indexada exclusivamente por huella hash `provider:modelId:keyFingerprint` (SHA-256). Se conecta al bus de eventos de mutación de credenciales para ejecutar una invalidación reactiva determinista (`purgeOnCredentialChange`), desreferenciando los clientes y permitiendo que V8 recolecte los objetos de forma limpia.
  - *Capa*: `Domain` (`apps/web/src/domain/agent/client-cache.ts`).
  - *Tests RED*: `tests/domain/agent/client-cache.test.ts` (hit de caché, invalidación manual, purga reactiva ante evento de credencial y verificación de índice por hash SHA-256).

### 🔹 FEATURE 4.2: Pipeline de Streaming y Manejo de Errores de LLM
*Canal de comunicación en tiempo real para texto y llamadas a herramientas.*
- **`SPEC-4.2.1` (Streaming SSE / Data Stream Adapter)**:
  - *Problema*: Esperar la respuesta completa del modelo genera una percepción de congelamiento de la interfaz.
  - *Solución*: Adaptador de datos que consume `streamText` de Vercel AI SDK Core emitiendo Server-Sent Events optimizados para el consumo en Next.js App Router y Tauri IPC.
  - *Capa*: `Application` (`apps/web/src/application/agent/stream-adapter.ts`).
  - *Tests RED*: `tests/application/agent/stream-adapter.test.ts` (formato de chunks de texto y eventos de tool calling).
- **`SPEC-4.2.2` (Normalizador de Errores de Proveedor y Fallback Grácil)**:
  - *Problema*: Errores crudos de la API (respuestas JSON con códigos 401, 429, 503) que asustan al usuario o rompen la UI sin sugerencias.
  - *Solución*: Pipeline interceptor que traduce errores de rate limit, saldo insuficiente o sobrecarga a mensajes amigables y sugiere alternativas activas configuradas.
  - *Capa*: `Domain` (`apps/web/src/domain/agent/error-normalizer.ts`).
  - *Tests RED*: `tests/domain/agent/error-normalizer.test.ts` (traducción de errores de Anthropic, OpenAI, Google y Groq).

### Catálogo de Modelos y Tipado
```typescript
export type SupportedProvider = 'openai' | 'anthropic' | 'google' | 'groq' | 'ollama';

export interface ModelDescriptor {
  id: string;
  provider: SupportedProvider;
  label: string;
  capabilities: ('reasoning' | 'vision' | 'fast_tools' | 'streaming')[];
  contextWindow: number;
  recommendedFor: ('brand_interview' | 'task_generation' | 'fast_tools')[];
}
```

---

## Critique
- **Reviewer(s)**: `architect`, `api`, `ponytail`
- **Critical findings**:
  1. *Aislamiento de Claves y Ciclo en Memoria*: La factoría jamás debe cachear la API key en texto plano; solo retiene una huella hash SHA-256 (`keyFingerprint`) para el índice de la caché. Las instancias en `client-cache.ts` se purgan deterministamente ante eventos de mutación de credenciales para desreferenciar clientes del heap de V8.
  2. *Prevención de SSRF en custom baseURL*: Si se admite configurar endpoints de modelos compatibles con OpenAI (Groq u Ollama), un atacante podría intentar dirigir peticiones hacia direcciones privadas o metadatos de nube (`http://169.254.169.254`). Es obligatorio validar que la URL sea HTTPS, o restringir HTTP exclusivamente a loopback local (`localhost` o `127.0.0.1`).
  3. *Reutilización de OpenAI SDK*: Reutilizar `@ai-sdk/openai` para Groq y Ollama reduce drásticamente el tamaño del repositorio y simplifica el mantenimiento.
  4. *Ponytail Lean Evaluation*:
     - Se rechaza LangChain y LlamaIndex por sobre-ingeniería masiva.
     - Se utiliza la librería oficial Vercel AI SDK Core (`ai`) que ya forma parte de Next.js.
     - Cero dependencias adicionales para Groq (se reutiliza `@ai-sdk/openai` con `baseURL` validado).

## Resolution
- Final approach after critique: Singleton `AiProviderRegistry` apoyado en Vercel AI SDK Core con inyección lazy de claves, validación estricta anti-SSRF en endpoints custom, índice por huella SHA-256 y purga reactiva de caché de clientes ante mutación de credenciales.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED de resolución de modelos e invalidación de caché.
- Exit criteria: Modelos OpenAI, Anthropic, Google y Groq instanciables con streaming SSE verificado.

## Test and Validation Plan
- Unit tests: `tests/domain/agent/ai-provider-registry.test.ts`, `tests/domain/agent/client-cache.test.ts`, `tests/domain/agent/error-normalizer.test.ts`.
- Integration tests: `tests/application/agent/stream-adapter.test.ts`.

## Traceability
- Related issue(s): `EPIC-01`, `AI-Registry`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
