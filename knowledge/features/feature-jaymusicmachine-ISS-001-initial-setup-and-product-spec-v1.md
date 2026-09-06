# Problem Spec: initial-setup-and-product-spec-v1

## What problem exists
El repositorio fue inicializado bajo la nueva identidad **Indie Suite (ISS)**. Sin embargo, la especificación funcional canónica y la arquitectura del producto aún no se encontraban formalmente integradas, vinculadas en la base de conocimiento (`knowledge/`), ni trazadas a través del protocolo de gobernanza y Pull Requests del proyecto.

## Why it matters
Tener una especificación canónica formalizada en el monorepo es indispensable para establecer la fuente única de verdad (Single Source of Truth) para todo el equipo y los agentes autónomos. A partir de este documento se derivarán las 6 épicas operativas del sistema (Brand Vault, Planificador de Lanzamientos, Pipeline Creativo Multimedia, Publicación/Pauta Programática, Analítica Unificada con Asesoría AI, y Orquestador de Integraciones) asegurando consistencia técnica y de producto sin desvíos ni deuda arquitectónica.

## What outcome is expected
1. Incorporación formal del documento canónico `knowledge/proposals/indie-sync-suite-concept.md` (especificación funcional V3).
2. Vinculación del concepto en el índice general de conocimiento `knowledge/index.md`.
3. Verificación de la suite de pruebas (`pnpm test:harness` y `pnpm test`) pasando al 100% en verde.
4. Generación y apertura del primer Pull Request formal del proyecto hacia la rama base `develop` con todas las secciones de gobernanza requeridas.

## What gaps exist today
- El índice de conocimiento `knowledge/index.md` requería registrar la sección de conceptos y propuestas del producto.
- Se requería formalizar el primer hito de entrega mediante una rama parent `feature/` y un Pull Request auditable en GitHub.

## What questions remain open
- No existen preguntas abiertas bloqueantes. La especificación conceptual V3 fue aprobada y define los requerimientos de las 6 épicas fundacionales del proyecto.
