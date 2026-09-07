/**
 * @file use-guardrail-confirmation.ts
 * @layer Application
 * @description React hook connecting UI components to the suspended promises in GuardrailInterceptor.
 */

'use client';

import { useState, useEffect, useCallback } from 'react';
import {
  GuardrailInterceptor,
  PendingConfirmationView,
} from '../pipelines/agent/guardrails/guardrail-interceptor';

// Global singleton instance for UI session
let defaultInterceptorInstance: GuardrailInterceptor | null = null;

export function getGuardrailInterceptor(): GuardrailInterceptor {
  if (!defaultInterceptorInstance) {
    defaultInterceptorInstance = new GuardrailInterceptor();
  }
  return defaultInterceptorInstance;
}

export function useGuardrailConfirmation(customInterceptor?: GuardrailInterceptor) {
  const interceptor = customInterceptor || getGuardrailInterceptor();
  const [pending, setPending] = useState<PendingConfirmationView[]>(interceptor.getPending());

  useEffect(() => {
    const unsubscribe = interceptor.onPendingChange(() => {
      setPending(interceptor.getPending());
    });
    return unsubscribe;
  }, [interceptor]);

  const approve = useCallback(
    async (actionId: string, user?: string) => {
      return interceptor.approve(actionId, user || 'usuario-web');
    },
    [interceptor]
  );

  const reject = useCallback(
    async (actionId: string, reason?: string) => {
      return interceptor.reject(actionId, reason || 'Rechazado por el usuario');
    },
    [interceptor]
  );

  return {
    pending,
    hasPending: pending.length > 0,
    currentAction: pending[0] || null,
    approve,
    reject,
  };
}
