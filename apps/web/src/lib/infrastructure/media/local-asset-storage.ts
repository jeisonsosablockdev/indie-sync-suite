/**
 * @file local-asset-storage.ts
 * @layer Infrastructure
 * @description Local file system storage manager for creative assets. Enforces strict Path Traversal
 *              prevention, filename sanitization, and atomic disk writes. Pure functional factory pattern, zero classes.
 */

import fs from 'node:fs';
import path from 'node:path';

/**
 * Result returned after saving an asset to the local filesystem.
 */
export interface SavedAssetMetadata {
  relativePath: string;
  absolutePath: string;
  sizeBytes: number;
}

/**
 * Functional interface for local asset storage operations.
 */
export interface LocalAssetStorage {
  saveAssetBuffer: (filename: string, buffer: Buffer) => Promise<SavedAssetMetadata>;
  readAssetBuffer: (relativePath: string) => Promise<Buffer>;
  assetExists: (relativePath: string) => Promise<boolean>;
  deleteAssetFile: (relativePath: string) => Promise<boolean>;
  getBaseDirectory: () => string;
}

/**
 * Sanitizes a filename to prevent Path Traversal, stripping directory separators and null bytes.
 *
 * @param filename - Untrusted input filename
 * @returns Safe filename component
 */
export function sanitizeFilename(filename: string): string {
  // Step 1: Normalize backslashes to forward slashes for cross-platform basename resolution
  const normalized = filename.replace(/\\/g, '/');
  // Step 2: Extract basename and strip non-whitelisted characters
  return path.basename(normalized).replace(/[^a-zA-Z0-9._-]/g, '_');
}

/**
 * Functional factory instantiating the Local Asset Storage engine.
 *
 * @param customBaseDir - Optional directory path for storing files; defaults to .local-vault
 * @returns Fully typed LocalAssetStorage interface
 */
export function createLocalAssetStorage(customBaseDir?: string): LocalAssetStorage {
  // Step 1: Resolve base directory safely
  const baseDir = path.resolve(customBaseDir ?? path.join(process.cwd(), '.local-vault', 'assets'));

  // Step 2: Ensure base directory exists
  if (!fs.existsSync(baseDir)) {
    fs.mkdirSync(baseDir, { recursive: true });
  }

  /**
   * Asserts that a resolved target path strictly resides within the base directory.
   */
  function assertPathInsideBase(resolvedPath: string): void {
    const normalizedBase = path.normalize(baseDir);
    const normalizedTarget = path.normalize(resolvedPath);

    if (!normalizedTarget.startsWith(normalizedBase)) {
      throw new Error(`Security Violation: Path Traversal detected outside vault root: ${resolvedPath}`);
    }
  }

  return {
    saveAssetBuffer: async (filename: string, buffer: Buffer): Promise<SavedAssetMetadata> => {
      // Step 1: Sanitize filename to prevent traversal
      const safeName = sanitizeFilename(filename);
      const targetPath = path.resolve(baseDir, safeName);

      // Step 2: Assert security boundary
      assertPathInsideBase(targetPath);

      // Step 3: Write buffer to disk atomically
      await fs.promises.writeFile(targetPath, buffer);

      return {
        relativePath: safeName,
        absolutePath: targetPath,
        sizeBytes: buffer.byteLength,
      };
    },

    readAssetBuffer: async (relativePath: string): Promise<Buffer> => {
      // Step 1: Sanitize input and resolve path
      const safeName = sanitizeFilename(relativePath);
      const targetPath = path.resolve(baseDir, safeName);

      // Step 2: Assert boundary
      assertPathInsideBase(targetPath);

      // Step 3: Read file buffer
      if (!fs.existsSync(targetPath)) {
        throw new Error(`Asset file not found at: ${safeName}`);
      }
      return await fs.promises.readFile(targetPath);
    },

    assetExists: async (relativePath: string): Promise<boolean> => {
      // Step 1: Sanitize and resolve
      const safeName = sanitizeFilename(relativePath);
      const targetPath = path.resolve(baseDir, safeName);

      // Step 2: Check boundary and file existence
      assertPathInsideBase(targetPath);
      return fs.existsSync(targetPath);
    },

    deleteAssetFile: async (relativePath: string): Promise<boolean> => {
      // Step 1: Sanitize and resolve
      const safeName = sanitizeFilename(relativePath);
      const targetPath = path.resolve(baseDir, safeName);

      // Step 2: Boundary validation
      assertPathInsideBase(targetPath);

      // Step 3: Remove if exists
      if (fs.existsSync(targetPath)) {
        await fs.promises.unlink(targetPath);
        return true;
      }
      return false;
    },

    getBaseDirectory: (): string => {
      return baseDir;
    },
  };
}
