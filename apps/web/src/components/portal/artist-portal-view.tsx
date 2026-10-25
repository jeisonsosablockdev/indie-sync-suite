/**
 * @file artist-portal-view.tsx
 * @layer Presentation
 * @description Mobile-first, lightweight review portal for artists and collaborators:
 *              master audio preview, deliverable inspection, and 1-tap approval/adjustments. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React, { useState } from 'react';
import {
  Play,
  Pause,
  CheckCircle2,
  AlertCircle,
  FileText,
  Image as ImageIcon,
  Music,
  Send,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  useArtistPortal,
  PortalDeliverableItem,
  PortalReviewDecision,
} from '../../lib/hooks/use-artist-portal';

export interface ArtistPortalViewProps {
  token: string;
  className?: string;
}

/**
 * ArtistPortalView presentation component.
 *
 * @param props - Component props containing Magic Link token
 * @returns JSX Element rendering the mobile artist review portal
 */
export function ArtistPortalView({
  token,
  className = '',
}: ArtistPortalViewProps): React.JSX.Element {
  // Step 1: Bind application hook
  const {
    isValidToken,
    isLoading,
    artistName,
    releaseTitle,
    audioMasterUrl,
    deliverables,
    isSubmitting,
    error,
    submitReview,
  } = useArtistPortal({ token });

  const [isPlayingAudio, setIsPlayingAudio] = useState<boolean>(false);
  const [activeFeedbackId, setActiveFeedbackId] = useState<string | null>(null);
  const [feedbackText, setFeedbackText] = useState<string>('');

  if (!isValidToken) {
    return (
      <div className="p-8 max-w-md mx-auto text-center space-y-3">
        <AlertCircle className="h-10 w-10 text-red-500 mx-auto" />
        <h2 className="text-base font-bold text-foreground">Enlace Expirado o Inválido</h2>
        <p className="text-xs text-muted-foreground">
          Este Magic Link ha expirado o ha sido revocado. Contacta a tu Label Manager para solicitar un nuevo acceso.
        </p>
      </div>
    );
  }

  // Step 2: Handle 1-tap review action
  const handleAction = async (deliverableId: string, decision: PortalReviewDecision) => {
    await submitReview(deliverableId, decision, feedbackText);
    setActiveFeedbackId(null);
    setFeedbackText('');
  };

  return (
    <div className={`max-w-md mx-auto p-4 space-y-6 ${className}`}>
      {/* Step 3: Portal Header */}
      <div className="text-center space-y-1 border-b border-border/40 pb-4">
        <span className="text-[10px] font-bold uppercase tracking-wider text-indigo-500 bg-indigo-500/10 px-2.5 py-0.5 rounded-full">
          Portal del Artista
        </span>
        <h1 className="text-xl font-black text-foreground pt-1">{releaseTitle}</h1>
        <p className="text-xs text-muted-foreground">Revisión para {artistName}</p>
      </div>

      {/* Step 4: Master Audio Player Preview Card */}
      {audioMasterUrl && (
        <div className="p-4 rounded-xl border border-indigo-500/30 bg-indigo-500/5 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Music className="h-4 w-4 text-indigo-500" />
              <span className="text-xs font-bold text-foreground">Audio Master Oficial</span>
            </div>
            <span className="text-[10px] text-muted-foreground font-mono">Alta Fidelidad</span>
          </div>

          <div className="flex items-center gap-3">
            <button
              type="button"
              onClick={() => setIsPlayingAudio((prev) => !prev)}
              className="p-3 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white shadow-md transition-transform active:scale-95"
              title={isPlayingAudio ? 'Pausar' : 'Reproducir'}
            >
              {isPlayingAudio ? <Pause className="h-5 w-5" /> : <Play className="h-5 w-5 ml-0.5" />}
            </button>
            <div className="flex-1 space-y-1">
              <div className="h-1.5 w-full bg-indigo-200/20 rounded-full overflow-hidden">
                <div
                  className={`h-full bg-indigo-500 rounded-full ${
                    isPlayingAudio ? 'w-2/3 transition-all duration-1000' : 'w-0'
                  }`}
                />
              </div>
              <p className="text-[10px] text-muted-foreground">
                {isPlayingAudio ? 'Reproduciendo audio del máster...' : 'Toca reproducir para escuchar'}
              </p>
            </div>
          </div>
        </div>
      )}

      {/* Step 5: Deliverables Review Section */}
      <div className="space-y-4">
        <h3 className="text-xs font-bold uppercase tracking-wider text-muted-foreground flex items-center gap-1.5">
          <Sparkles className="h-3.5 w-3.5 text-indigo-500" />
          Entregables para Aprobación
        </h3>

        {isLoading ? (
          <div className="flex items-center justify-center p-8 gap-2 text-xs text-muted-foreground">
            <Loader2 className="h-4 w-4 animate-spin text-indigo-500" />
            <span>Cargando entregables...</span>
          </div>
        ) : (
          deliverables.map((item: PortalDeliverableItem) => (
            <div
              key={item.id}
              className="p-4 rounded-xl border border-border/50 bg-card/40 space-y-3"
            >
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  {item.type === 'COVER_ART' && <ImageIcon className="h-4 w-4 text-purple-500" />}
                  {item.type === 'COPY' && <FileText className="h-4 w-4 text-blue-500" />}
                  {item.type === 'AUDIO' && <Music className="h-4 w-4 text-emerald-500" />}
                  <span className="text-xs font-semibold text-foreground">{item.title}</span>
                </div>

                <span
                  className={`px-2 py-0.5 rounded-full text-[10px] font-bold ${
                    item.status === 'APPROVED'
                      ? 'bg-emerald-500/10 text-emerald-500'
                      : item.status === 'CHANGES_REQUESTED'
                      ? 'bg-amber-500/10 text-amber-500'
                      : 'bg-muted text-muted-foreground'
                  }`}
                >
                  {item.status === 'APPROVED'
                    ? 'Aprobado'
                    : item.status === 'CHANGES_REQUESTED'
                    ? 'Ajustes Pedidos'
                    : 'Pendiente'}
                </span>
              </div>

              {/* Action Buttons */}
              <div className="flex items-center gap-2 pt-1">
                <button
                  type="button"
                  onClick={() => void handleAction(item.id, 'APPROVED')}
                  disabled={isSubmitting || item.status === 'APPROVED'}
                  className="flex-1 py-2 px-3 rounded-lg bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-semibold flex items-center justify-center gap-1.5 disabled:opacity-50 transition-colors"
                >
                  <CheckCircle2 className="h-3.5 w-3.5" />
                  <span>Aprobar</span>
                </button>

                <button
                  type="button"
                  onClick={() =>
                    setActiveFeedbackId(activeFeedbackId === item.id ? null : item.id)
                  }
                  disabled={isSubmitting}
                  className="flex-1 py-2 px-3 rounded-lg border border-border/60 hover:bg-muted/50 text-foreground text-xs font-semibold flex items-center justify-center gap-1.5 transition-colors"
                >
                  <Send className="h-3.5 w-3.5" />
                  <span>Pedir Ajuste</span>
                </button>
              </div>

              {/* Feedback Input Drawer */}
              {activeFeedbackId === item.id && (
                <div className="pt-2 space-y-2 border-t border-border/30">
                  <textarea
                    value={feedbackText}
                    onChange={(e) => setFeedbackText(e.target.value)}
                    placeholder="Describe los cambios o sugerencias que necesitas..."
                    className="w-full bg-background/80 border border-border/60 rounded-lg p-2.5 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
                    rows={2}
                  />
                  <div className="flex justify-end gap-2">
                    <button
                      type="button"
                      onClick={() => setActiveFeedbackId(null)}
                      className="px-2.5 py-1 text-[11px] text-muted-foreground hover:text-foreground"
                    >
                      Cancelar
                    </button>
                    <button
                      type="button"
                      onClick={() => void handleAction(item.id, 'CHANGES_REQUESTED')}
                      disabled={!feedbackText.trim() || isSubmitting}
                      className="px-3 py-1 bg-amber-600 hover:bg-amber-500 text-white text-[11px] font-semibold rounded-md disabled:opacity-50"
                    >
                      Enviar Ajuste
                    </button>
                  </div>
                </div>
              )}
            </div>
          ))
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/20 rounded-lg text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
