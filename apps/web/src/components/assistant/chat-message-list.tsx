/**
 * @file apps/web/src/components/assistant/chat-message-list.tsx
 * @layer Layer 1: Presentation
 * @description Chat message stream renderer with role-based bubbles, streaming indicator, and inline tool execution badges.
 */

"use client";

import React, { useEffect, useRef } from "react";
import { ToolCallBadge, ToolStatus } from "./tool-call-badge";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant" | "system" | "tool";
  content: string;
  toolCall?: {
    toolName: string;
    status: ToolStatus;
    error?: string;
  };
  timestamp?: number;
}

export interface ChatMessageListProps {
  messages: ChatMessage[];
  isStreaming?: boolean;
  emptyMessage?: string;
  className?: string;
}

/**
 * Renders an accessible, scrollable list of chat messages with role-specific styling,
 * tool status badges, and an active streaming pulse indicator.
 *
 * @param props - List of chat messages, streaming state, and empty placeholder message.
 * @returns JSX Element.
 */
export function ChatMessageList({
  messages,
  isStreaming = false,
  emptyMessage = "Inicia una conversación socrática para sintetizar tu marca musical.",
  className = "",
}: ChatMessageListProps): React.JSX.Element {
  // Step 1: Scroll anchor reference for automatic scrolling on new tokens
  const bottomRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (typeof bottomRef.current?.scrollIntoView === "function") {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, isStreaming]);

  // Step 2: Render empty state if there are no messages
  if (messages.length === 0) {
    return (
      <div
        className={`flex flex-col items-center justify-center p-8 text-center text-zinc-400 text-sm h-full ${className}`}
      >
        <p className="max-w-xs">{emptyMessage}</p>
      </div>
    );
  }

  // Step 3: Render message items
  return (
    <div
      role="log"
      aria-label="Historial de mensajes"
      className={`flex flex-col gap-4 p-4 overflow-y-auto ${className}`}
    >
      {messages.map((msg) => {
        const isUser = msg.role === "user";
        const isAssistant = msg.role === "assistant";

        return (
          <div
            key={msg.id}
            data-testid={`chat-message-${msg.role}`}
            className={`flex flex-col max-w-[85%] rounded-xl px-4 py-3 text-sm leading-relaxed ${
              isUser
                ? "self-end bg-indigo-600/30 border border-indigo-500/40 text-zinc-100"
                : isAssistant
                ? "self-start bg-zinc-800/80 border border-zinc-700/60 text-zinc-200"
                : "self-center bg-zinc-900/60 border border-zinc-800 text-zinc-400 text-xs italic"
            }`}
          >
            {/* Step 3.1: Message text content */}
            {msg.content && (
              <p className="whitespace-pre-wrap select-text">{msg.content}</p>
            )}

            {/* Step 3.2: Inline tool call badge */}
            {msg.toolCall && (
              <div className="mt-2">
                <ToolCallBadge
                  toolName={msg.toolCall.toolName}
                  status={msg.toolCall.status}
                  error={msg.toolCall.error}
                />
              </div>
            )}
          </div>
        );
      })}

      {/* Step 4: Streaming indicator */}
      {isStreaming && (
        <div
          data-testid="streaming-indicator"
          className="self-start flex items-center gap-1.5 px-3 py-2 rounded-xl bg-zinc-800/60 border border-zinc-700/40 text-xs text-zinc-400"
        >
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-75" />
          <span className="w-2 h-2 rounded-full bg-indigo-500 animate-pulse delay-150" />
        </div>
      )}

      <div ref={bottomRef} />
    </div>
  );
}
