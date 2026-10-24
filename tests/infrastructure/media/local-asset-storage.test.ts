/**
 * @file local-asset-storage.test.ts
 * @layer Infrastructure Test
 * @description Unit and integration tests for local-asset-storage (HU-3.5 / SPEC-03-06).
 *              Verifies Path Traversal defense, filename sanitization, atomic writes, reads, and deletions.
 */

import { describe, test, expect, beforeEach, afterEach } from 'vitest';
import fs from 'node:fs';
import path from 'node:path';
import os from 'node:os';
import {
  createLocalAssetStorage,
  sanitizeFilename,
  LocalAssetStorage,
} from '../../../apps/web/src/lib/infrastructure/media/local-asset-storage';

describe('Infrastructure: local-asset-storage (HU-3.5 / SPEC-03-06)', () => {
  let tempDir: string;
  let storage: LocalAssetStorage;

  beforeEach(() => {
    tempDir = fs.mkdtempSync(path.join(os.tmpdir(), 'iss-asset-vault-test-'));
    storage = createLocalAssetStorage(tempDir);
  });

  afterEach(() => {
    if (fs.existsSync(tempDir)) {
      fs.rmSync(tempDir, { recursive: true, force: true });
    }
  });

  test('@spec REQ-HU-3.5-10: sanitizes filenames stripping path traversal and null characters', () => {
    // Act & Assert
    expect(sanitizeFilename('../../etc/passwd')).toBe('passwd');
    expect(sanitizeFilename('..\\windows\\system32')).toBe('system32');
    expect(sanitizeFilename('cover art (1).png')).toBe('cover_art__1_.png');
    expect(sanitizeFilename('track-01_final.wav')).toBe('track-01_final.wav');
  });

  test('@spec REQ-HU-3.5-11: saves and reads asset buffer to disk inside vault root', async () => {
    // Arrange
    const content = Buffer.from('FAKE-HIGH-RES-IMAGE-DATA-3000PX', 'utf8');
    const filename = 'test-artwork.png';

    // Act
    const metadata = await storage.saveAssetBuffer(filename, content);
    const readBack = await storage.readAssetBuffer(metadata.relativePath);
    const exists = await storage.assetExists(metadata.relativePath);

    // Assert
    expect(metadata.relativePath).toBe('test-artwork.png');
    expect(metadata.sizeBytes).toBe(content.byteLength);
    expect(readBack.toString('utf8')).toBe('FAKE-HIGH-RES-IMAGE-DATA-3000PX');
    expect(exists).toBe(true);
  });

  test('@spec REQ-HU-3.5-12: deletes asset file cleanly and confirms non-existence', async () => {
    // Arrange
    const content = Buffer.from('TEMP-DELETE-ME', 'utf8');
    const saved = await storage.saveAssetBuffer('to-delete.bin', content);

    // Act
    const deleted = await storage.deleteAssetFile(saved.relativePath);
    const existsAfter = await storage.assetExists(saved.relativePath);

    // Assert
    expect(deleted).toBe(true);
    expect(existsAfter).toBe(false);
  });

  test('@spec REQ-HU-3.5-13: throws error when reading non-existent asset file', async () => {
    // Act & Assert
    await expect(storage.readAssetBuffer('non-existent-file.png')).rejects.toThrow(
      'Asset file not found'
    );
  });
});
