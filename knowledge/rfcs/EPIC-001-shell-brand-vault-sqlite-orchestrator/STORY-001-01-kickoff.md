---
type: RFC
title: STORY-001-01 Kickoff y Sustrato Determinista
description: RFC Story — metadata, context, proposal, critique, resolution, decision, test plan, and traceability
tags: [rfc, story, governance, documentation, sqlite, byok, brand-vault]
timestamp: 2026-09-07T00:00:00Z
---

# STORY-001-01-kickoff

## Metadata
- Epic: `EPIC-001-shell-brand-vault-sqlite-orchestrator`
- Story ID: `STORY-001-01-kickoff`
- Status: `draft`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator`
- Created: `2026-09-07`
- Last Updated: `2026-09-07`

## Context
- Problem: La suite requiere un entorno de ejecución local, soberano y determinista para gestionar la persistencia relacional sin incurrir en dependencias de microservicios externos o bases de datos pesadas (como Plane o PostgreSQL local en Docker). Además, requiere una arquitectura desacoplada para gestión de claves BYOK y contratos agénticos.
- Why now: Es el prerrequisito fundacional de todas las épicas subsecuentes (Planificación Cronológica, Generación Creativa, Publicación Multicanal y Analítica).
- Constraints: Debe funcionar 100% offline-first; no almacenar secretos en texto plano en disco; cumplir con la arquitectura en 4 capas funcionales; cero dependencias obsoletas.
- Affected paths:
  - `apps/web/src/domain/brand-vault/`
  - `apps/web/src/infrastructure/db/`
  - `apps/web/src/infrastructure/security/`
  - `apps/web/src/presentation/components/brand-vault/`
  - `apps/web/src/presentation/components/settings/`

## Proposal
- Approach summary: Implementar la persistencia relacional local en SQLite usando migraciones estructuradas con soporte para la tabla outbox `cloud_sync_queue`. Encapsular el acceso a credenciales BYOK mediante un adaptador `KeyringAdapter` compatible con OS Keychain y proveer la interfaz de gestión de perfiles de Sello y Artista en Next.js.
- Technical design:
  1. **SQLite Database Layer**: DDL relacional con llaves foráneas (`PRAGMA foreign_keys = ON;`) para `labels`, `artists`, `releases`, `tasks` y `cloud_sync_queue`.
  2. **BYOK Keyring Layer**: Abstracción de acceso al keyring con verificación de conectividad HTTP para APIs de modelos.
  3. **Brand Vault Domain & UI**: Modelos de dominio con esquemas Zod rigurosos e interfaces accesibles.
- Alternatives considered:
  - Importar Plane como código abierto: Descartado por excesiva complejidad, deuda técnica de 30+ contenedores Docker y acoplamiento severo.
  - Almacenamiento local en JSON plano: Descartado por falta de integridad referencial, bloqueos en concurrencia y ausencia de transacciones ACID.
- Tradeoffs: SQLite local requiere que las sincronizaciones con servicios en la nube utilicen el Patrón Outbox para garantizar consistencia eventual.

## Critique
- Reviewer(s): `architect`, `security`
- Critical findings:
  1. El almacenamiento seguro de claves no puede fallar silenciosamente en entornos de integración continua o testing sin keychain disponible.
  2. La tabla de sincronización `cloud_sync_queue` debe tener restricciones de unicidad e idempotencia para evitar posts duplicados en redes.
  3. La interfaz de Brand Vault debe validar estrictamente los códigos hexadecimales de color y los formatos tipográficos antes de persistir.
- Blocking concerns: Ninguno una vez incorporado el fallback cifrado para testing y validadores Zod en la capa de dominio.

## Resolution
- Final approach after critique:
  - Se incorpora un fallback transparente para el Keyring en CI basado en cifrado con salt local efímero.
  - Se define un trigger en SQLite para la generación de timestamps y validación de idempotencia en `cloud_sync_queue`.
  - Se implementan esquemas Zod estrictos con mensajes de error amigables en la capa de dominio.
- Changes accepted: Todos los puntos de crítica técnica incorporados al Solution Spec.
- Changes rejected (with rationale): Ninguno.

## Decision
- Decision: `pending`
- Decision date: `2026-09-07`
- Decision owner: `jaymusicmachine`
- Approval notes: Pendiente de aprobación humana previa a la ejecución de la primera SPEC.

## Status
- Current status: `draft`
- Next action: Presentar diseño y estructura de SPECs al usuario para aprobación humana (Phase 4).
- Exit criteria:
  - [ ] Aprobación de arquitectura por el usuario.
  - [ ] Inicio de la primera SPEC (SPEC-01: SQLite Core & Outbox).

## Test and Validation Plan
- Unit tests: Pruebas unitarias de esquemas Zod, migración de SQLite y adaptador de Keyring en `tests/`.
- Integration tests: Pruebas de integración de inserción y consulta en repositorio relacional local.
- Devnet validation (if applicable): N/A para este módulo inicial.
- Responsive QA (if applicable): Verificación en navegadores móviles y desktop de los paneles de configuración y Brand Vault.

## Traceability
- Related issue(s): `EPIC-01`
- Related PR(s): `TBD`
- Final commit hash(es): `TBD`
