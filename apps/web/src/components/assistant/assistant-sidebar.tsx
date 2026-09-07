/**
 * @file apps/web/src/components/assistant/assistant-sidebar.tsx
 * @layer Layer 1: Presentation
 * @description Motion 12 animated collapsible Assistant Sidebar drawer with chat interface, keyboard shortcuts, and guardrail modal integration.
 */

"use client";

import React, { useState } from "react";
import { motion, AnimatePresence } from "motion/react";
import { ChatMessageList, type ChatMessage } from "./chat-message-list";
import { GuardrailModal } from "./guardrail-modal";

export interface PendingActionSnapshot {
  id: string;
  toolName: string;
  confirmationMessage: string;
  params: Record<string, any>;
  createdAt: number;
}

export interface AssistantSidebarProps {
  isOpen: boolean;
  onClose: () => void;
  onToggle: () => void;
  messages: ChatMessage[];
  onSendMessage: (content: string) => void | Promise<void>;
  isStreaming?: boolean;
  pendingAction?: PendingActionSnapshot | null;
  onApproveAction?: (id: string) => Promise<void>;
  onRejectAction?: (id: string) => Promise<void>;
}

/**
 * Slide-out Assistant Sidebar console powered by Motion 12 with chat, streaming, and Human-in-the-Loop guardrails.
 *
 * @param props - Component properties for sidebar open state, messages, handlers, and guardrail confirmations.
 * @returns JSX Element.
 */
export function AssistantSidebar({
  isOpen,
  onClose,
  onToggle,
  messages,
  onSendMessage,
  isStreaming = false,
  pendingAction = null,
  onApproveAction,
  onRejectAction,
}: AssistantSidebarProps): React.JSX.Element {
  // Step 1: Input message local state
  const [inputValue, setInputValue] = useState("");

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    const trimmed = inputValue.trim();
    if (!trimmed || isStreaming) return;
    onSendMessage(trimmed);
    setInputValue("");
  };

  return (
    <>
      {/* Step 2: Floating Trigger Button when closed */}
      {!isOpen && (
        <button
          type="button"
          onClick={onToggle}
          aria-label="Abrir asistente"
          className="fixed bottom-6 right-6 z-40 flex items-center gap-2 px-4 py-2.5 rounded-full bg-indigo-600 hover:bg-indigo-500 text-white font-medium text-sm shadow-xl shadow-indigo-500/20 transition-all cursor-pointer"
        >
          <span>Asistente Creativo</span>
          <span className="text-[11px] px-1.5 py-0.5 rounded bg-indigo-800 text-indigo-200 font-mono">
            ⌘K
          </span>
        </button>
      )}

      {/* Step 3: Motion 12 Drawer Panel */}
      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop for small screens */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 z-40 bg-black/60 backdrop-blur-sm md:hidden"
              aria-hidden="true"
            />

            {/* Sidebar Container */}
            <motion.aside
              aria-label="Panel del Asistente Creativo"
              role="dialog"
              aria-modal="true"
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "spring", damping: 25, stiffness: 220 }}
              className="fixed top-0 right-0 z-50 flex flex-col h-full w-full sm:w-[420px] bg-zinc-900 border-l border-zinc-800 shadow-2xl"
            >
              {/* Step 3.1: Header */}
              <div className="flex items-center justify-between px-4 py-3 border-b border-zinc-800 bg-zinc-900/80">
                <div className="flex items-center gap-2">
                  <div className="w-2.5 h-2.5 rounded-full bg-emerald-500 animate-pulse" />
                  <h2 className="text-sm font-semibold text-zinc-100">
                    Asistente Creativo
                  </h2>
                </div>
                <button
                  type="button"
                  onClick={onClose}
                  aria-label="Cerrar asistente"
                  className="p-1.5 rounded-lg text-zinc-400 hover:text-zinc-200 hover:bg-zinc-800 transition-colors"
                >
                  <span className="text-lg leading-none">&times;</span>
                </button>
              </div>

              {/* Step 3.2: Message List */}
              <div className="flex-1 overflow-y-auto min-h-0">
                <ChatMessageList messages={messages} isStreaming={isStreaming} />
              </div>

              {/* Step 3.3: Chat Input Form */}
              <form
                onSubmit={handleSubmit}
                className="p-3 border-t border-zinc-800 bg-zinc-950/60 flex items-center gap-2"
              >
                <input
                  type="text"
                  value={inputValue}
                  onChange={(e) => setInputValue(e.target.value)}
                  placeholder="Escribe tu respuesta o pregunta sobre tu marca..."
                  disabled={isStreaming}
                  className="flex-1 px-3 py-2 rounded-lg bg-zinc-900 border border-zinc-700 text-sm text-zinc-100 placeholder-zinc-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
                <button
                  type="submit"
                  disabled={!inputValue.trim() || isStreaming}
                  aria-label="Enviar"
                  className="px-3.5 py-2 rounded-lg bg-indigo-600 hover:bg-indigo-500 disabled:opacity-40 disabled:cursor-not-allowed text-sm font-medium text-white transition-colors"
                >
                  Enviar
                </button>
              </form>
            </motion.aside>
          </>
        )}
      </AnimatePresence>

      {/* Step 4: Guardrail Modal for sensitive tool calls */}
      {pendingAction && (
        <GuardrailModal
          action={pendingAction}
          onApprove={onApproveAction}
          onReject={onRejectAction}
        />
      )}
    </>
  );
}
