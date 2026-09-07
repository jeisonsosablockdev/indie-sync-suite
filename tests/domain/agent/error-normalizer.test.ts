/**
 * @file error-normalizer.test.ts
 * @layer Domain Test
 * @description Unit tests for LLM error categorization and message translation.
 */

import { describe, test, expect } from 'vitest';
import { normalizeAiError } from '../../../apps/web/src/lib/pipelines/agent/error-normalizer';

describe('normalizeAiError', () => {
  test('categorizes 401/403 and unauthorized errors as "invalid_key"', () => {
    const error = { status: 401, message: 'Incorrect API key provided' };
    const normalized = normalizeAiError(error, 'OpenAI');

    expect(normalized.category).toBe('invalid_key');
    expect(normalized.userMessage).toContain('es inválida o ha sido revocada');
    expect(normalized.retryable).toBe(false);
  });

  test('categorizes 429 and rate limit errors as "rate_limit_or_quota"', () => {
    const error = { status: 429, message: 'You exceeded your current quota' };
    const normalized = normalizeAiError(error, 'Anthropic');

    expect(normalized.category).toBe('rate_limit_or_quota');
    expect(normalized.userMessage).toContain('límite de cuota o peticiones');
    expect(normalized.retryable).toBe(true);
  });

  test('categorizes 503 and overloaded errors as "provider_overloaded"', () => {
    const error = { status: 503, message: 'Service Unavailable - Overloaded' };
    const normalized = normalizeAiError(error, 'Google Gemini');

    expect(normalized.category).toBe('provider_overloaded');
    expect(normalized.userMessage).toContain('se encuentran saturados');
    expect(normalized.retryable).toBe(true);
  });

  test('categorizes SSRF errors as "security_violation"', () => {
    const error = new Error('URL de endpoint rechazada por seguridad: SSRF attempt');
    const normalized = normalizeAiError(error);

    expect(normalized.category).toBe('security_violation');
    expect(normalized.userMessage).toContain('bloqueada por medidas de seguridad');
    expect(normalized.retryable).toBe(false);
  });

  test('categorizes aborts as "timeout"', () => {
    const error = new Error('The operation was aborted');
    error.name = 'AbortError';
    const normalized = normalizeAiError(error);

    expect(normalized.category).toBe('timeout');
    expect(normalized.userMessage).toContain('tardó demasiado tiempo');
    expect(normalized.retryable).toBe(true);
  });
});
