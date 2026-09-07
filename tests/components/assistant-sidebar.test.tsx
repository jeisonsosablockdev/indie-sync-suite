/**
 * @file assistant-sidebar.test.tsx
 * @layer Presentation Test
 * @description Component tests for AssistantSidebar animated drawer, input form, and action modal integration.
 */

// @vitest-environment jsdom

import React from "react";
import { describe, test, expect, vi } from "vitest";
import { render, screen, fireEvent } from "@testing-library/react";
import { AssistantSidebar } from "../../apps/web/src/components/assistant/assistant-sidebar";

describe("AssistantSidebar Component (SPEC-06)", () => {
  test("renders floating toggle button when sidebar is closed", () => {
    const onToggle = vi.fn();
    render(
      <AssistantSidebar
        isOpen={false}
        onClose={vi.fn()}
        onToggle={onToggle}
        messages={[]}
        onSendMessage={vi.fn()}
      />
    );

    const toggleBtn = screen.getByRole("button", { name: /abrir asistente/i });
    expect(toggleBtn).toBeDefined();

    fireEvent.click(toggleBtn);
    expect(onToggle).toHaveBeenCalledTimes(1);
  });

  test("renders drawer with header, message list, and input form when open", () => {
    const onClose = vi.fn();
    const onSendMessage = vi.fn();

    render(
      <AssistantSidebar
        isOpen={true}
        onClose={onClose}
        onToggle={vi.fn()}
        messages={[
          {
            id: "msg-1",
            role: "assistant",
            content: "¿Cuál es la emoción principal de tu música?",
          },
        ]}
        onSendMessage={onSendMessage}
      />
    );

    expect(screen.getByText("Asistente Creativo")).toBeDefined();
    expect(
      screen.getByText("¿Cuál es la emoción principal de tu música?")
    ).toBeDefined();

    // Close button
    const closeBtn = screen.getByRole("button", { name: /cerrar asistente/i });
    fireEvent.click(closeBtn);
    expect(onClose).toHaveBeenCalledTimes(1);

    // Message input
    const input = screen.getByPlaceholderText(/escribe tu respuesta|pregunta/i);
    fireEvent.change(input, { target: { value: "Nostalgia y melancolía" } });

    const submitBtn = screen.getByRole("button", { name: /enviar/i });
    fireEvent.click(submitBtn);

    expect(onSendMessage).toHaveBeenCalledWith("Nostalgia y melancolía");
  });

  test("renders GuardrailModal when a pending action is supplied", () => {
    const mockAction = {
      id: "pending-123",
      toolName: "actualizar_marca_artista",
      confirmationMessage: "Sintetizar y guardar perfil",
      params: { name: "Indie Rocker" },
      createdAt: Date.now(),
    };

    render(
      <AssistantSidebar
        isOpen={true}
        onClose={vi.fn()}
        onToggle={vi.fn()}
        messages={[]}
        onSendMessage={vi.fn()}
        pendingAction={mockAction}
      />
    );

    expect(screen.getByText("Confirmación de Acción Requerida")).toBeDefined();
    expect(screen.getByText("actualizar_marca_artista")).toBeDefined();
  });
});
