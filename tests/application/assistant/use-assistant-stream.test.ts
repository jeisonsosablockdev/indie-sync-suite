/**
 * @file use-assistant-stream.test.ts
 * @layer Application Test
 * @description Hook tests for useAssistantStream managing messages, tool state transitions, and streaming.
 */

// @vitest-environment jsdom

import { describe, test, expect, vi } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useAssistantStream } from "../../../apps/web/src/lib/hooks/use-assistant-stream";

describe("useAssistantStream Hook (SPEC-06)", () => {
  test("initializes with empty messages by default", () => {
    const { result } = renderHook(() => useAssistantStream());
    expect(result.current.messages).toEqual([]);
    expect(result.current.isStreaming).toBe(false);
    expect(result.current.pendingAction).toBeNull();
  });

  test("appends message and updates tool execution status", () => {
    const { result } = renderHook(() => useAssistantStream());

    act(() => {
      result.current.appendMessage({
        id: "msg-1",
        role: "assistant",
        content: "Ejecutando tool...",
        toolCall: {
          toolName: "actualizar_marca_artista",
          status: "REQUESTED",
        },
      });
    });

    expect(result.current.messages).toHaveLength(1);
    expect(result.current.messages[0].toolCall?.status).toBe("REQUESTED");

    act(() => {
      result.current.updateMessageToolStatus("msg-1", "EXECUTED");
    });

    expect(result.current.messages[0].toolCall?.status).toBe("EXECUTED");
  });

  test("sendMessage adds user message and calls onSendMessage callback", async () => {
    const mockSend = vi.fn().mockResolvedValue("Respuesta socrática del asistente.");
    const { result } = renderHook(() =>
      useAssistantStream({ onSendMessage: mockSend })
    );

    await act(async () => {
      await result.current.sendMessage("Hola, soy un artista de rock psicodélico.");
    });

    expect(mockSend).toHaveBeenCalledWith("Hola, soy un artista de rock psicodélico.");
    expect(result.current.messages).toHaveLength(2);
    expect(result.current.messages[0].role).toBe("user");
    expect(result.current.messages[1].role).toBe("assistant");
    expect(result.current.messages[1].content).toBe("Respuesta socrática del asistente.");
    expect(result.current.isStreaming).toBe(false);
  });
});
