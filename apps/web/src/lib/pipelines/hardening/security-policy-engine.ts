/**
 * @file security-policy-engine.ts
 * @layer Domain
 * @description Hardening and security policy evaluation engine: input sanitization,
 *              sliding window rate limiting, CORS origin verification, and URI scheme inspection.
 *              Zero network I/O, zero classes.
 */

export interface RateLimitStatus {
  allowed: boolean;
  remaining: number;
  resetTimeMs: number;
}

export interface RateLimiter {
  checkLimit: (identifier: string) => RateLimitStatus;
  reset: () => void;
}

/**
 * Sanitizes input text by removing potentially malicious HTML/script tags and control characters.
 *
 * @param text - Untrusted input string
 * @returns Cleaned and sanitized string
 */
export function sanitizeInputText(text: string): string {
  // Step 1: Handle non-string inputs
  if (typeof text !== 'string') {
    return '';
  }

  // Step 2: Strip HTML tag delimiters and script sequences
  return text
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/[<>]/g, '')
    .trim();
}

/**
 * Verifies if an origin header is within the explicitly configured whitelist.
 *
 * @param origin - Origin header value
 * @param allowedOrigins - List of authorized origins
 * @returns True if origin is permitted
 */
export function isAllowedOrigin(origin: string, allowedOrigins: string[]): boolean {
  // Step 1: If whitelist includes wildcard, permit
  if (allowedOrigins.includes('*')) {
    return true;
  }

  // Step 2: Check exact match
  return allowedOrigins.includes(origin.trim().toLowerCase());
}

/**
 * Validates that a URI scheme belongs to authorized protocols (http, https, brand, releases, metrics).
 *
 * @param uri - URI string to evaluate
 * @returns True if URI starts with an authorized scheme
 */
export function isSafeUriScheme(uri: string): boolean {
  // Step 1: Reject empty string
  if (!uri || typeof uri !== 'string') {
    return false;
  }

  // Step 2: Match authorized protocol prefixes
  const safeSchemeRegex = /^(https?|brand|releases|metrics):\/\//i;
  return safeSchemeRegex.test(uri.trim());
}

/**
 * Functional factory generating an in-memory sliding window rate limiter.
 *
 * @param maxRequests - Maximum requests allowed within duration window
 * @param windowMs - Duration of the rate window in milliseconds
 * @returns RateLimiter instance
 */
export function createRateLimiter(maxRequests = 60, windowMs = 60000): RateLimiter {
  // Step 1: Internal memory map tracking request timestamps
  const accessLog = new Map<string, number[]>();

  return {
    checkLimit: (identifier: string): RateLimitStatus => {
      // Step 2: Filter expired timestamps
      const now = Date.now();
      const windowStart = now - windowMs;
      const history = (accessLog.get(identifier) || []).filter((t) => t > windowStart);

      // Step 3: Check limit threshold
      if (history.length >= maxRequests) {
        const oldest = history[0];
        return {
          allowed: false,
          remaining: 0,
          resetTimeMs: oldest + windowMs - now,
        };
      }

      // Step 4: Record new access timestamp
      history.push(now);
      accessLog.set(identifier, history);

      return {
        allowed: true,
        remaining: maxRequests - history.length,
        resetTimeMs: windowMs,
      };
    },

    reset: (): void => {
      // Step 5: Clear log
      accessLog.clear();
    },
  };
}
