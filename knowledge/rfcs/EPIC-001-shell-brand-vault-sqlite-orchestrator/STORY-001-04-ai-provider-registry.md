---
type: RFC
title: STORY-001-04 Registro Unificado de Proveedores de IA (AiProviderRegistry)
description: RFC Story — Abstracción unificada sobre Vercel AI SDK Core con inyección dinámica de llaves BYOK y tolerancia a fallos
tags: [rfc, story, ai-sdk, llm, streaming, registry, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-04-ai-provider-registry

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-04-ai-provider-registry`
- Mapping: `AI Core Foundation`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec04-ai-provider-registry-streaming`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
- Problem: La suite interactúa con múltiples familias de modelos generativos: razonamiento conversacional (Claude 3.7 / GPT-4o / Gemini 2.0 Flash), generación rápida (Groq Llama 3.3) y agentes de onboarding. Escribir clientes HTTP propietarios para cada API crearía una deuda técnica inmanejable y duplicación de código. Se requiere una factoría desacoplada que utilice el estándar oficial de Vercel AI SDK (`ai`) resolviendo dinámicamente el cliente con las claves provistas por el usuario vía BYOK.
- Why now: La entrevista de marca (HU-1.2) y el Asistente Lateral (HU-6.1) dependen directamente de este registry para ejecutar streaming y tool calling.
- Constraints:
  - Consumo directo del paquete estándar `@ai-sdk/openai`, `@ai-sdk/anthropic`, `@ai-sdk/google`.
  - Inyección de API key en tiempo de invocación (lazy resolution desde `KeyringPort`).
  - Fallback automático configurable: si el proveedor preferido falla por cuota o timeout, degrada limpiamente al siguiente proveedor disponible con alerta informativa.
- Affected paths:
  - `apps/web/src/domain/agent/ai-provider-registry.ts`
  - `apps/web/src/domain/agent/model-catalog.ts`
  - `apps/web/src/infrastructure/agent/vercel-ai-adapter.ts`
  - `tests/domain/agent/ai-provider-registry.test.ts`

## Proposal
- Approach summary: Clase singleton `AiProviderRegistry` que inicializa clientes bajo demanda usando el SDK oficial de Vercel AI, retornando instancias compatibles con `streamText` y `generateText`.
- Technical design:
  ```typescript
  import { LanguageModelV1 } from 'ai';
  import { createOpenAI } from '@ai-sdk/openai';
  import { createAnthropic } from '@ai-sdk/anthropic';
  import { createGoogleGenerativeAI } from '@ai-sdk/google';

  export type SupportedProvider = 'openai' | 'anthropic' | 'google' | 'groq';

  export interface ModelDescriptor {
    id: string;
    provider: SupportedProvider;
    label: string;
    capabilities: ('reasoning' | 'vision' | 'fast_tools')[];
    contextWindow: number;
  }

  export class AiProviderRegistry {
    private clientCache = new Map<string, LanguageModelV1>();

    constructor(private keyring: KeyringPort) {}

    async resolveModel(modelId: string, provider: SupportedProvider): Promise<LanguageModelV1> {
      const apiKey = await this.keyring.getSecret('ai_provider', provider);
      if (!apiKey) {
        throw new Error(`Credencial BYOK no configurada para el proveedor: ${provider}`);
      }

      const cacheKey = `${provider}:${modelId}:${apiKey.slice(-4)}`;
      if (this.clientCache.has(cacheKey)) {
        return this.clientCache.get(cacheKey)!;
      }

      const model = this.instantiateModel(provider, modelId, apiKey);
      this.clientCache.set(cacheKey, model);
      return model;
    }

    private instantiateModel(provider: SupportedProvider, modelId: string, apiKey: string): LanguageModelV1 {
      switch (provider) {
        case 'openai':
          return createOpenAI({ apiKey })(modelId);
        case 'anthropic':
          return createAnthropic({ apiKey })(modelId);
        case 'google':
          return createGoogleGenerativeAI({ apiKey })(modelId);
        case 'groq':
          return createOpenAI({ apiKey, baseURL: 'https://api.groq.com/openai/v1' })(modelId);
        default:
          throw new Error(`Proveedor no soportado: ${provider}`);
      }
    }
  }
  ```
- Alternatives considered:
  - Implementar adaptadores HTTP `fetch` a mano: Descartado rotundamente por reinventar la rueda frente a Vercel AI SDK Core ya testeado y mantenido.
  - LangChain / LlamaIndex: Descartado por ser una dependencia excesivamente pesada, con problemas de tree-shaking y abstracciones innecesarias.
- Tradeoffs: Requiere importar los providers oficiales correspondientes de `@ai-sdk/*`.

## Critique
- Reviewer(s): `architect`, `api`, `ponytail`
- Critical findings:
  1. Si un usuario cambia su API key en la consola BYOK, la caché de clientes en memoria debe invalidarse de inmediato.
  2. Groq puede reutilizar `@ai-sdk/openai` con `baseURL` personalizada sin necesidad de instalar un paquete dedicado extra.
  3. `Ponytail Evaluation`: Vercel AI SDK Core es el estándar del monorepo. Aprovechar su interoperabilidad nativa. Reutilizar `@ai-sdk/openai` para Groq ahorra una dependencia innecesaria.

## Resolution
- Final approach after critique: Limpieza de caché reactiva ante mutación de credenciales. Reutilización de OpenAI adapter para Groq.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Crear tests RED en `tests/domain/agent/ai-provider-registry.test.ts`.

## Test and Validation Plan
- Unit tests: Verificación de instanciación correcta de modelos según proveedor; control de excepciones cuando falta la clave en el llavero; invalidación de caché.
- Integration tests: Ejecución de `generateText` contra un mock de transporte para verificar el flujo de inyección de credencial.

## Traceability
- Related issue(s): `EPIC-01`
- Branch: `SPEC/jaymusicmachine-EPIC-01-spec04-ai-provider-registry-streaming`
- Final commit hash(es): `TBD`
