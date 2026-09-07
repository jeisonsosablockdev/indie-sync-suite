---
type: RFC
title: STORY-001-03 HU-1.3 Gestión Segura de Credenciales (BYOK en OS Keychain)
description: RFC Story — Almacenamiento seguro en el Keychain del SO, cifrado AES-256-GCM en fallback y ciclo de vida de claves
tags: [rfc, story, security, byok, keychain, encryption, governance]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-03-hu-1-3-byok-credentials

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-03`
- Mapping: `HU-1.3`
- Status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `SPEC/jaymusicmachine-EPIC-01-spec03-byok-credentials`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
### Historia de Usuario Oficial
- **Como** Usuario de la plataforma,
- **Quiero** ingresar mis propias claves de API para LLMs, modelos generativos de imagen y plataformas publicitarias,
- **Para que** pueda utilizar mis cuotas y modelos preferidos sin intermediarios ni sobrecostos en la suscripción.

### Criterios de Aceptación Oficiales
1. Permite registrar, editar y borrar API keys (OpenAI, Anthropic, Stability/Flux, Meta Ads, TikTok Ads).
2. Encripta y resguarda los valores sensibles en el Keychain nativo del sistema operativo (`keyring-rs`), con fallback para CI.
3. Valida la conectividad de la clave antes de marcarla como activa.

### Problem & Gap Analysis
Almacenar claves de API en archivos `.env` o en bases de datos locales no cifradas expone los secretos del usuario a malware o extracción en disco. Esta historia garantiza custodia criptográfica nativa sin intermediarios.

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 3.1: Custodia Criptográfica en OS Keychain y Fallback
*Integración con el subsistema de seguridad del sistema operativo.*
- **`SPEC-3.1.1` (Adaptador KeyringPort Multiplataforma)**:
  - *Problema*: macOS, Linux y Windows manejan APIs de llavero radicalmente distintas (Apple Keychain, GNOME Secret Service, Windows Credential Manager).
  - *Solución*: Abstracción `KeyringPort` que delega en `keyring-rs` / `keytar` nativo con métodos uniformes `getSecret`, `setSecret`, `deleteSecret`.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/security/keyring-adapter.ts`).
  - *Tests RED*: `tests/infrastructure/security/keyring-adapter.test.ts`.
- **`SPEC-3.1.2` (Fallback Criptográfico Determinista AES-256-GCM)**:
  - *Problema*: En entornos de integración continua o servidores headless, el Keychain gráfico falla o arroja excepciones.
  - *Solución*: Fallback transparente que cifra los valores con AES-256-GCM utilizando una clave derivada de la máquina local (`node:crypto`), garantizando cero texto plano en disco bajo cualquier entorno.
  - *Capa*: `Infrastructure` (`apps/web/src/infrastructure/security/crypto-fallback.ts`).
  - *Tests RED*: `tests/infrastructure/security/crypto-fallback.test.ts`.

### 🔹 FEATURE 3.2: Servicio de Credenciales y Sanitización en Memoria
*Reglas de manejo seguro de secretos dentro de la aplicación.*
- **`SPEC-3.2.1` (Enmascaramiento Fiel de Claves)**:
  - *Problema*: Exponer claves completas en volcados de red o en el árbol de componentes de React.
  - *Solución*: Módulo `KeyMasker` que preserva únicamente el prefijo y los 4 caracteres finales (`sk-ant-***9a1b`), impidiendo que el valor real salga del proceso backend local.
  - *Capa*: `Domain` (`apps/web/src/domain/security/key-masker.ts`).
  - *Tests RED*: `tests/domain/security/key-masker.test.ts`.
- **`SPEC-3.2.2` (Ciclo de Vida Efímero en Memoria)**:
  - *Problema*: Retención persistente de claves en variables globales que facilita ataques de inspección de memoria.
  - *Solución*: Resolución lazy: la clave solo se solicita al Keychain en el instante exacto de realizar una llamada a la API y la referencia en memoria se sobrescribe inmediatamente después de instanciar el cliente.
  - *Capa*: `Domain` (`apps/web/src/domain/security/credential-service.ts`).
  - *Tests RED*: `tests/domain/security/credential-service.test.ts`.

---

## Critique
- Reviewer(s): `security`, `architect`, `ponytail`
- Critical findings:
  1. El fallback de cifrado debe verificar la integridad del auth tag en AES-256-GCM para evitar ataques de manipulación de ciphertext.
  2. `Ponytail Evaluation`: Usar el módulo nativo `node:crypto` para el fallback. Cero librerías criptográficas de npm (`crypto-js`, etc. descartadas: 0 dependencias extra).

## Resolution
- Final approach after critique: Implementación estricta de AES-256-GCM con auth tag de 16 bytes y salt de 32 bytes con `node:crypto`.

## Decision
- Decision: `approved`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`

## Status
- Current status: `approved`
- Next action: Diseñar tests RED de cifrado y descifrado en `tests/infrastructure/security/crypto-fallback.test.ts`.

## Traceability
- Related issue(s): `EPIC-01`, `HU-1.3`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
