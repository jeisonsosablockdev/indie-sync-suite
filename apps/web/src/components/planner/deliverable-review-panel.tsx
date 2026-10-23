/**
 * @file deliverable-review-panel.tsx
 * @layer Presentation
 * @description Accessible review panel for creative deliverables (Artworks, Teasers, Press Releases)
 *              with mandatory rejection feedback validation (>= 10 chars) and audit trail.
 */

'use client';

import React, { useState } from 'react';
import {
  DeliverableStatus,
  ReviewDeliverablePayload,
} from '../../lib/pipelines/planner/deliverable-state-machine';
import {
  TaskDeliverable,
  DeliverableFeedback,
} from '../../lib/infrastructure/db/repositories/sqlite-deliverable-repository';

export interface DeliverableReviewPanelProps {
  deliverable: TaskDeliverable;
  feedbacks?: DeliverableFeedback[];
  canReview?: boolean;
  onTransition?: (payload: ReviewDeliverablePayload) => Promise<void>;
}

const STATUS_BADGES: Record<DeliverableStatus, { bg: string; text: string; label: string }> = {
  DRAFT: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', label: 'Borrador' },
  IN_REVIEW: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-800 dark:text-amber-300', label: 'En Revisión' },
  APPROVED: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-800 dark:text-emerald-300', label: 'Aprobado' },
  REJECTED: { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-800 dark:text-rose-300', label: 'Rechazado' },
};

export function DeliverableReviewPanel({
  deliverable,
  feedbacks = [],
  canReview = true,
  onTransition,
}: DeliverableReviewPanelProps) {
  const [rejecting, setRejecting] = useState(false);
  const [rejectionReason, setRejectionReason] = useState('');
  const [rejectionError, setRejectionError] = useState<string | null>(null);
  const [isSubmitting, setIsSubmitting] = useState(false);

  const statusMeta = STATUS_BADGES[deliverable.status as DeliverableStatus] || STATUS_BADGES.DRAFT;

  const handleApprove = async () => {
    if (!onTransition) return;
    setIsSubmitting(true);
    try {
      await onTransition({ action: 'APPROVE', comment: 'Entregable aprobado conforme a directrices de marca.' });
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleRejectConfirm = async () => {
    if (rejectionReason.trim().length < 10) {
      setRejectionError('El motivo de rechazo debe contener al menos 10 caracteres.');
      return;
    }
    if (!onTransition) return;

    setIsSubmitting(true);
    try {
      await onTransition({ action: 'REJECT', rejectionReason: rejectionReason.trim() });
      setRejecting(false);
      setRejectionReason('');
      setRejectionError(null);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleSubmitForReview = async () => {
    if (!onTransition) return;
    setIsSubmitting(true);
    try {
      await onTransition({ action: 'SUBMIT_FOR_REVIEW' });
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <div
      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6 shadow-sm"
      data-testid="deliverable-review-panel"
    >
      {/* Step 1: Deliverable Header */}
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            {deliverable.title}
          </h3>
          <a
            href={deliverable.assetUrl}
            target="_blank"
            rel="noopener noreferrer"
            className="text-xs text-indigo-600 dark:text-indigo-400 hover:underline mt-0.5 inline-block font-mono"
          >
            {deliverable.assetUrl} ↗
          </a>
        </div>

        <span
          className={`px-3 py-1 rounded-full text-xs font-semibold ${statusMeta.bg} ${statusMeta.text}`}
          data-testid="deliverable-status-badge"
        >
          {statusMeta.label}
        </span>
      </div>

      {/* Step 2: Rejection Reason Alert if REJECTED */}
      {deliverable.status === 'REJECTED' && deliverable.rejectionReason && (
        <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900/50 text-xs text-rose-800 dark:text-rose-200 space-y-1">
          <span className="font-bold">Motivo del Rechazo:</span>
          <p>{deliverable.rejectionReason}</p>
        </div>
      )}

      {/* Step 3: Review Actions */}
      <div className="flex items-center gap-3">
        {(deliverable.status === 'DRAFT' || deliverable.status === 'REJECTED') && (
          <button
            type="button"
            disabled={isSubmitting}
            onClick={handleSubmitForReview}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition disabled:opacity-50"
            data-testid="submit-review-btn"
          >
            Enviar a Revisión
          </button>
        )}

        {deliverable.status === 'IN_REVIEW' && canReview && !rejecting && (
          <>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleApprove}
              className="px-4 py-2 text-xs font-semibold rounded-lg bg-emerald-600 hover:bg-emerald-700 text-white transition disabled:opacity-50"
              data-testid="approve-deliverable-btn"
            >
              Aprobar Entregable
            </button>
            <button
              type="button"
              disabled={isSubmitting}
              onClick={() => setRejecting(true)}
              className="px-4 py-2 text-xs font-semibold rounded-lg border border-rose-300 dark:border-rose-800 text-rose-700 dark:text-rose-300 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition"
              data-testid="start-reject-btn"
            >
              Solicitar Corrección / Rechazar
            </button>
          </>
        )}
      </div>

      {/* Step 4: Rejection Feedback Form (Enforcing >= 10 chars) */}
      {rejecting && (
        <div className="p-4 rounded-xl border border-rose-200 dark:border-rose-900/60 bg-rose-50/30 dark:bg-rose-950/20 space-y-3">
          <label className="block text-xs font-semibold text-rose-900 dark:text-rose-200">
            Explica detalladamente las correcciones requeridas (mínimo 10 caracteres):
          </label>
          <textarea
            value={rejectionReason}
            onChange={e => {
              setRejectionReason(e.target.value);
              if (rejectionError) setRejectionError(null);
            }}
            rows={3}
            className="w-full text-xs p-3 rounded-lg border border-rose-300 dark:border-rose-800 bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 focus:outline-none focus:ring-2 focus:ring-rose-500"
            placeholder="Ejemplo: La tipografía utilizada no corresponde a la paleta aprobada en el Brand Vault..."
            data-testid="rejection-reason-input"
          />
          {rejectionError && <p className="text-[11px] text-rose-600">{rejectionError}</p>}
          <div className="flex items-center gap-2">
            <button
              type="button"
              disabled={isSubmitting}
              onClick={handleRejectConfirm}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg bg-rose-600 hover:bg-rose-700 text-white transition disabled:opacity-50"
              data-testid="confirm-reject-btn"
            >
              Enviar Rechazo
            </button>
            <button
              type="button"
              onClick={() => {
                setRejecting(false);
                setRejectionError(null);
              }}
              className="px-3.5 py-1.5 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
            >
              Cancelar
            </button>
          </div>
        </div>
      )}

      {/* Step 5: Chronological Feedback Audit History */}
      {feedbacks.length > 0 && (
        <div className="pt-4 border-t border-zinc-100 dark:border-zinc-800 space-y-3">
          <h4 className="text-xs font-bold uppercase tracking-wider text-zinc-500">
            Historial de Feedback y Revisiones ({feedbacks.length}):
          </h4>
          <div className="space-y-2">
            {feedbacks.map(f => (
              <div
                key={f.id}
                className="p-3 rounded-lg bg-zinc-50 dark:bg-zinc-950 border border-zinc-200 dark:border-zinc-800 text-xs space-y-1"
              >
                <div className="flex items-center justify-between text-[11px] text-zinc-400">
                  <span className="font-semibold text-zinc-700 dark:text-zinc-300">
                    {f.authorRole === 'LABEL_MANAGER' ? '🏢 Label Manager' : '🎨 Artista'}
                  </span>
                  <span>{new Date(f.createdAt).toLocaleString('es-ES')}</span>
                </div>
                <p className="text-zinc-700 dark:text-zinc-300">{f.comment}</p>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}
