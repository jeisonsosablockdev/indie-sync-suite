# Knowledge Inbox

This directory is the shared capture-and-promotion layer for reusable workflow knowledge.

Promotion ladder:
1. `knowledge/features/*.md` or RFCs capture delivery-specific evidence.
2. `knowledge/inbox/*` stores reusable observations.
3. `knowledge/proposals/*` stores promotion candidates.
4. `knowledge/guides/*` stores approved reusable guides.
5. `knowledge/governance/*` and CI/scripts store stable mandatory rules and executable enforcement.

Human checkpoints:
- Inbox items can be captured by the agent.
- Promotion to `guide`, `governance`, or `automation` requires human review.
- `AGENTS.md` is updated only after canonical docs or enforcement change.

Commands:
- `npm run knowledge:scan -- --base develop`
- `npm run knowledge:index`
- `npm run knowledge:index -- --check`
- `npm run knowledge:drift`
- `npm run validate:knowledge`

Last Generated: 2026-09-06

## Snapshot

| Metric | Count |
| --- | ---: |
| Observations | 0 |
| Proposals | 1 |
| Reports | 0 |
| Archived | 100 |
| Observed status | 1 |
| Triaged status | 0 |
| Promoted status | 0 |
| Archived status | 100 |

## Inbox

_No items yet._

## Promotion Proposals

| ID | Status | Target | File | Source |
| --- | --- | --- | --- | --- |
| SPEC-ISS-V3.1 | observed | none | [INDIE-SYNC SUITE: Arquitectura y Especificación Funcional V3.1](knowledge/proposals/indie-sync-suite-concept.md) | n/a |

## Reports

_No items yet._

## Archive

| ID | Status | Target | File | Source |
| --- | --- | --- | --- | --- |
| index | archived | none | [API Endpoints Index](knowledge/api/endpoints/index.md) | n/a |
| index | archived | none | [API Specifications Index](knowledge/api/index.md) | n/a |
| index | archived | none | [Solana RPC Methods Index](knowledge/api/rpc/index.md) | n/a |
| index | archived | none | [API Schemas Index](knowledge/api/schemas/index.md) | n/a |
| architecture-overview | archived | none | [Architecture Overview — Feature-Driven Design (FDD) & 4-Layer Functional Web3](knowledge/architecture/architecture-overview.md) | n/a |
| auth-flow | archived | none | [Authentication Flow Specification](knowledge/architecture/auth-flow.md) | n/a |
| authority-model | archived | none | [Authority and Access Control Model](knowledge/architecture/authority-model.md) | n/a |
| devnet-proof | archived | none | [Devnet Verification and Proof Policy](knowledge/architecture/devnet-proof.md) | n/a |
| index | archived | none | [Architecture Decision Records Index](knowledge/architecture/index.md) | n/a |
| nft-spec | archived | none | [NFT and Digital Asset Specification](knowledge/architecture/nft-spec.md) | n/a |
| session-model | archived | none | [Session Management Model](knowledge/architecture/session-model.md) | n/a |
| solana-stack | archived | none | [Solana Web3 Stack](knowledge/architecture/solana-stack.md) | n/a |
| state-machine | archived | none | [State Machine Architecture](knowledge/architecture/state-machine.md) | n/a |
| threat-model | archived | none | [Threat Model and Security Mitigations](knowledge/architecture/threat-model.md) | n/a |
| toolchain-policy | archived | none | [Toolchain and Runtime Policy](knowledge/architecture/toolchain-policy.md) | n/a |
| index | archived | none | [Database Architecture & Models Index](knowledge/database/index.md) | n/a |
| index | archived | none | [Data Models Index](knowledge/database/models/index.md) | n/a |
| feature-jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator-implementation | archived | none | [feature-jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator-implementation](knowledge/features/feature-jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator-implementation.md) | n/a |
| feature-jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator | archived | none | [feature-jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator](knowledge/features/feature-jaymusicmachine-EPIC-01-shell-brand-vault-sqlite-orchestrator.md) | n/a |
| feature-jaymusicmachine-EPIC-02-release-planner-engine-implementation | archived | none | [feature-jaymusicmachine-EPIC-02-release-planner-engine-implementation](knowledge/features/feature-jaymusicmachine-EPIC-02-release-planner-engine-implementation.md) | n/a |
| feature-jaymusicmachine-EPIC-02-release-planner-engine | archived | none | [feature-jaymusicmachine-EPIC-02-release-planner-engine](knowledge/features/feature-jaymusicmachine-EPIC-02-release-planner-engine.md) | n/a |
| feature-jaymusicmachine-EPIC-03-creative-pipeline-engine-implementation | archived | none | [feature-jaymusicmachine-EPIC-03-creative-pipeline-engine-implementation](knowledge/features/feature-jaymusicmachine-EPIC-03-creative-pipeline-engine-implementation.md) | n/a |
| feature-jaymusicmachine-EPIC-03-creative-pipeline-engine | archived | none | [feature-jaymusicmachine-EPIC-03-creative-pipeline-engine](knowledge/features/feature-jaymusicmachine-EPIC-03-creative-pipeline-engine.md) | n/a |
| feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz-implementation | archived | none | [feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz-implementation](knowledge/features/feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz-implementation.md) | n/a |
| feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz | archived | none | [feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz](knowledge/features/feature-jaymusicmachine-EPIC-04-multichannel-distribution-postiz.md) | n/a |
| feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced-implementation | archived | none | [feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced-implementation](knowledge/features/feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced-implementation.md) | n/a |
| feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced | archived | none | [feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced](knowledge/features/feature-jaymusicmachine-EPIC-05-analytics-strategic-advisor-advanced.md) | n/a |
| feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening-implementation | archived | none | [feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening-implementation](knowledge/features/feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening-implementation.md) | n/a |
| feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening | archived | none | [feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening](knowledge/features/feature-jaymusicmachine-EPIC-06-external-connectivity-artist-portal-mcp-hardening.md) | n/a |
| feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1-implementation | archived | none | [feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1-implementation](knowledge/features/feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1-implementation.md) | n/a |
| feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1 | archived | none | [feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1](knowledge/features/feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1.md) | n/a |
| feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration-implementation | archived | none | [feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration-implementation](knowledge/features/feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration-implementation.md) | n/a |
| feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration | archived | none | [feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration](knowledge/features/feature-jaymusicmachine-ISS-007-mcp-standalone-server-artist-integration.md) | n/a |
| clean-code-folder-structure | archived | none | [clean-code-folder-structure](knowledge/governance/clean-code-folder-structure.md) | n/a |
| documentation-policy | archived | none | [Documentation Policy](knowledge/governance/documentation-policy.md) | n/a |
| frontend-ui-policy | archived | none | [Frontend Ui Policy](knowledge/governance/frontend-ui-policy.md) | n/a |
| git-monorepo-policy | archived | none | [Git Monorepo Policy](knowledge/governance/git-monorepo-policy.md) | n/a |
| iconography-rules | archived | none | [Iconography Rules](knowledge/governance/iconography-rules.md) | n/a |
| index | archived | none | [Index](knowledge/governance/index.md) | n/a |
| licenses-report | archived | none | [licenses-report](knowledge/governance/licenses-report.md) | n/a |
| monorepo-symlink-deprecation-guide | archived | none | [monorepo-symlink-deprecation-guide](knowledge/governance/monorepo-symlink-deprecation-guide.md) | n/a |
| nft-policy | archived | none | [Nft Policy](knowledge/governance/nft-policy.md) | n/a |
| pr-policy-source-of-truth | archived | none | [PR Policy Source of Truth](knowledge/governance/pr-policy-source-of-truth.md) | n/a |
| security-quality-policy | archived | none | [Security Quality Policy](knowledge/governance/security-quality-policy.md) | n/a |
| toolchain-policy | archived | none | [Toolchain & Headless Browser Policy](knowledge/governance/toolchain-policy.md) | n/a |
| ai-readable-endpoints-contracts | archived | none | [Ai Readable Endpoints Contracts](knowledge/guides/ai-readable-endpoints-contracts.md) | n/a |
| codex-orchestration-architecture | archived | none | [Codex Orchestration Architecture](knowledge/guides/codex-orchestration-architecture.md) | n/a |
| content-authoring-code-only | archived | none | [Content Authoring Code Only](knowledge/guides/content-authoring-code-only.md) | n/a |
| content-pipeline-and-serializers | archived | none | [Content Pipeline And Serializers](knowledge/guides/content-pipeline-and-serializers.md) | n/a |
| gitflow-pr-structure | archived | none | [Gitflow Pr Structure](knowledge/guides/gitflow-pr-structure.md) | n/a |
| index | archived | none | [Index](knowledge/guides/index.md) | n/a |
| json-ld-contracts | archived | none | [Json Ld Contracts](knowledge/guides/json-ld-contracts.md) | n/a |
| knowledge-promotion-gitflow | archived | none | [Knowledge Promotion Gitflow](knowledge/guides/knowledge-promotion-gitflow.md) | n/a |
| linear-developer-identity-and-documentation-protocol | archived | none | [Linear Developer Identity And Documentation Protocol](knowledge/guides/linear-developer-identity-and-documentation-protocol.md) | n/a |
| linear-mcp-bridge | archived | none | [Linear MCP Bridge](knowledge/guides/linear-mcp-bridge.md) | n/a |
| linear-single-issue-slice-planning | archived | none | [Linear Single Issue Slice Planning](knowledge/guides/linear-single-issue-slice-planning.md) | n/a |
| next-devtools-mcp | archived | none | [next-devtools-mcp](knowledge/guides/next-devtools-mcp.md) | n/a |
| operability-observability-security-deploy | archived | none | [Operability Observability Security Deploy](knowledge/guides/operability-observability-security-deploy.md) | n/a |
| route-architecture-and-templates | archived | none | [Route Architecture And Templates](knowledge/guides/route-architecture-and-templates.md) | n/a |
| solana-kit-migration-recipes | archived | none | [Solana Kit Migration Recipes](knowledge/guides/solana-kit-migration-recipes.md) | n/a |
| index | archived | none | [Knowledge Catalog](knowledge/index.md) | n/a |
| log | archived | none | [Log](knowledge/log.md) | n/a |
| STORY-001-01-sqlite-core-outbox | archived | none | [STORY-001-01 HU-1.6 Persistencia Relacional SQLite Core y Cola Outbox](knowledge/rfcs/EPIC-001-shell-brand-vault-sqlite-orchestrator/STORY-001-01-sqlite-core-outbox.md) | n/a |
| STORY-001-02-byok-keyring-health | archived | none | [STORY-001-02 HU-1.3/1.5 Gestión Segura de Credenciales BYOK y Motor de Diagnóstico de Salud](knowledge/rfcs/EPIC-001-shell-brand-vault-sqlite-orchestrator/STORY-001-02-byok-keyring-health.md) | n/a |
| STORY-001-03-brand-vault-crud | archived | none | [STORY-001-03 HU-1.1 Bóveda de Identidad Visual y Conceptual (Brand Vault CRUD)](knowledge/rfcs/EPIC-001-shell-brand-vault-sqlite-orchestrator/STORY-001-03-brand-vault-crud.md) | n/a |
| STORY-001-04-ai-provider-registry | archived | none | [STORY-001-04 Factoría Desacoplada de Modelos de Lenguaje (AiProviderRegistry)](knowledge/rfcs/EPIC-001-shell-brand-vault-sqlite-orchestrator/STORY-001-04-ai-provider-registry.md) | n/a |
| STORY-001-05-tool-calling-guardrails | archived | none | [STORY-001-05 HU-6.3 Protocolo de Acciones (Tool Calling), Guardrails y Action Log](knowledge/rfcs/EPIC-001-shell-brand-vault-sqlite-orchestrator/STORY-001-05-tool-calling-guardrails.md) | n/a |
| STORY-001-06-socratic-interview-sidebar | archived | none | [STORY-001-06 HU-1.2/6.1 Asistente Lateral Operativo y Entrevista Socrática de Marca](knowledge/rfcs/EPIC-001-shell-brand-vault-sqlite-orchestrator/STORY-001-06-socratic-interview-sidebar.md) | n/a |
| STORY-002-01-release-context-level3 | archived | none | [STORY-002-01 HU-1.4 Ficha Conceptual del Lanzamiento (Contexto Nivel 3)](knowledge/rfcs/EPIC-002-release-planner-engine/STORY-002-01-release-context-level3.md) | n/a |
| STORY-002-02-archetype-planner-templates | archived | none | [STORY-002-02 HU-2.1 Creación de Lanzamiento por Arquetipo (Plantillas Musicales)](knowledge/rfcs/EPIC-002-release-planner-engine/STORY-002-02-archetype-planner-templates.md) | n/a |
| STORY-002-03-audio-asset-links | archived | none | [STORY-002-03 HU-2.4 Registro y Validación de Enlaces a Activos de Audio (Drive / Dropbox / Disco)](knowledge/rfcs/EPIC-002-release-planner-engine/STORY-002-03-audio-asset-links.md) | n/a |
| STORY-002-04-gatekeeper-alerts | archived | none | [STORY-002-04 HU-2.2 Alertas de Hitos Bloqueantes (Gatekeepers) y Camino Crítico](knowledge/rfcs/EPIC-002-release-planner-engine/STORY-002-04-gatekeeper-alerts.md) | n/a |
| STORY-002-05-cascade-schedule-recalculation | archived | none | [STORY-002-05 HU-2.6 Recálculo en Cascada del Cronograma ante Retrasos Críticos](knowledge/rfcs/EPIC-002-release-planner-engine/STORY-002-05-cascade-schedule-recalculation.md) | n/a |
| STORY-002-06-deliverable-approval-workflow | archived | none | [STORY-002-06 HU-2.5 Bucle Formal de Aprobación y Rechazo con Feedback de Colaboradores](knowledge/rfcs/EPIC-002-release-planner-engine/STORY-002-06-deliverable-approval-workflow.md) | n/a |
| STORY-002-07-role-preview-toggle | archived | none | [STORY-002-07 HU-2.3 Vista Diferenciada por Roles (RBAC Local & RolePreviewToggle)](knowledge/rfcs/EPIC-002-release-planner-engine/STORY-002-07-role-preview-toggle.md) | n/a |
| STORY-002-08-sidebar-planner-tools | archived | none | [STORY-002-08 HU-6.1 (v2) Tools de Planificación para el Asistente Lateral Operativo](knowledge/rfcs/EPIC-002-release-planner-engine/STORY-002-08-sidebar-planner-tools.md) | n/a |
| STORY-003-01-brand-anchored-asset-generation | archived | none | [STORY-003-01-brand-anchored-asset-generation](knowledge/rfcs/EPIC-003-creative-pipeline-engine/STORY-003-01-brand-anchored-asset-generation.md) | n/a |
| STORY-003-02-batching-and-curation-grid | archived | none | [STORY-003-02-batching-and-curation-grid](knowledge/rfcs/EPIC-003-creative-pipeline-engine/STORY-003-02-batching-and-curation-grid.md) | n/a |
| STORY-003-03-social-copy-and-scripts | archived | none | [STORY-003-03-social-copy-and-scripts](knowledge/rfcs/EPIC-003-creative-pipeline-engine/STORY-003-03-social-copy-and-scripts.md) | n/a |
| STORY-003-04-typography-cover-stamping | archived | none | [STORY-003-04-typography-cover-stamping](knowledge/rfcs/EPIC-003-creative-pipeline-engine/STORY-003-04-typography-cover-stamping.md) | n/a |
| STORY-003-05-release-asset-vault | archived | none | [STORY-003-05-release-asset-vault](knowledge/rfcs/EPIC-003-creative-pipeline-engine/STORY-003-05-release-asset-vault.md) | n/a |
| STORY-003-06-prompt-studio-text-only | archived | none | [STORY-003-06-prompt-studio-text-only](knowledge/rfcs/EPIC-003-creative-pipeline-engine/STORY-003-06-prompt-studio-text-only.md) | n/a |
| STORY-003-07-sidebar-creative-tools | archived | none | [STORY-003-07-sidebar-creative-tools](knowledge/rfcs/EPIC-003-creative-pipeline-engine/STORY-003-07-sidebar-creative-tools.md) | n/a |
| STORY-004-01-multichannel-scheduling-handshake | archived | none | [STORY-004-01-multichannel-scheduling-handshake](knowledge/rfcs/EPIC-004-multichannel-distribution-postiz/STORY-004-01-multichannel-scheduling-handshake.md) | n/a |
| STORY-004-02-micro-campaigns-ads | archived | none | [STORY-004-02-micro-campaigns-ads](knowledge/rfcs/EPIC-004-multichannel-distribution-postiz/STORY-004-02-micro-campaigns-ads.md) | n/a |
| STORY-004-03-oauth-hub-connections | archived | none | [STORY-004-03-oauth-hub-connections](knowledge/rfcs/EPIC-004-multichannel-distribution-postiz/STORY-004-03-oauth-hub-connections.md) | n/a |
| STORY-004-04-visual-content-calendar | archived | none | [STORY-004-04-visual-content-calendar](knowledge/rfcs/EPIC-004-multichannel-distribution-postiz/STORY-004-04-visual-content-calendar.md) | n/a |
| STORY-004-05-retry-queue-error-alerts | archived | none | [STORY-004-05-retry-queue-error-alerts](knowledge/rfcs/EPIC-004-multichannel-distribution-postiz/STORY-004-05-retry-queue-error-alerts.md) | n/a |
| STORY-004-06-sidebar-distribution-tools | archived | none | [STORY-004-06-sidebar-distribution-tools](knowledge/rfcs/EPIC-004-multichannel-distribution-postiz/STORY-004-06-sidebar-distribution-tools.md) | n/a |
| STORY-005-01-centralized-performance-dashboard | archived | none | [STORY-005-01-centralized-performance-dashboard](knowledge/rfcs/EPIC-005-analytics-strategic-advisor-advanced/STORY-005-01-centralized-performance-dashboard.md) | n/a |
| STORY-005-02-streaming-csv-report-ingestion | archived | none | [STORY-005-02-streaming-csv-report-ingestion](knowledge/rfcs/EPIC-005-analytics-strategic-advisor-advanced/STORY-005-02-streaming-csv-report-ingestion.md) | n/a |
| STORY-005-03-ad-spend-efficiency-cpa-cpc | archived | none | [STORY-005-03-ad-spend-efficiency-cpa-cpc](knowledge/rfcs/EPIC-005-analytics-strategic-advisor-advanced/STORY-005-03-ad-spend-efficiency-cpa-cpc.md) | n/a |
| STORY-005-04-strategic-advisor-memory-privacy | archived | none | [STORY-005-04-strategic-advisor-memory-privacy](knowledge/rfcs/EPIC-005-analytics-strategic-advisor-advanced/STORY-005-04-strategic-advisor-memory-privacy.md) | n/a |
| STORY-005-05-proactive-anomaly-alerts | archived | none | [STORY-005-05-proactive-anomaly-alerts](knowledge/rfcs/EPIC-005-analytics-strategic-advisor-advanced/STORY-005-05-proactive-anomaly-alerts.md) | n/a |
| STORY-005-06-autonomous-api-dashboard-builder | archived | none | [STORY-005-06-autonomous-api-dashboard-builder](knowledge/rfcs/EPIC-005-analytics-strategic-advisor-advanced/STORY-005-06-autonomous-api-dashboard-builder.md) | n/a |
| STORY-006-01-artist-portal-magic-link | archived | none | [STORY-006-01-artist-portal-magic-link](knowledge/rfcs/EPIC-006-external-connectivity-artist-portal-mcp-hardening/STORY-006-01-artist-portal-magic-link.md) | n/a |
| STORY-006-02-open-rest-api-gateway | archived | none | [STORY-006-02-open-rest-api-gateway](knowledge/rfcs/EPIC-006-external-connectivity-artist-portal-mcp-hardening/STORY-006-02-open-rest-api-gateway.md) | n/a |
| STORY-006-03-local-mcp-server-protocol | archived | none | [STORY-006-03-local-mcp-server-protocol](knowledge/rfcs/EPIC-006-external-connectivity-artist-portal-mcp-hardening/STORY-006-03-local-mcp-server-protocol.md) | n/a |
| STORY-006-04-production-hardening-security | archived | none | [STORY-006-04-production-hardening-security](knowledge/rfcs/EPIC-006-external-connectivity-artist-portal-mcp-hardening/STORY-006-04-production-hardening-security.md) | n/a |
| index | archived | none | [Security Quality & Compliance Index](knowledge/security/index.md) | n/a |
