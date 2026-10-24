/**
 * @file audio-link-client.ts
 * @layer Infrastructure
 * @description Light HTTP verification client for external audio links (Drive, Dropbox, Disco)
 *              with exhaustive anti-SSRF protection, manual redirect validation, and timeout control.
 *              Zero classes, functional factory pattern.
 */

import dns from 'node:dns/promises';
import { isIP } from 'node:net';

export interface AudioLinkVerificationResult {
  valid: boolean;
  httpStatus?: number;
  mimeType?: string;
  fileSizeBytes?: number;
  errorMessage?: string;
}

export interface AudioLinkClient {
  verifyAudioLink: (rawUrl: string) => Promise<AudioLinkVerificationResult>;
}

/**
 * Checks if an IPv4 or IPv6 address belongs to private, loopback, link-local,
 * or cloud metadata ranges.
 */
export function isPrivateOrRestrictedIp(ip: string): boolean {
  // Step 1: Check IPv4 ranges
  if (isIP(ip) === 4) {
    const parts = ip.split('.').map(Number);
    const [b0, b1] = parts;

    // Loopback: 127.0.0.0/8
    if (b0 === 127) return true;
    // Current network / Broadcast: 0.0.0.0/8
    if (b0 === 0) return true;
    // RFC 1918 Class A: 10.0.0.0/8
    if (b0 === 10) return true;
    // RFC 1918 Class B: 172.16.0.0/12 (172.16.x.x - 172.31.x.x)
    if (b0 === 172 && b1 >= 16 && b1 <= 31) return true;
    // RFC 1918 Class C: 192.168.0.0/16
    if (b0 === 192 && b1 === 168) return true;
    // Link-local / AWS/GCP/Azure Cloud Metadata: 169.254.0.0/16
    if (b0 === 169 && b1 === 254) return true;

    return false;
  }

  // Step 2: Check IPv6 ranges
  if (isIP(ip) === 6) {
    const lower = ip.toLowerCase();
    // Loopback ::1
    if (lower === '::1' || lower === '0:0:0:0:0:0:0:1') return true;
    // Unique local: fc00::/7
    if (lower.startsWith('fc') || lower.startsWith('fd')) return true;
    // Link-local: fe80::/10
    if (lower.startsWith('fe8') || lower.startsWith('fe9') || lower.startsWith('fea') || lower.startsWith('feb')) return true;
    // IPv4-mapped IPv6: ::ffff:127.0.0.1
    if (lower.startsWith('::ffff:')) {
      const ipv4Part = lower.replace('::ffff:', '');
      return isPrivateOrRestrictedIp(ipv4Part);
    }
    return false;
  }

  return true; // Unknown IP format treated as restricted
}

/**
 * Functional factory for the light audio link verifier.
 */
export function createAudioLinkClient(options?: { timeoutMs?: number }): AudioLinkClient {
  const timeoutMs = options?.timeoutMs ?? 3500;

  return {
    verifyAudioLink: async (rawUrl: string): Promise<AudioLinkVerificationResult> => {
      let currentUrl = rawUrl;
      let redirectHops = 0;
      const MAX_REDIRECTS = 3;

      while (redirectHops <= MAX_REDIRECTS) {
        let parsedUrl: URL;
        try {
          parsedUrl = new URL(currentUrl);
        } catch {
          return { valid: false, errorMessage: 'URL malformada.' };
        }

        // Protocol enforcement
        if (parsedUrl.protocol !== 'https:' && parsedUrl.protocol !== 'http:') {
          return { valid: false, errorMessage: 'Protocolo no admitido. Solo HTTP/HTTPS.' };
        }

        const hostname = parsedUrl.hostname;

        // Anti-SSRF: Resolve DNS and verify all returned addresses
        try {
          const lookupResults = await dns.lookup(hostname, { all: true });
          for (const addr of lookupResults) {
            if (isPrivateOrRestrictedIp(addr.address)) {
              return { valid: false, errorMessage: `SSRF_BLOCKED: Destino no permitido (${addr.address}).` };
            }
          }
        } catch (dnsErr: any) {
          return { valid: false, errorMessage: `Error DNS: No se pudo resolver el host (${hostname}).` };
        }

        // Execution of lightweight probe with AbortController
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), timeoutMs);

        try {
          const response = await fetch(currentUrl, {
            method: 'HEAD',
            redirect: 'manual',
            signal: controller.signal,
            headers: {
              'User-Agent': 'IndieSyncSuite/0.2.0 (AudioLinkVerifier)',
            },
          });

          clearTimeout(timeoutId);

          // Handle manual redirect hops safely
          if (response.status >= 300 && response.status < 400) {
            const location = response.headers.get('location');
            if (!location) {
              return { valid: false, httpStatus: response.status, errorMessage: 'Redirección sin cabecera Location.' };
            }
            currentUrl = new URL(location, currentUrl).toString();
            redirectHops++;
            continue;
          }

          if (response.ok) {
            const mimeType = response.headers.get('content-type') || undefined;
            const contentLength = response.headers.get('content-length');
            const fileSizeBytes = contentLength ? parseInt(contentLength, 10) : undefined;

            return {
              valid: true,
              httpStatus: response.status,
              mimeType,
              fileSizeBytes,
            };
          }

          return {
            valid: false,
            httpStatus: response.status,
            errorMessage: `El servidor remoto respondió con estado HTTP ${response.status}.`,
          };
        } catch (fetchErr: any) {
          clearTimeout(timeoutId);
          if (fetchErr.name === 'AbortError') {
            return { valid: false, errorMessage: `Timeout de verificación superado (${timeoutMs}ms).` };
          }
          return { valid: false, errorMessage: `Error de conexión: ${fetchErr.message}` };
        }
      }

      return { valid: false, errorMessage: 'Demasiadas redirecciones HTTP (> 3).' };
    },
  };
}
