# RFC: Épica 5 - Analítica Unificada, Asesoría Estratégica y Modo Avanzado

## 1. Contexto & Objetivos
Esta suite de RFCs documenta el diseño técnico e invariantes de implementación para la **Épica 5 (EPIC-05)** de Indie-Sync Suite. El objetivo es proporcionar un panel centralizado de métricas analíticas, ingesta local de reportes CSV de streaming, cálculo matemático de eficiencia de pauta (CPA/CPC), un asesor estratégico local-first con memoria y control de privacidad, detección proactiva de anomalías y generación autónoma de tableros de datos desde endpoints API (Modo Avanzado).

## 2. Historias de Usuario Gobernadas

| Identificador | Título de Historia | Alcance Técnico |
|---|---|---|
| **STORY-005-01** | HU-5.1: Dashboard Centralizado de Rendimiento | Vista agregada de streams, clics, interacciones y filtros por ventana temporal ($T-14$ a $T-1$, $T-0$ a $T+7$, $T+8+$). |
| **STORY-005-02** | HU-5.4: Ingesta de Reportes CSV de Streaming | Parser determinista tolerante a fallos para exportaciones CSV de Spotify for Artists, Apple Music, DistroKid y distribuidoras. |
| **STORY-005-03** | HU-5.5: Cálculo de Eficiencia y Retorno de Pauta | Motor de cálculo puro para Costo por Pre-save (CPA), Costo por Clic (CPC), Conversion Rate (%) y ranking de creativos. |
| **STORY-005-04** | HU-5.2: Asesoría Estratégica con Memoria y Privacidad | Conversaciones en SQLite local con inyección de analíticas, comandos de purga irreversible (Hard Delete) y privacidad total. |
| **STORY-005-05** | HU-5.6: Alertas Proactivas de Anomalías | Detección heurística de desviaciones > 30% contra promedios móviles y emisión de tarjetas de sugerencia accionables en 1 clic. |
| **STORY-005-06** | HU-5.3 & HU-6.1 v5: Paneles API y Tools de Asistente | Inferencia dinámica de esquemas JSON, visualización de series de tiempo y catálogo de tools agénticas de analítica. |

## 3. Principios de Arquitectura Funcional en 4 Capas
1. **Presentación (Capa 1)**: Componentes React puramente declarativos (`apps/web/src/components/`). Cero imports hacia Capa 3 o Capa 4.
2. **Aplicación (Capa 2)**: Hooks React reactivos (`apps/web/src/lib/hooks/`). Cero JSX directo, cero imports hacia Capa 4.
3. **Dominio (Capa 3)**: Lógica pura, contratos Zod, parsers deterministas y motores de cálculo sin I/O de red (`apps/web/src/lib/pipelines/analytics/`).
4. **Infraestructura (Capa 4)**: Repositorios basados exclusivamente en SQLite nativo (`node:sqlite DatabaseSync`), clientes HTTP seguros con anti-SSRF (`apps/web/src/lib/infrastructure/`). Cero declaraciones de clases (`class`).
