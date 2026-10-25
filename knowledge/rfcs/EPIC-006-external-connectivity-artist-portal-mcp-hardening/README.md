# RFC: Épica 6 - Conectividad Externa, Portal del Artista e Interoperabilidad Agéntica (MCP) & Hardening

## 1. Visión y Alcance General
La **Épica 6** culmina el sistema operativo de Indie-Sync Suite abriendo sus capacidades hacia el ecosistema exterior:
1. **Portal del Artista (Cloud Relay Ligero)**: Interfaz móvil sin contraseñas vía Magic Link para que el artista escuche el audio del máster y apruebe artes/copys con 1-toque.
2. **Open REST API Gateway**: Endpoints protegidos por API Keys con permisos granulares para desarrolladores y automatizaciones.
3. **Servidor MCP Local**: Implementación oficial de la especificación Model Context Protocol (v1.0 JSON-RPC 2.0) exponiendo Resources y Tools para que agentes externos (Antigravity, Claude Desktop, Cursor) operen como copilotos.
4. **Hardening de Producción**: Esquema relacional `008_portal_api_mcp.sql`, auditoría de accesos y políticas de seguridad.

## 2. Índice de Historias de Usuario & SPECs Técnicos
| Archivo de RFC | Historia / Módulo | Descripción Técnica |
| :--- | :--- | :--- |
| [`STORY-006-01-artist-portal-magic-link.md`](./STORY-006-01-artist-portal-magic-link.md) | **HU-6.5: Portal del Artista** | Magic Links HMAC-SHA256, vista móvil y feedback local-first en SQLite. |
| [`STORY-006-02-open-rest-api-gateway.md`](./STORY-006-02-open-rest-api-gateway.md) | **HU-6.2: Open API Gateway** | Emisión y verificación de API Keys con scopes granulares y hashing SHA-256. |
| [`STORY-006-03-local-mcp-server-protocol.md`](./STORY-006-03-local-mcp-server-protocol.md) | **HU-6.4: Servidor MCP Local** | Despachador JSON-RPC 2.0 con recursos de Brand Vault y tools de catálogo. |
| [`STORY-006-04-production-hardening-security.md`](./STORY-006-04-production-hardening-security.md) | **Hardening & Migración 008** | DDL SQLite `008_portal_api_mcp.sql`, sandbox y auditoría de llamadas. |

## 3. Principios Arquitectónicos
- **Arquitectura Funcional Estricta**: Cero clases (`class`), fábricas funcionales (`create...Repository`, `create...Service`, `create...Handler`).
- **Aislamiento de Capas**: Presentación -> Aplicación -> Dominio -> Infraestructura.
- **Seguridad Criptográfica**: Firmas HMAC-SHA256 con expiración para Magic Links; hashing SHA-256 no reversible para API Keys.
- **In-Code Commentary**: `@file`, `@layer`, `@description`, TSDoc e indicadores `// Step N:`.
