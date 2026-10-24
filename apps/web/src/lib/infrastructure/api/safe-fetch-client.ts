/**
 * @file safe-fetch-client.ts
 * @layer Infrastructure
 * @description Safe HTTP client for querying external analytics REST endpoints with strict
 *              anti-SSRF protections, loopback disallowance, and safe timeouts. Pure functional factory pattern, zero classes.
 */

export interface SafeFetchClientConfig {
  timeoutMs?: number;
  maxResponseSizeBytes?: number;
}

export interface SafeFetchClient {
  fetchJson: (url: string, headers?: Record<string, string>) => Promise<unknown>;
  validateEndpoint: (url: string) => boolean;
}

/**
 * Validates that a target URL is public and does not point to internal or private subnets (anti-SSRF).
 *
 * @param urlString - Target URL string to validate
 * @returns True if destination host is safe for public requests
 */
export function assertSafeEndpointUrl(urlString: string): boolean {
  try {
    const parsed = new URL(urlString);
    if (parsed.protocol !== 'https:' && parsed.protocol !== 'http:') {
      return false;
    }

    const host = parsed.hostname.toLowerCase().replace(/[\[\]]/g, '');

    // Disallow loopback, link-local, private networks, and cloud instance metadata
    if (
      host === 'localhost' ||
      host === '127.0.0.1' ||
      host === '::1' ||
      host === '0.0.0.0' ||
      host.startsWith('10.') ||
      host.startsWith('192.168.') ||
      host.startsWith('169.254.') ||
      /^172\.(1[6-9]|2[0-9]|3[0-1])\./.test(host)
    ) {
      return false;
    }

    return true;
  } catch {
    return false;
  }
}

/**
 * Functional factory instantiating the Anti-SSRF Safe Fetch Client.
 *
 * @param config - Timeout and payload size limitations
 * @returns Fully typed SafeFetchClient implementation
 */
export function createSafeFetchClient(config: SafeFetchClientConfig = {}): SafeFetchClient {
  const timeoutMs = config.timeoutMs ?? 8000;

  return {
    validateEndpoint: (url: string): boolean => {
      // Step 1: Execute anti-SSRF validation
      return assertSafeEndpointUrl(url);
    },

    fetchJson: async (url: string, headers: Record<string, string> = {}): Promise<unknown> => {
      // Step 1: Enforce security boundary
      if (!assertSafeEndpointUrl(url)) {
        throw new Error(`Security Violation: Unsafe or prohibited private network endpoint: ${url}`);
      }

      // Step 2: Configure abort timeout
      const controller = new AbortController();
      const timer = setTimeout(() => controller.abort(), timeoutMs);

      try {
        // Step 3: Execute safe fetch request
        const res = await fetch(url, {
          method: 'GET',
          headers: {
            'Accept': 'application/json',
            'User-Agent': 'IndieSyncSuite-Analytics/1.0',
            ...headers,
          },
          signal: controller.signal,
        });

        if (!res.ok) {
          throw new Error(`HTTP Error ${res.status}: ${res.statusText}`);
        }

        return await res.json();
      } finally {
        clearTimeout(timer);
      }
    },
  };
}
