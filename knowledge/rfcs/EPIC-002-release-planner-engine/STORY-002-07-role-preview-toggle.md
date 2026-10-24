---
type: RFC
title: STORY-002-07 HU-2.3 Vista Diferenciada por Roles (RBAC Local & RolePreviewToggle)
description: RFC Story — Control de perspectiva asimétrica en la interfaz desktop (Label Manager vs Artista) para auditar permisos, tareas filtradas y bandeja de aprobación sin infraestructura remota.
tags: [rfc, story, rbac, role-preview, permissions, tauri]
timestamp: 2026-10-23T17:00:00Z
---

# STORY-002-07: Vista Diferenciada por Roles (RBAC Local & RolePreviewToggle)

## Metadata
- Epic: `EPIC-002-release-planner-engine`
- Story ID: `STORY-002-07`
- Mapping: `HU-2.3`
- Status: `approved`
- Current status: `approved`
- Owner: `jaymusicmachine`
- RFC owner slice: `epic/jaymusicmachine-EPIC-02-release-planner-engine`
- Created: `2026-10-23`
- Last Updated: `2026-10-23`

---

## Context
### Historia de Usuario Oficial
- **Como** Usuario de la app desktop (Label Manager o A&R),
- **Quiero** alternar la perspectiva de la interfaz entre vista completa de Label Manager y vista simplificada de Artista mediante un conmutador interactivo (`RolePreviewToggle`),
- **Para que** pueda auditar con exactitud qué tareas, entregables y datos ve el artista antes de invitarlo al portal web móvil, sin requerir infraestructura remota de autenticación en esta etapa.

### Criterios de Aceptación Oficiales
1. El modo **Label Manager** muestra visión completa: presupuestos de pauta ($USD), configuración técnica de dependencias duras, códigos ISRC/UPC y gestión global de lanzamientos.
2. El modo **Artista** filtra estrictamente la vista: oculta presupuestos financieros y configuraciones técnicas del sello, mostrando únicamente tareas asignadas al artista, enlaces de audio y la bandeja de revisión y aprobación de entregables.
3. El conmutador de roles mantiene persistencia en memoria/sesión local y cambia visualmente el encabezado de la app con un badge indicador claro de "Modo de Vista: Artista (Simulado)".

---

## Proposal
La historia se compone de **2 Features funcionales** y **4 SPECs técnicas**:

### 🔹 FEATURE 2.7.1: Política de Roles en Dominio & Filtros de Perspectiva
- **`SPEC-2.7.1.1` (Matriz Declarativa de Permisos en Capa de Dominio)**:
  - *Solución*: Módulo funcional puro `role-permissions.ts` en Capa 3. Expone funciones puras `canViewField(role, fieldName)` y `canExecuteAction(role, actionName)` que declaran que campos como `budget_usd` y `isrc` son invisibles para `ARTIST`.
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/role-permissions.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Rol `'ARTIST'`.
    - **Act**: Consultar `canViewField('ARTIST', 'budget_usd')`.
    - **Assert**: Retorna estrictamente `false`.
- **`SPEC-2.7.1.2` (Selector Puro de Tareas por Rol)**:
  - *Solución*: Función pura `filterTasksByRole(tasks, role)` en Capa 3 que excluye de la lista de tareas del artista aquellas reservadas a tareas operativas del sello (`assigned_role === 'LABEL_MANAGER'`).
  - *Capa*: `Domain` (`apps/web/src/lib/pipelines/planner/role-filters.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Lista de 10 tareas (6 de manager, 4 de artista).
    - **Act**: Invocación de `filterTasksByRole(tasks, 'ARTIST')`.
    - **Assert**: Retorna array con exactamente las 4 tareas asignadas al artista.

### 🔹 FEATURE 2.7.2: Hook de Perspectiva & Componente RolePreviewToggle
- **`SPEC-2.7.2.1` (Hook de Perspectiva: `useRolePerspective`)**:
  - *Solución*: Hook React funcional en Capa 2 con almacenamiento en `sessionStorage` o Context local que expone `currentRole`, `setRole(role)`, `isArtistView` y `isLabelManagerView`.
  - *Capa*: `Application` (`apps/web/src/lib/hooks/use-role-perspective.ts`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Renderizar hook en entorno de prueba.
    - **Act**: Llamar a `setRole('ARTIST')`.
    - **Assert**: `isArtistView` pasa a `true` y `isLabelManagerView` pasa a `false`.
- **`SPEC-2.7.2.2` (Componente UI: RolePreviewToggle en Header)**:
  - *Solución*: Control segmented-control accesible con teclado en la barra superior con indicador flotante animado en Motion 12 y badge `"Modo Artista Activo"`.
  - *Capa*: `Presentation` (`apps/web/src/components/planner/role-preview-toggle.tsx`).
  - *Fase RED (TDD AAA)*:
    - **Arrange**: Renderizar `<RolePreviewToggle />`.
    - **Act**: Click en la opción "Vista Artista".
    - **Assert**: El toggle cambia de estado activo y renderiza el pill de advertencia de modo simulado.

---

## Critique
- *¿Por qué no implementar login multi-usuario con JWT y bases de datos remotas de inmediato?*  
  Ponytail: Añadir autenticación de servidor para auditar la vista del artista en la fase de escritorio en Tauri viola la regla YAGNI. Un simple conmutador de perspectiva local en la app resuelve el 100% de la necesidad de auditoría del Label Manager con 0 servidores y 0 latencia.

---

## Resolution
Se aprueba el conmutador de perspectiva puramente local como hook y matriz de permisos en Dominio.

---

## Decision
Adoptar `RolePreviewToggle` puramente local en Capa de Presentación respaldado por funciones de permiso puras en Dominio.

---

## Status
- Status: `approved`
- Current status: `approved`

---

## Traceability
- Epic: [`EPIC-002-release-planner-engine/README.md`](./README.md)
- User Story: `HU-2.3`
- Related PR(s): TBD
- Final commit hash(es): TBD
