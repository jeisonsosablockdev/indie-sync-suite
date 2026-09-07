/**
 * @file guardrail-modal.tsx
 * @layer Presentation
 * @description Accessible Human-in-the-Loop modal rendering structured JSON diffs for SENSITIVE tool approvals.
 */

'use client';

import React, { useState } from 'react';
import { useGuardrailConfirmation } from '../../lib/hooks/use-guardrail-confirmation';
import { PendingConfirmationView } from '../../lib/pipelines/agent/guardrails/guardrail-interceptor';

interface GuardrailModalProps {
  action?: PendingConfirmationView | null;
  onApprove?: (actionId: string) => Promise<void>;
  onReject?: (actionId: string) => Promise<void>;
}

export function GuardrailModal({ action: propAction, onApprove, onReject }: GuardrailModalProps) {
  const { currentAction: hookAction, approve: hookApprove, reject: hookReject } = useGuardrailConfirmation();
  const [isProcessing, setIsProcessing] = useState(false);

  const activeAction = propAction !== undefined ? propAction : hookAction;

  if (!activeAction) {
    return null;
  }

  const handleApprove = async () => {
    setIsProcessing(true);
    try {
      if (onApprove) {
        await onApprove(activeAction.id);
      } else {
        await hookApprove(activeAction.id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  const handleReject = async () => {
    setIsProcessing(true);
    try {
      if (onReject) {
        await onReject(activeAction.id);
      } else {
        await hookReject(activeAction.id);
      }
    } finally {
      setIsProcessing(false);
    }
  };

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs animate-in fade-in duration-200"
      role="dialog"
      aria-modal="true"
      aria-labelledby="guardrail-title"
      data-testid="guardrail-modal"
    >
      <div className="w-full max-w-lg rounded-xl border border-amber-500/30 bg-white dark:bg-zinc-900 shadow-2xl overflow-hidden">
        {/* Header with warning badge */}
        <div className="p-5 border-b border-zinc-100 dark:border-zinc-800 flex items-center justify-between bg-amber-50/50 dark:bg-amber-950/20">
          <div className="flex items-center gap-2.5">
            <span className="flex h-2.5 w-2.5 rounded-full bg-amber-500 animate-ping" />
            <h3 id="guardrail-title" className="text-base font-bold text-zinc-900 dark:text-zinc-100">
              Confirmación de Acción Requerida
            </h3>
          </div>
          <span className="px-2 py-0.5 text-[10px] font-mono font-bold tracking-wider uppercase rounded bg-amber-200 dark:bg-amber-900/60 text-amber-800 dark:text-amber-300">
            SENSITIVE
          </span>
        </div>

        {/* Content Body */}
        <div className="p-5 space-y-4">
          <p className="text-sm text-zinc-700 dark:text-zinc-300 leading-relaxed">
            {activeAction.confirmationMessage}
          </p>

          <div>
            <div className="flex items-center justify-between mb-1.5">
              <span className="text-xs font-semibold text-zinc-500 uppercase tracking-wider">
                Herramienta: <span className="font-mono text-zinc-900 dark:text-zinc-100 font-bold">{activeAction.toolName}</span>
              </span>
              <span className="text-[10px] text-zinc-400">Snapshot de Parámetros JSON</span>
            </div>

            {/* Structured JSON Parameter Diff View */}
            <div className="rounded-lg bg-zinc-950 border border-zinc-800 p-3 overflow-x-auto max-h-48 text-xs font-mono text-emerald-400">
              <pre>{JSON.stringify(activeAction.params, null, 2)}</pre>
            </div>
          </div>

          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 italic">
            Esta acción modificará la base de datos o el estado del proyecto. Tienes 5 minutos antes de que la petición expire automáticamente.
          </p>
        </div>

        {/* Footer Actions */}
        <div className="p-4 border-t border-zinc-100 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-900/50 flex justify-end gap-3">
          <button
            type="button"
            onClick={handleReject}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-medium rounded-md border border-zinc-300 dark:border-zinc-700 text-zinc-700 dark:text-zinc-300 hover:bg-zinc-100 dark:hover:bg-zinc-800 transition disabled:opacity-50"
          >
            Rechazar Acción
          </button>
          <button
            type="button"
            onClick={handleApprove}
            disabled={isProcessing}
            className="px-4 py-2 text-xs font-semibold rounded-md bg-emerald-600 hover:bg-emerald-500 text-white transition disabled:opacity-50 flex items-center gap-1.5"
          >
            {isProcessing ? 'Ejecutando...' : 'Aprobar y Ejecutar'}
          </button>
        </div>
      </div>
    </div>
  );
}
