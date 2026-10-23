/**
 * @file chat-message-list.test.tsx
 * @layer Presentation Test
 * @description Component tests for ChatMessageList rendering conversational turns, streaming, and tool badges.
 */

// @vitest-environment jsdom

import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ChatMessageList } from "../../apps/web/src/components/assistant/chat-message-list";

describe("ChatMessageList Component (SPEC-06)", () => {
  test("renders empty state message when messages array is empty", () => {
    render(<ChatMessageList messages={[]} emptyMessage="Inicia una conversación socrática" />);
    expect(screen.getByText("Inicia una conversación socrática")).toBeDefined();
  });

  test("renders user and assistant messages with respective roles", () => {
    const messages = [
      {
        id: "msg-1",
        role: "user" as const,
        content: "Hola, quiero definir la identidad de mi proyecto de dream pop.",
      },
      {
        id: "msg-2",
        role: "assistant" as const,
        content: "Excelente. Si tu sonido fuera una escena cinematográfica de los 80s, ¿qué paleta de colores predominaría?",
      },
    ];

    render(<ChatMessageList messages={messages} />);
    expect(
      screen.getByText("Hola, quiero definir la identidad de mi proyecto de dream pop.")
    ).toBeDefined();
    expect(
      screen.getByText(/Excelente\. Si tu sonido fuera una escena/)
    ).toBeDefined();
  });

  test("renders tool call badges inside messages when toolCall is present", () => {
    const messages = [
      {
        id: "msg-3",
        role: "assistant" as const,
        content: "Voy a guardar la información en tu bóveda de marca.",
        toolCall: {
          toolName: "actualizar_marca_artista",
          status: "CONFIRMED" as const,
        },
      },
    ];

    render(<ChatMessageList messages={messages} />);
    expect(screen.getByText("actualizar_marca_artista")).toBeDefined();
    expect(screen.getByText("Aprobada")).toBeDefined();
  });

  test("displays streaming indicator when isStreaming is true", () => {
    render(
      <ChatMessageList
        messages={[
          {
            id: "msg-4",
            role: "assistant" as const,
            content: "Sintetizando...",
          },
        ]}
        isStreaming={true}
      />
    );
    expect(screen.getByTestId("streaming-indicator")).toBeDefined();
  });
});
