---
type: RFC
title: STORY-001-02 BYOK Keyring Seguro y Motor de Verificación de Cuotas
description: RFC Story — Almacenamiento seguro en OS Keychain, verificación activa de conectividad y balance sin exposición de claves
tags: [rfc, story, security, byok, keychain, encryption, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-02-byok-keyring-health

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-02-byok-keyring-health`
- Mapping: `HU-1.3`, `HU-1.5`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec02-byok-keyring-health-engine`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
- Problem: Los usuarios deben operar con sus propias API keys de LLMs (OpenAI, Anthropic, Gemini, Groq) y servicios publicitarios sin intermediación ni sobrecostos. Almacenar estas claves en texto plano en la base de datos o en archivos `.env` representa una vulnerabilidad de seguridad crítica (CVE de fuga de credenciales locales). Se requiere resguardar las credenciales en el llavero nativo del sistema operativo y proveer verificación de conectividad y cuotas antes de iniciar tareas operativas.
- Why now: El orquestador y los asistentes agénticos no pueden ejecutar llamadas a modelos sin acceso seguro a claves autenticadas.
- Constraints:
  - En desktop: delegación a `keyring-rs` en Tauri IPC o `keytar` nativo.
  - En entorno de desarrollo web / CI headless: fallback cifrado con AES-256-GCM usando una clave derivada de máquina efímera, nunca texto plano.
  - La clave de API NUNCA debe viajar al cliente del navegador en texto claro; solo se exponen los últimos 4 caracteres para identificación visual (`...sk-9a1b`).
  - Pruebas de conectividad con timeout estricto de 3500ms para evitar bloqueos en la UI.
- Affected paths:
  - `apps/web/src/infrastructure/security/keyring-adapter.ts`
  - `apps/web/src/infrastructure/security/crypto-fallback.ts`
  - `apps/web/src/domain/security/credential-service.ts`
  - `apps/web/src/presentation/components/settings/byok-manager.tsx`
  - `tests/infrastructure/security/keyring-adapter.test.ts`

## Proposal
- Approach summary: Interfaz unificada `KeyringPort` con implementación basada en SO y fallback criptográfico determinista. Módulo de verificación de salud HTTP con endpoints ligeros (e.g. `GET /v1/models` para OpenAI, `GET /v1/models` para Gemini).
- Technical design:
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
- Alternatives considered:
  - Almacenar claves en SQLite cifrado con SQLCipher: Descartado por requerir compilación nativa C++ compleja en monorepo multiplataforma.
  - Texto plano en SQLite: Rechazado categóricamente por violar la política de seguridad.
- Tradeoffs: El fallback de desarrollo requiere una clave secreta local derivada de la máquina (ej. `machine-id` + salt) para entornos donde no haya entorno gráfico de Keychain activo.

## Critique
- Reviewer(s): `security`, `architect`, `ponytail`
- Critical findings:
  1. No exponer endpoints de backend que devuelvan la clave completa sin autenticación.
  2. Las peticiones de verificación no deben consumir cuotas significativas (ej. usar llamadas a metadatos de modelos en lugar de completions con tokens).
  3. `Ponytail Evaluation`: No crear un sistema multi-capa de plugins para 20 proveedores teóricos. Implementar únicamente los 4 soportados en la especificación: OpenAI, Anthropic, Gemini, Groq. Una sola función `verifyProviderKey(provider, key)` con switch nativo.

## Resolution
- Final approach after critique: Contrato mínimo de 3 métodos en `KeyringPort`. Endpoint de verificación estandarizado con payloads enmascarados (`sk-***1234`).
- Changes accepted: Verificación de cuota basada en headers HTTP (ej. `x-ratelimit-remaining-tokens`).

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Crear tests RED en `tests/infrastructure/security/keyring-adapter.test.ts`.

## Test and Validation Plan
- Unit tests: Guardado, lectura y borrado en `KeyringAdapter`; verificación del cifrado AES-256-GCM en modo fallback; cálculo correcto de enmascaramiento de claves (`maskApiKey`).
- Integration tests: Simulación de respuestas HTTP 200, 401 (invalid_key) y 429 (low_quota) para verificar la máquina de estados de salud.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.3`, `HU-1.5`
- Branch: `SPEC/jaymusicmachine-EPIC-01-spec02-byok-keyring-health-engine`
- Final commit hash(es): `TBD`
