-- apps/web/src/lib/infrastructure/db/migrations/002_label_brand_vault.sql
-- Layer: Infrastructure (Layer 4)
-- Purpose: Add Brand Vault aesthetic columns to labels table for parity with artists

ALTER TABLE labels ADD COLUMN bio TEXT;
ALTER TABLE labels ADD COLUMN color_palette TEXT;
ALTER TABLE labels ADD COLUMN typography TEXT;
ALTER TABLE labels ADD COLUMN tone_of_voice TEXT;
ALTER TABLE labels ADD COLUMN social_links TEXT;
