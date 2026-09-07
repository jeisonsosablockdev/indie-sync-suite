/**
 * @file ssrf-validator.ts
 * @layer Domain
 * @description Strict Server-Side Request Forgery (SSRF) validation guard for custom AI model base URLs.
 */

export interface SsrValidationResult {
  valid: boolean;
  reason?: string;
}

const BLOCKED_HOSTS: readonly string[] = [
  '169.254.169.254', // AWS / Azure / GCP Link-Local Metadata Service
  'metadata.google.internal', // GCP Metadata DNS
  '100.100.100.200', // Alibaba Cloud Metadata
  '0.0.0.0',
];

/**
 * Checks if an IPv4 address belongs to RFC 1918 private subnets.
 *
 * @param ip - IPv4 string
 * @returns True if private, false otherwise
 */
function isPrivateRfc1918(ip: string): boolean {
  const parts = ip.split('.').map(p => parseInt(p, 10));
  if (parts.length !== 4 || parts.some(isNaN)) return false;

  // 10.0.0.0/8
  if (parts[0] === 10) return true;

  // 172.16.0.0/12
  if (parts[0] === 172 && parts[1] >= 16 && parts[1] <= 31) return true;

  // 192.168.0.0/16
  if (parts[0] === 192 && parts[1] === 168) return true;

  return false;
}

/**
 * Validates a custom model base URL against SSRF vulnerabilities.
 *
 * Rules:
 * 1. Protocol must be HTTPS or HTTP.
 * 2. If HTTP is used, host must be strictly loopback ('localhost' or '127.0.0.1' or '[::1]') for local Ollama.
 * 3. Never allow cloud metadata IPs (169.254.169.254).
 * 4. Never allow private RFC 1918 IPs over HTTP.
 *
 * @param rawUrl - Custom baseURL string to validate
 * @returns SsrValidationResult indicating validity and reason if invalid
 */
export function validateBaseUrl(rawUrl: string): SsrValidationResult {
  if (!rawUrl || typeof rawUrl !== 'string') {
    return { valid: false, reason: 'URL vacía o no proporcionada' };
  }

  let parsed: URL;
  try {
    parsed = new URL(rawUrl);
  } catch {
    return { valid: false, reason: 'URL malformada' };
  }

  const protocol = parsed.protocol.toLowerCase();
  const hostname = parsed.hostname.toLowerCase();

  // Rule 1: Protocol whitelist
  if (protocol !== 'https:' && protocol !== 'http:') {
    return { valid: false, reason: `Protocolo no permitido: "${protocol}". Solo se admiten HTTPS o HTTP local` };
  }

  // Rule 2: Block known cloud metadata targets unconditionally
  if (BLOCKED_HOSTS.includes(hostname)) {
    return { valid: false, reason: 'Acceso a endpoints de metadatos de nube bloqueado por seguridad (SSRF)' };
  }

  // Rule 3: Enforce HTTPS for non-loopback endpoints
  const isLoopback = hostname === 'localhost' || hostname === '127.0.0.1' || hostname === '[::1]';

  if (protocol === 'http:' && !isLoopback) {
    return {
      valid: false,
      reason: 'Endpoints HTTP no seguros solo están permitidos para loopback local (localhost o 127.0.0.1). Usa HTTPS para hosts remotos',
    };
  }

  // Rule 4: Block private RFC 1918 subnets over HTTP
  if (protocol === 'http:' && isPrivateRfc1918(hostname)) {
    return { valid: false, reason: 'Dirección de red privada interna bloqueada por política anti-SSRF' };
  }

  return { valid: true };
}
