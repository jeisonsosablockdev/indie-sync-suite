/**
 * @file strategic-advisor-chat.tsx
 * @layer Presentation
 * @description Local-first strategic advisor chat interface integrating streaming metrics memory,
 *              contextual prompts, and an irreversible GDPR hard-delete purge action. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React, { useState, useRef, useEffect } from 'react';
import {
  Bot,
  User,
  Send,
  Trash2,
  Sparkles,
  Loader2,
  ShieldCheck,
  PlusCircle,
} from 'lucide-react';
import {
  useStrategicAdvisor,
} from '../../lib/hooks/use-strategic-advisor';

export interface StrategicAdvisorChatProps {
  releaseId: string;
  metricsSnapshot?: unknown;
  className?: string;
}

/**
 * StrategicAdvisorChat presentation component.
 *
 * @param props - Component props including releaseId and optional metrics context
 * @returns JSX Element rendering the conversational advisory interface
 */
export function StrategicAdvisorChat({
  releaseId,
  metricsSnapshot,
  className = '',
}: StrategicAdvisorChatProps): React.JSX.Element {
  // Step 1: Bind application hook
  const {
    messages,
    isGenerating,
    isPurging,
    error,
    sendMessage,
    startNewConversation,
    purgeConversationHistory,
  } = useStrategicAdvisor({ releaseId });

  const [inputPrompt, setInputPrompt] = useState<string>('');
  const [showPurgeConfirm, setShowPurgeConfirm] = useState<boolean>(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);

  // Step 2: Auto-scroll on new messages
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, isGenerating]);

  // Step 3: Handle send message
  const handleSend = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputPrompt.trim() || isGenerating) return;

    const text = inputPrompt;
    setInputPrompt('');
    await sendMessage(text, metricsSnapshot);
  };

  // Step 4: Handle irreversible GDPR purge
  const handlePurge = async () => {
    const success = await purgeConversationHistory();
    if (success) {
      setShowPurgeConfirm(false);
    }
  };

  return (
    <div className={`flex flex-col h-[520px] rounded-xl border border-border/50 bg-card/40 ${className}`}>
      {/* Step 5: Chat Header with Session Actions & GDPR Purge */}
      <div className="flex items-center justify-between p-3.5 border-b border-border/40 bg-card/60 rounded-t-xl">
        <div className="flex items-center gap-2">
          <div className="p-1.5 rounded-lg bg-indigo-500/10 border border-indigo-500/20 text-indigo-500">
            <Sparkles className="h-4 w-4" />
          </div>
          <div>
            <h3 className="text-xs font-bold text-foreground">Asesor Estratégico AI</h3>
            <p className="text-[10px] text-muted-foreground flex items-center gap-1">
              <ShieldCheck className="h-3 w-3 text-emerald-500" />
              Memoria 100% local en SQLite
            </p>
          </div>
        </div>

        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={startNewConversation}
            className="p-1.5 rounded-md hover:bg-muted/50 text-muted-foreground hover:text-foreground text-xs flex items-center gap-1 transition-colors"
            title="Nueva sesión"
          >
            <PlusCircle className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Nueva Consulta</span>
          </button>

          <button
            type="button"
            onClick={() => setShowPurgeConfirm(true)}
            disabled={messages.length === 0 || isPurging}
            className="p-1.5 rounded-md hover:bg-red-500/10 text-muted-foreground hover:text-red-500 text-xs flex items-center gap-1 transition-colors disabled:opacity-30"
            title="Purga irreversible (GDPR)"
          >
            <Trash2 className="h-3.5 w-3.5" />
            <span className="hidden sm:inline">Purgar Memoria</span>
          </button>
        </div>
      </div>

      {/* Step 6: Purge Confirmation Warning Dialog */}
      {showPurgeConfirm && (
        <div className="p-3 bg-red-500/10 border-b border-red-500/30 text-xs text-red-500 flex items-center justify-between gap-2">
          <span>¿Confirmas la eliminación permanente e irreversible de esta conversación?</span>
          <div className="flex items-center gap-1.5 shrink-0">
            <button
              type="button"
              onClick={() => setShowPurgeConfirm(false)}
              className="px-2 py-1 rounded-md border border-border/60 text-foreground hover:bg-background text-[11px]"
            >
              Cancelar
            </button>
            <button
              type="button"
              onClick={() => void handlePurge()}
              disabled={isPurging}
              className="px-2 py-1 rounded-md bg-red-600 text-white font-semibold hover:bg-red-500 text-[11px]"
            >
              {isPurging ? 'Purgando...' : 'Confirmar Purga'}
            </button>
          </div>
        </div>
      )}

      {/* Step 7: Messages Scroll View */}
      <div className="flex-1 overflow-y-auto p-4 space-y-3 text-xs">
        {messages.length === 0 && (
          <div className="h-full flex flex-col items-center justify-center text-center p-6 text-muted-foreground space-y-2">
            <Bot className="h-8 w-8 text-indigo-500/50" />
            <p className="font-medium text-foreground">Tu Asesor de Campaña está listo</p>
            <p className="text-[11px] max-w-xs">
              Pregunta sobre recomendaciones de lanzamiento, optimización de presupuesto o tácticas de streaming basadas en tus métricas.
            </p>
          </div>
        )}

        {messages.map((m) => (
          <div
            key={m.id}
            className={`flex items-start gap-2.5 ${
              m.senderRole === 'USER' ? 'justify-end' : 'justify-start'
            }`}
          >
            {m.senderRole === 'ASSISTANT' && (
              <div className="p-1 rounded-md bg-indigo-500/10 text-indigo-500 shrink-0 mt-0.5">
                <Bot className="h-3.5 w-3.5" />
              </div>
            )}
            <div
              className={`p-3 rounded-xl max-w-[80%] leading-relaxed ${
                m.senderRole === 'USER'
                  ? 'bg-indigo-600 text-white rounded-br-none'
                  : 'bg-muted/50 border border-border/40 text-foreground rounded-bl-none'
              }`}
            >
              {m.content}
            </div>
            {m.senderRole === 'USER' && (
              <div className="p-1 rounded-md bg-muted text-muted-foreground shrink-0 mt-0.5">
                <User className="h-3.5 w-3.5" />
              </div>
            )}
          </div>
        ))}

        {isGenerating && (
          <div className="flex items-center gap-2 text-muted-foreground italic text-[11px]">
            <Loader2 className="h-3.5 w-3.5 animate-spin text-indigo-500" />
            <span>El asesor está analizando el contexto de métricas...</span>
          </div>
        )}

        <div ref={messagesEndRef} />
      </div>

      {/* Step 8: Error Banner */}
      {error && (
        <div className="px-4 py-2 bg-red-500/10 text-xs text-red-500 border-t border-red-500/20">
          {error}
        </div>
      )}

      {/* Step 9: Message Input Form */}
      <form onSubmit={handleSend} className="p-3 border-t border-border/40 bg-card/30 flex items-center gap-2">
        <input
          type="text"
          value={inputPrompt}
          onChange={(e) => setInputPrompt(e.target.value)}
          placeholder="Escribe una consulta estratégica sobre tu lanzamiento..."
          disabled={isGenerating}
          className="flex-1 bg-background/60 border border-border/50 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-indigo-500 disabled:opacity-50"
        />
        <button
          type="submit"
          disabled={!inputPrompt.trim() || isGenerating}
          className="p-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white disabled:opacity-40 transition-colors"
          title="Enviar consulta"
        >
          <Send className="h-4 w-4" />
        </button>
      </form>
    </div>
  );
}
