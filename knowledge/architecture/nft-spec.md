---
type: ADR
title: NFT and Digital Asset Specification
description: Asset standard specification (Metaplex Core), collection schemas, metadata schemas, and royalty policies.
tags: [nft, metaplex, assets, solana, creative-pipeline]
timestamp: 2026-10-24T00:00:00Z
resource: local
---

# NFT and Digital Asset Specification

## Scope
- Digital asset metadata schema, collection authority, and minting pipeline.
- Integration with Épica 3 (Creative Pipeline Engine): Approved creative deliverables (`creative_assets` with SHA-256 cryptographic hashes) serve as the canonical multimedia assets and off-chain metadata source for Metaplex Core releases.

## Asset Architecture (Metaplex Core)
- Standards: Metaplex Core (`mpl-core`) single-account assets.
- Metadata: Decentralized storage with strict JSON schema compliance.
- Creative Deliverables Linkage:
  - 1:1 Cover Art (3000×3000 px, SHA-256 verified) mapped to Metaplex Core primary `image`.
  - 9:16 Visual Canvases and 16:9 Banners recorded in off-chain JSON metadata `properties.files`.
  - Integrity: Content hash verification via `apps/web/src/lib/pipelines/creative/asset-hasher.ts` guarantees immutable media handshake prior to on-chain minting.
