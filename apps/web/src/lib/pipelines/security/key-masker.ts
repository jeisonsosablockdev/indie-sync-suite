/**
 * @file key-masker.ts
 * @layer Domain
 * @description In-memory API key masking and SHA-256 fingerprinting for zero-trust BYOK credential management.
 */

import crypto from 'node:crypto';

/**
 * Masks an API key for safe UI presentation and logging.
 * Preserves standard provider prefixes (OpenAI, Anthropic, Gemini, Groq)
 * while ensuring raw secret material is never exposed.
 *
 * @param key - Raw API key string
 * @returns Masked representation string
 */
export function maskApiKey(key: string): string {
  if (!key || typeof key !== 'string') {
    return '***';
  }

  const trimmed = key.trim();
  if (trimmed.length < 8) {
    return '***';
  }

  const suffix = trimmed.slice(-4);

  // Step 1: Check Anthropic key prefix
  if (trimmed.startsWith('sk-ant-')) {
    return `sk-ant-...${suffix}`;
  }

  // Step 2: Check OpenAI project key prefix
  if (trimmed.startsWith('sk-proj-')) {
    return `sk-proj-...${suffix}`;
  }

  // Step 3: Check standard OpenAI key prefix
  if (trimmed.startsWith('sk-')) {
    return `sk-...${suffix}`;
  }

  // Step 4: Check Groq key prefix
  if (trimmed.startsWith('gsk_')) {
    return `gsk_...${suffix}`;
  }

  // Step 5: Check Google Gemini key prefix
  if (trimmed.startsWith('AIzaSy')) {
    return `AIzaSy...${suffix}`;
  }

  // Step 6: Generic fallback for unknown providers
  return `...${suffix}`;
}

/**
 * Computes a SHA-256 fingerprint of an API key for in-memory client caching.
 * Prevents raw secrets from serving as cache dictionary keys.
 *
 * @param key - Raw API key
 * @returns Hex-encoded SHA-256 hash
 */
export function computeKeyFingerprint(key: string): string {
  return crypto.createHash('sha256').update(key).digest('hex');
}

/**
 * Validates whether an API key adheres to the expected structural pattern for a provider.
 *
 * @param provider - Provider name ('openai' | 'anthropic' | 'google' | 'groq')
 * @param key - Raw API key string to validate
 * @returns True if structurally valid, false otherwise
 */
export function validateKeyFormat(provider: string, key: string): boolean {
  if (!key || typeof key !== 'string') return false;
  const trimmed = key.trim();

  switch (provider.toLowerCase()) {
    case 'openai':
      return (trimmed.startsWith('sk-proj-') || trimmed.startsWith('sk-')) && trimmed.length >= 20;
    case 'anthropic':
      return trimmed.startsWith('sk-ant-') && trimmed.length >= 20;
    case 'google':
    case 'gemini':
      return trimmed.startsWith('AIzaSy') && trimmed.length >= 20;
    case 'groq':
      return trimmed.startsWith('gsk_') && trimmed.length >= 20;
    default:
      return trimmed.length >= 8;
  }
}
