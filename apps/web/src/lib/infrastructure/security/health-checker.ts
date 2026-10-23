/**
 * @file health-checker.ts
 * @layer Infrastructure
 * @description Lightweight HTTP metadata health-checker for BYOK LLM providers with 3500ms strict timeout and auth header redaction.
 */

import { SupportedProvider } from '../../pipelines/security/credential-service';
import { maskApiKey } from '../../pipelines/security/key-masker';

export type ProviderHealthStatus = 'healthy' | 'low_quota' | 'invalid_key' | 'unreachable';

export interface HealthCheckResult {
  provider: SupportedProvider;
  status: ProviderHealthStatus;
  latencyMs: number;
  maskedKey: string;
  details?: string;
}

export interface HealthCheckConfig {
  endpoint: string;
  method: 'GET' | 'POST';
  headers: (key: string) => Record<string, string>;
}

/**
 * Provider metadata endpoint configurations.
 * Strictly adheres to safe header authentication.
 */
export const PROVIDER_HEALTH_CONFIGS: Record<SupportedProvider, HealthCheckConfig> = {
  openai: {
    endpoint: 'https://api.openai.com/v1/models',
    method: 'GET',
    headers: (key: string) => ({
      'Authorization': `Bearer ${key}`,
    }),
  },
  anthropic: {
    endpoint: 'https://api.anthropic.com/v1/models',
    method: 'GET',
    headers: (key: string) => ({
      'x-api-key': key,
      'anthropic-version': '2023-06-01',
    }),
  },
  google: {
    endpoint: 'https://generativelanguage.googleapis.com/v1beta/models',
    method: 'GET',
    // Invariant: Gemini MUST receive key via header, NEVER query param ?key=...
    headers: (key: string) => ({
      'x-goog-api-key': key,
    }),
  },
  groq: {
    endpoint: 'https://api.groq.com/openai/v1/models',
    method: 'GET',
    headers: (key: string) => ({
      'Authorization': `Bearer ${key}`,
    }),
  },
};

/**
 * Redacts any potential API keys from error messages or diagnostic strings.
 *
 * @param text - Error text or message to sanitize
 * @param rawKey - Raw secret to specifically redact
 * @returns Redacted and safe message string
 */
export function sanitizeLog(text: string, rawKey?: string): string {
  let sanitized = text;
  // Step 1: Redact Bearer and API key header values
  sanitized = sanitized.replace(/Bearer\s+[A-Za-z0-9_.-]+/gi, 'Bearer [REDACTED]');
  sanitized = sanitized.replace(/x-goog-api-key:\s*[A-Za-z0-9_.-]+/gi, 'x-goog-api-key: [REDACTED]');
  sanitized = sanitized.replace(/x-api-key:\s*[A-Za-z0-9_.-]+/gi, 'x-api-key: [REDACTED]');

  // Step 2: Redact raw secret if it appears elsewhere
  if (rawKey && rawKey.length > 4) {
    sanitized = sanitized.replaceAll(rawKey, '[REDACTED_KEY]');
  }
  return sanitized;
}

/**
 * Executes a lightweight HTTP health check against a provider's models endpoint.
 *
 * @param provider - LLM provider to test
 * @param rawKey - Plaintext API key to verify
 * @param customTimeoutMs - Optional timeout override (defaults to 3500ms)
 * @returns HealthCheckResult containing status, latency, and safe masked key
 */
export async function checkProviderHealth(
  provider: SupportedProvider,
  rawKey: string,
  customTimeoutMs: number = 3500
): Promise<HealthCheckResult> {
  const maskedKey = maskApiKey(rawKey);
  const config = PROVIDER_HEALTH_CONFIGS[provider];

  if (!config) {
    return {
      provider,
      status: 'unreachable',
      latencyMs: 0,
      maskedKey,
      details: `Proveedor desconocido: ${provider}`,
    };
  }

  // Step 1: Set up strict timeout controller (3500ms invariant)
  const controller = new AbortController();
  const timeoutId = setTimeout(() => controller.abort(), customTimeoutMs);
  const startTime = Date.now();

  try {
    // Step 2: Dispatch lightweight GET request
    const response = await fetch(config.endpoint, {
      method: config.method,
      headers: config.headers(rawKey),
      signal: controller.signal,
    });

    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;

    // Step 3: Check remaining rate limits if emitted
    const remainingRequests = response.headers.get('x-ratelimit-remaining') ||
      response.headers.get('x-ratelimit-remaining-requests');

    if (response.ok) {
      if (remainingRequests === '0') {
        return {
          provider,
          status: 'low_quota',
          latencyMs,
          maskedKey,
          details: 'Cuota de peticiones casi agotada (0 restantes)',
        };
      }
      return {
        provider,
        status: 'healthy',
        latencyMs,
        maskedKey,
        details: 'Conexión exitosa y credencial verificada',
      };
    }

    // Step 4: Map HTTP error status codes
    if (response.status === 401 || response.status === 403) {
      return {
        provider,
        status: 'invalid_key',
        latencyMs,
        maskedKey,
        details: 'Credencial inválida o no autorizada (HTTP 401/403)',
      };
    }

    if (response.status === 429) {
      return {
        provider,
        status: 'low_quota',
        latencyMs,
        maskedKey,
        details: 'Límite de cuota o rate limit excedido (HTTP 429)',
      };
    }

    return {
      provider,
      status: 'unreachable',
      latencyMs,
      maskedKey,
      details: `Respuesta de error inesperada (HTTP ${response.status})`,
    };
  } catch (error: any) {
    clearTimeout(timeoutId);
    const latencyMs = Date.now() - startTime;
    const isTimeout = error?.name === 'AbortError' || error?.message?.includes('aborted');

    return {
      provider,
      status: 'unreachable',
      latencyMs,
      maskedKey,
      details: isTimeout
        ? `Timeout de conexión excedido (${customTimeoutMs}ms)`
        : sanitizeLog(error?.message || 'Error de conexión', rawKey),
    };
  }
}
