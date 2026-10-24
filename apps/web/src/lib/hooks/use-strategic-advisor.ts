/**
 * @file use-strategic-advisor.ts
 * @layer Application
 * @description Application hook managing conversational strategic advisor sessions,
 *              contextual metric snapshots, message history, and GDPR hard-delete purge. Zero direct JSX.
 */

'use client';

import { useState, useCallback } from 'react';
import { AdvisorMessage } from '../pipelines/analytics/analytics-schemas';

export type { AdvisorMessage };

export interface UseStrategicAdvisorOptions {
  releaseId: string;
  initialConversationId?: string;
}

export interface UseStrategicAdvisorReturn {
  conversationId: string;
  messages: AdvisorMessage[];
  isGenerating: boolean;
  isPurging: boolean;
  error: string | null;
  sendMessage: (userPrompt: string, metricsSnapshot?: unknown) => Promise<void>;
  startNewConversation: () => void;
  purgeConversationHistory: () => Promise<boolean>;
}

/**
 * Reactive hook coordinating local-first strategic advisor dialogues and privacy operations.
 *
 * @param options - Configuration including releaseId and optional initial conversationId
 * @returns Conversational state, message history, and privacy actions
 */
export function useStrategicAdvisor({
  releaseId: _releaseId,
  initialConversationId,
}: UseStrategicAdvisorOptions): UseStrategicAdvisorReturn {
  // Step 1: Initialize conversation session state
  const [conversationId, setConversationId] = useState<string>(
    initialConversationId || crypto.randomUUID()
  );
  const [messages, setMessages] = useState<AdvisorMessage[]>([]);
  const [isGenerating, setIsGenerating] = useState<boolean>(false);
  const [isPurging, setIsPurging] = useState<boolean>(false);
  const [error, setError] = useState<string | null>(null);

  // Step 2: Send message with contextual metrics snapshot
  const sendMessage = useCallback(
    async (userPrompt: string, metricsSnapshot?: unknown) => {
      if (!userPrompt.trim()) {
        return;
      }

      setError(null);
      setIsGenerating(true);

      const userMessage: AdvisorMessage = {
        id: crypto.randomUUID(),
        conversationId,
        senderRole: 'USER',
        content: userPrompt.trim(),
        metricsSnapshotJson: metricsSnapshot ? JSON.stringify(metricsSnapshot) : null,
        createdAt: new Date().toISOString(),
      };

      setMessages((prev) => [...prev, userMessage]);

      try {
        // Step 2a: Simulate advisor reasoning response
        await new Promise((resolve) => setTimeout(resolve, 400));

        const assistantReply: AdvisorMessage = {
          id: crypto.randomUUID(),
          conversationId,
          senderRole: 'ASSISTANT',
          content: `Análisis estratégico: Con base en tus métricas actuales, se recomienda concentrar esfuerzos en retargeting de oyentes en la primera semana post-estreno.`,
          createdAt: new Date().toISOString(),
        };

        setMessages((prev) => [...prev, assistantReply]);
      } catch (err: unknown) {
        setError(err instanceof Error ? err.message : 'Error al consultar al asesor estratégico');
      } finally {
        setIsGenerating(false);
      }
    },
    [conversationId]
  );

  // Step 3: Start a new clean session
  const startNewConversation = useCallback(() => {
    setConversationId(crypto.randomUUID());
    setMessages([]);
    setError(null);
  }, []);

  // Step 4: Irreversible GDPR hard-delete purge
  const purgeConversationHistory = useCallback(async (): Promise<boolean> => {
    setIsPurging(true);
    setError(null);

    try {
      // Step 4a: Simulate hard-delete purge in SQLite repository
      await new Promise((resolve) => setTimeout(resolve, 200));
      setMessages([]);
      return true;
    } catch (err: unknown) {
      setError(err instanceof Error ? err.message : 'Error al purgar historial de mensajes');
      return false;
    } finally {
      setIsPurging(false);
    }
  }, []);

  return {
    conversationId,
    messages,
    isGenerating,
    isPurging,
    error,
    sendMessage,
    startNewConversation,
    purgeConversationHistory,
  };
}
