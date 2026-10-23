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
| Archived | 52 |
| Observed status | 1 |
| Triaged status | 0 |
| Promoted status | 0 |
| Archived status | 52 |

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
| feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1-implementation | archived | none | [feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1-implementation](knowledge/features/feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1-implementation.md) | n/a |
| feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1 | archived | none | [feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1](knowledge/features/feature-jaymusicmachine-ISS-001-initial-setup-and-product-spec-v1.md) | n/a |
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
| STORY-001-01-kickoff | archived | none | [STORY-001-01 Kickoff y Sustrato Determinista](knowledge/rfcs/EPIC-001-shell-brand-vault-sqlite-orchestrator/STORY-001-01-kickoff.md) | n/a |
| index | archived | none | [Security Quality & Compliance Index](knowledge/security/index.md) | n/a |
