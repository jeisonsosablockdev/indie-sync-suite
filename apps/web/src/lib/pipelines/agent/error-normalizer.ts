/**
 * @file error-normalizer.ts
 * @layer Domain
 * @description Translates raw LLM provider API exceptions into user-friendly localized messages with recovery recommendations.
 */

export type AiErrorCategory =
  | 'invalid_key'
  | 'rate_limit_or_quota'
  | 'provider_overloaded'
  | 'security_violation'
  | 'timeout'
  | 'unknown';

export interface NormalizedAiError {
  category: AiErrorCategory;
  userMessage: string;
  technicalDetails?: string;
  retryable: boolean;
}

/**
 * Normalizes raw API errors across OpenAI, Anthropic, Google, and Groq into friendly domain errors.
 *
 * @param error - Raw caught error object or message
 * @param provider - Name of provider where error occurred
 * @returns NormalizedAiError object
 */
export function normalizeAiError(error: any, provider?: string): NormalizedAiError {
  const message = error?.message || (typeof error === 'string' ? error : 'Error desconocido');
  const status = error?.status || error?.statusCode || 0;
  const lowerMsg = message.toLowerCase();

  // 1. Security Violation (SSRF)
  if (lowerMsg.includes('ssrf') || lowerMsg.includes('rechazada por seguridad')) {
    return {
      category: 'security_violation',
      userMessage: 'La dirección de red o endpoint del modelo fue bloqueada por medidas de seguridad.',
      technicalDetails: message,
      retryable: false,
    };
  }

  // 2. Invalid or Expired Credential (401 / 403)
  if (
    status === 401 ||
    status === 403 ||
    lowerMsg.includes('unauthorized') ||
    lowerMsg.includes('invalid_api_key') ||
    lowerMsg.includes('authentication')
  ) {
    return {
      category: 'invalid_key',
      userMessage: `La clave de API para ${provider || 'el proveedor'} es inválida o ha sido revocada. Actualízala en la consola BYOK.`,
      technicalDetails: message,
      retryable: false,
    };
  }

  // 3. Rate Limits or Exhausted Quotas (429)
  if (
    status === 429 ||
    lowerMsg.includes('rate limit') ||
    lowerMsg.includes('quota') ||
    lowerMsg.includes('insufficient_quota')
  ) {
    return {
      category: 'rate_limit_or_quota',
      userMessage: `Has alcanzado el límite de cuota o peticiones en ${provider || 'este proveedor'}. Intenta nuevamente en unos instantes o selecciona otro modelo.`,
      technicalDetails: message,
      retryable: true,
    };
  }

  // 4. Timeout / Abort
  if (
    error?.name === 'AbortError' ||
    lowerMsg.includes('timeout') ||
    lowerMsg.includes('aborted')
  ) {
    return {
      category: 'timeout',
      userMessage: 'La petición al modelo tardó demasiado tiempo en responder y fue cancelada.',
      technicalDetails: message,
      retryable: true,
    };
  }

  // 5. Provider Overload / Server Error (500, 502, 503, 504)
  if (
    status >= 500 ||
    lowerMsg.includes('overloaded') ||
    lowerMsg.includes('bad gateway') ||
    lowerMsg.includes('service unavailable')
  ) {
    return {
      category: 'provider_overloaded',
      userMessage: `Los servidores de ${provider || 'la IA'} se encuentran saturados en este momento. Por favor reintenta en breve.`,
      technicalDetails: message,
      retryable: true,
    };
  }

  // 6. Generic Fallback
  return {
    category: 'unknown',
    userMessage: 'Ocurrió un error inesperado al procesar la solicitud con el modelo.',
    technicalDetails: message,
    retryable: true,
  };
}
