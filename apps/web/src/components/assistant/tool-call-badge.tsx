/**
 * @file apps/web/src/components/assistant/tool-call-badge.tsx
 * @layer Layer 1: Presentation
 * @description Visual badge rendering real-time execution states for AI tool calling with accessible indicators.
 */

"use client";

import React from "react";

export type ToolStatus = "REQUESTED" | "CONFIRMED" | "EXECUTED" | "FAILED";

export interface ToolCallBadgeProps {
  toolName: string;
  status: ToolStatus;
  error?: string;
  className?: string;
}

const STATUS_CONFIG: Record<
  ToolStatus,
  { label: string; bg: string; text: string; border: string }
> = {
  REQUESTED: {
    label: "Solicitada",
    bg: "bg-amber-950/40",
    text: "text-amber-400",
    border: "border-amber-700/50",
  },
  CONFIRMED: {
    label: "Aprobada",
    bg: "bg-blue-950/40",
    text: "text-blue-400",
    border: "border-blue-700/50",
  },
  EXECUTED: {
    label: "Ejecutada",
    bg: "bg-emerald-950/40",
    text: "text-emerald-400",
    border: "border-emerald-700/50",
  },
  FAILED: {
    label: "Fallida",
    bg: "bg-rose-950/40",
    text: "text-rose-400",
    border: "border-rose-700/50",
  },
};

/**
 * Renders an interactive badge showing tool execution state, name, and error feedback.
 *
 * @param props - Tool name, current execution status, and optional error string.
 * @returns JSX Element.
 */
export function ToolCallBadge({
  toolName,
  status,
  error,
  className = "",
}: ToolCallBadgeProps): React.JSX.Element {
  // Step 1: Resolve visual styling tokens from status configuration
  const config = STATUS_CONFIG[status] || STATUS_CONFIG.REQUESTED;

  // Step 2: Render accessible badge with tool metadata
  return (
    <div
      role="status"
      aria-label={`Herramienta ${toolName}: ${config.label}`}
      className={`inline-flex flex-col gap-1 my-1 p-2 rounded-lg border text-xs font-mono ${config.bg} ${config.border} ${className}`}
    >
      <div className="flex items-center gap-2">
        <span className="font-semibold text-zinc-200">
          {toolName}
        </span>
        <span
          className={`px-1.5 py-0.5 rounded text-[10px] uppercase font-bold border ${config.border} ${config.text}`}
        >
          {config.label}
        </span>
      </div>

      {/* Step 3: Render error message if tool failed */}
      {status === "FAILED" && error && (
        <span className="text-rose-400 font-sans text-[11px] mt-0.5">
          {error}
        </span>
      )}
    </div>
  );
}
