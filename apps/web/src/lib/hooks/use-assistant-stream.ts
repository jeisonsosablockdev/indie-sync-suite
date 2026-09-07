/**
 * @file apps/web/src/lib/hooks/use-assistant-stream.ts
 * @layer Layer 2: Application / Hooks
 * @description Application hook managing assistant streaming, message history, and tool invocation states.
 */

"use client";

import { useState, useCallback } from "react";
import type { ChatMessage } from "../../components/assistant/chat-message-list";
import type { PendingActionSnapshot } from "../../components/assistant/assistant-sidebar";

export interface UseAssistantStreamOptions {
  initialMessages?: ChatMessage[];
  onSendMessage?: (content: string) => Promise<string | void>;
}

export interface AssistantStreamState {
  messages: ChatMessage[];
  isStreaming: boolean;
  pendingAction: PendingActionSnapshot | null;
  sendMessage: (content: string) => Promise<void>;
  appendMessage: (message: ChatMessage) => void;
  updateMessageToolStatus: (
    messageId: string,
    status: ChatMessage["toolCall"] extends undefined ? never : NonNullable<ChatMessage["toolCall"]>["status"],
    error?: string
  ) => void;
  setPendingAction: (action: PendingActionSnapshot | null) => void;
  clearMessages: () => void;
}

/**
 * Reactive hook coordinating chat streaming, tool execution badges, and human-in-the-loop guardrail prompts.
 *
 * @param options - Configuration options with initial message history and send callback.
 * @returns Assistant stream state and dispatchers.
 */
export function useAssistantStream(
  options: UseAssistantStreamOptions = {}
): AssistantStreamState {
  // Step 1: Initialize local state
  const [messages, setMessages] = useState<ChatMessage[]>(
    options.initialMessages || []
  );
  const [isStreaming, setIsStreaming] = useState<boolean>(false);
  const [pendingAction, setPendingAction] = useState<PendingActionSnapshot | null>(
    null
  );

  // Step 2: Append a message to the conversational history
  const appendMessage = useCallback((message: ChatMessage) => {
    setMessages((prev) => [...prev, message]);
  }, []);

  // Step 3: Update tool execution status on a specific message
  const updateMessageToolStatus = useCallback(
    (
      messageId: string,
      status: NonNullable<ChatMessage["toolCall"]>["status"],
      error?: string
    ) => {
      setMessages((prev) =>
        prev.map((msg) => {
          if (msg.id !== messageId || !msg.toolCall) return msg;
          return {
            ...msg,
            toolCall: {
              ...msg.toolCall,
              status,
              ...(error ? { error } : {}),
            },
          };
        })
      );
    },
    []
  );

  // Step 4: Dispatch user message and handle response or streaming simulation
  const sendMessage = useCallback(
    async (content: string) => {
      const userMessageId = "user-" + Date.now();
      const userMsg: ChatMessage = {
        id: userMessageId,
        role: "user",
        content,
        timestamp: Date.now(),
      };

      setMessages((prev) => [...prev, userMsg]);
      setIsStreaming(true);

      try {
        if (options.onSendMessage) {
          const responseText = await options.onSendMessage(content);
          if (responseText) {
            const assistantMsg: ChatMessage = {
              id: "assistant-" + Date.now(),
              role: "assistant",
              content: responseText,
              timestamp: Date.now(),
            };
            setMessages((prev) => [...prev, assistantMsg]);
          }
        }
      } finally {
        setIsStreaming(false);
      }
    },
    [options]
  );

  // Step 5: Clear conversation
  const clearMessages = useCallback(() => {
    setMessages([]);
    setPendingAction(null);
  }, []);

  return {
    messages,
    isStreaming,
    pendingAction,
    sendMessage,
    appendMessage,
    updateMessageToolStatus,
    setPendingAction,
    clearMessages,
  };
}
