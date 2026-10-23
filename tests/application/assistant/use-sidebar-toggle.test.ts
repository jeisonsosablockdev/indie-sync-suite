/**
 * @file use-sidebar-toggle.test.ts
 * @layer Application Test
 * @description Hook tests for useSidebarToggle handling keyboard shortcuts (Cmd+K, Cmd+J) and responsive state.
 */

// @vitest-environment jsdom

import { describe, test, expect, beforeEach, afterEach } from "vitest";
import { renderHook, act } from "@testing-library/react";
import { useSidebarToggle } from "../../../apps/web/src/lib/hooks/use-sidebar-toggle";

describe("useSidebarToggle Hook (SPEC-06)", () => {
  beforeEach(() => {
    document.body.style.overflow = "";
  });

  afterEach(() => {
    document.body.style.overflow = "";
  });

  test("initializes with default closed state (or provided initial state)", () => {
    const { result } = renderHook(() => useSidebarToggle(false));
    expect(result.current.isOpen).toBe(false);

    const { result: openResult } = renderHook(() => useSidebarToggle(true));
    expect(openResult.current.isOpen).toBe(true);
  });

  test("toggles, opens, and closes sidebar imperatively", () => {
    const { result } = renderHook(() => useSidebarToggle(false));

    act(() => {
      result.current.toggle();
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      result.current.close();
    });
    expect(result.current.isOpen).toBe(false);

    act(() => {
      result.current.open();
    });
    expect(result.current.isOpen).toBe(true);
  });

  test("toggles state when Cmd+K or Ctrl+K is pressed", () => {
    const { result } = renderHook(() => useSidebarToggle(false));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", metaKey: true, bubbles: true })
      );
    });
    expect(result.current.isOpen).toBe(true);

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "k", ctrlKey: true, bubbles: true })
      );
    });
    expect(result.current.isOpen).toBe(false);
  });

  test("toggles state when Cmd+J or Ctrl+J is pressed", () => {
    const { result } = renderHook(() => useSidebarToggle(false));

    act(() => {
      window.dispatchEvent(
        new KeyboardEvent("keydown", { key: "j", metaKey: true, bubbles: true })
      );
    });
    expect(result.current.isOpen).toBe(true);
  });
});
