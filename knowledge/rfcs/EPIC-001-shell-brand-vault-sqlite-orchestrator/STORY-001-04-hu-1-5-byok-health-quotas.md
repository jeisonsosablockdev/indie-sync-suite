---
type: RFC
title: STORY-001-04 HU-1.5 Verificación de Estado, Conectividad y Cuotas de Credenciales BYOK
description: RFC Story — Motor de comprobación ligera de conectividad, detección de cuota baja e interfaz de diagnóstico en vivo
tags: [rfc, story, security, byok, health-check, quotas, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-04-hu-1-5-byok-health-quotas

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-04`
- Mapping: `HU-1.5`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec04-byok-health-quotas`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Usuario de la plataforma,
- **Quiero** verificar la validez, saldo y estado de conexión de mis API keys configuradas en la bóveda,
- **Para que** no se interrumpan las generaciones por falta de crédito o claves caducadas en medio de una campaña.

### Criterios de Aceptación Oficiales
1. Ofrece un botón de "Probar Conexión" por cada credencial registrada.
2. Muestra indicadores visuales de estado (Verde = Activa/Con saldo, Amarillo = Cuota baja, Rojo = Error/Invalida).
3. Registra logs de error detallados sin exponer el valor de la clave en texto plano.

### Problem & Gap Analysis
Si un usuario ingresa una clave con saldo vencido o permisos insuficientes, fallará en medio de un pipeline largo de generación o publicación. Esta historia provee verificación proactiva antes de iniciar cualquier proceso.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 4.1: Motor de Sondeo Ligero y Diagnóstico de Conectividad
*Verificación de credenciales sin consumir saldo ni bloquear la aplicación.*
- **`SPEC-4.1.1` (Sondeo Lightweight HTTP con Timeout Estricto)**:
  - *Problema*: Llamar a endpoints de completion para probar la clave consume saldo del usuario y puede quedarse colgado si la red falla.
  - *Solución*: Módulo `HealthChecker` que sondea exclusivamente endpoints de metadatos (`/v1/models` para OpenAI, Anthropic, Gemini, Groq) con un `AbortController` fijado estrictamente en 3500ms.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/security/health-checker.ts`).
  - *Tests RED*: `tests/infrastructure/security/health-checker.test.ts`.
- **`SPEC-4.1.2` (Mapeo de Headers de Rate Limit y Detección de Cuota)**:
  - *Problema*: La API puede responder 200 OK pero estar a punto de bloquearse por límite de tokens por minuto.
  - *Solución*: Extractor de cabeceras HTTP (`x-ratelimit-remaining-tokens`, `x-ratelimit-reset`) que categoriza el estado en: `healthy` (>20% margen), `low_quota` (<20% margen), `invalid_key` (401/403) o `unreachable`.
  - *Capa*: `Domain` (`apps/web/src/domain/security/quota-evaluator.ts`).
  - *Tests RED*: `tests/domain/security/quota-evaluator.test.ts`.

### 🔹 FEATURE 4.2: Consola Visual de Estado de Credenciales y Logs Sanitizados
*Experiencia de usuario clara y transparente para la gestión de llaves.*
- **`SPEC-4.2.1` (Badges Cromáticos de Salud y Acción de Prueba)**:
  - *Problema*: Interfaces que no indican si la clave guardada funciona o no.
  - *Solución*: Componente de gestión con botón interactivo "Probar Conexión", micro-spinner de carga, insignias semánticas (Verde = Activa, Amarillo = Cuota baja, Rojo = Inválida) y latencia reportada en milisegundos.
  - *Capa*: `Presentation` (`apps/web/src/presentation/components/settings/credential-health-card.tsx`).
  - *Tests RED*: `tests/presentation/components/credential-health-card.test.tsx`.
- **`SPEC-4.2.2` (Visor de Logs de Diagnóstico Sanitizados)**:
  - *Problema*: Mensajes de error que exponen accidentalmente fragmentos de la clave en llamadas de depuración.
  - *Solución*: Pipeline de sanitización que intercepta el objeto de error y redacta cualquier secuencia alfanumérica sensible antes de mostrar el mensaje técnico o persistirlo en la bitácora local.
  - *Capa*: `Domain` (`apps/web/src/domain/security/error-sanitizer.ts`).
  - *Tests RED*: `tests/domain/security/error-sanitizer.test.ts`.

---

## Critique
- Reviewer(s): `security`, `frontend`, `ponytail`
- Critical findings:
  1. Si la verificación arroja 429 (Rate Limit Exceeded), no debe marcarse como clave inválida sino como `low_quota` con indicación del tiempo de reset.
  2. `Ponytail Evaluation`: Implementar la prueba mediante un switch simple sobre `fetch` nativo. Cero librerías de request adicionales (como Axios: 0 dependencias extra).

## Resolution
- Final approach after critique: Uso de `fetch` nativo de Node 22 / navegador con timeout cancelable mediante `AbortSignal.timeout(3500)`.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED de sondeo HTTP y sanitización de errores.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.5`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
