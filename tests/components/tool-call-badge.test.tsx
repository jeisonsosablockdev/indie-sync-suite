/**
 * @file tool-call-badge.test.tsx
 * @layer Presentation Test
 * @description Component tests for ToolCallBadge rendering tool execution states.
 */

// @vitest-environment jsdom

import React from "react";
import { describe, test, expect } from "vitest";
import { render, screen } from "@testing-library/react";
import { ToolCallBadge } from "../../apps/web/src/components/assistant/tool-call-badge";

describe("ToolCallBadge Component (SPEC-06)", () => {
  test("renders REQUESTED status with Spanish label \"Solicitada\"", () => {
    render(<ToolCallBadge toolName="consultar_marca" status="REQUESTED" />);
    expect(screen.getByText("consultar_marca")).toBeDefined();
    expect(screen.getByText("Solicitada")).toBeDefined();
  });

  test("renders CONFIRMED status with Spanish label \"Aprobada\"", () => {
    render(<ToolCallBadge toolName="actualizar_marca_artista" status="CONFIRMED" />);
    expect(screen.getByText("actualizar_marca_artista")).toBeDefined();
    expect(screen.getByText("Aprobada")).toBeDefined();
  });

  test("renders EXECUTED status with Spanish label \"Ejecutada\"", () => {
    render(<ToolCallBadge toolName="crear_artista" status="EXECUTED" />);
    expect(screen.getByText("crear_artista")).toBeDefined();
    expect(screen.getByText("Ejecutada")).toBeDefined();
  });

  test("renders FAILED status with Spanish label \"Fallida\" and error message", () => {
    render(
      <ToolCallBadge
        toolName="crear_artista"
        status="FAILED"
        error="Violación de unicidad de nombre"
      />
    );
    expect(screen.getByText("crear_artista")).toBeDefined();
    expect(screen.getByText("Fallida")).toBeDefined();
    expect(screen.getByText("Violación de unicidad de nombre")).toBeDefined();
  });
});
