/**
 * @file client-cache.test.ts
 * @layer Domain Test
 * @description Unit tests for in-memory LLM client caching and deterministic provider purging.
 */

import { describe, test, expect } from 'vitest';
import { ClientCache } from '../../../apps/web/src/lib/pipelines/agent/client-cache';

describe('ClientCache', () => {
  test('caches and retrieves clients by composite fingerprint key', () => {
    const cache = new ClientCache<{ clientName: string }>();

    const fp = 'a1b2c3d4e5f67890';
    cache.set('openai', 'gpt-4o', fp, { clientName: 'OpenAI-Client-1' });

    const retrieved = cache.get('openai', 'gpt-4o', fp);
    expect(retrieved).toBeDefined();
    expect(retrieved?.clientName).toBe('OpenAI-Client-1');

    // Miss on different fingerprint
    const miss = cache.get('openai', 'gpt-4o', 'different-fp');
    expect(miss).toBeUndefined();
  });

  test('purges all models for a specific provider upon credential mutation', () => {
    const cache = new ClientCache();

    cache.set('openai', 'gpt-4o', 'fp1', { id: 1 });
    cache.set('openai', 'gpt-4o-mini', 'fp1', { id: 2 });
    cache.set('anthropic', 'claude-3-5-sonnet-20241022', 'fp2', { id: 3 });

    expect(cache.size()).toBe(3);

    const evicted = cache.purgeProvider('openai');
    expect(evicted).toBe(2);
    expect(cache.size()).toBe(1);

    expect(cache.get('openai', 'gpt-4o', 'fp1')).toBeUndefined();
    expect(cache.get('anthropic', 'claude-3-5-sonnet-20241022', 'fp2')).toBeDefined();
  });

  test('clears all cached entries cleanly', () => {
    const cache = new ClientCache();
    cache.set('google', 'gemini-1.5-pro-latest', 'fp', { id: 1 });
    expect(cache.size()).toBe(1);

    cache.clear();
    expect(cache.size()).toBe(0);
  });
});
