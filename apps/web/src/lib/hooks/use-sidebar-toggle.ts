/**
 * @file apps/web/src/lib/hooks/use-sidebar-toggle.ts
 * @layer Layer 2: Application / Hooks
 * @description Hook managing responsive visibility, keyboard shortcuts (Cmd+K, Cmd+J), and body scroll locks for the Assistant Sidebar.
 */

"use client";

import { useState, useEffect, useCallback } from "react";

export interface SidebarToggleState {
  isOpen: boolean;
  open: () => void;
  close: () => void;
  toggle: () => void;
}

/**
 * Manages the open/closed state of the assistant sidebar, registers global keyboard shortcuts,
 * and traps body scrolling on small viewports when active.
 *
 * @param initialState - Initial open/close boolean state (defaults to false).
 * @returns Object with isOpen boolean and imperative open, close, and toggle handlers.
 */
export function useSidebarToggle(initialState: boolean = false): SidebarToggleState {
  // Step 1: Initialize open state
  const [isOpen, setIsOpen] = useState<boolean>(initialState);

  // Step 2: Define stable imperative action handlers
  const open = useCallback(() => setIsOpen(true), []);
  const close = useCallback(() => setIsOpen(false), []);
  const toggle = useCallback(() => setIsOpen((prev) => !prev), []);

  // Step 3: Register global keyboard shortcuts for Cmd+K and Cmd+J
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      const isModifier = event.metaKey || event.ctrlKey;
      const key = event.key.toLowerCase();

      if (isModifier && (key === "k" || key === "j")) {
        event.preventDefault();
        setIsOpen((prev) => !prev);
      }
    };

    window.addEventListener("keydown", handleKeyDown);
    return () => {
      window.removeEventListener("keydown", handleKeyDown);
    };
  }, []);

  // Step 4: Manage mobile viewport body scroll lock
  useEffect(() => {
    if (typeof window === "undefined") return;

    if (isOpen) {
      const isMobile = window.innerWidth < 768;
      if (isMobile) {
        document.body.style.overflow = "hidden";
      }
    } else {
      document.body.style.overflow = "";
    }

    return () => {
      document.body.style.overflow = "";
    };
  }, [isOpen]);

  // Step 5: Return reactive state and controls
  return {
    isOpen,
    open,
    close,
    toggle,
  };
}
