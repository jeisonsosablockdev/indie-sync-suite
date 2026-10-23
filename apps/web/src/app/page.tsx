/**
 * @file apps/web/src/app/page.tsx
 * @layer Layer 1: Presentation - Application Shell & Dashboard
 * @description Main console interface integrating Brand Vault, BYOK Credentials Manager, and Assistant Sidebar.
 */

"use client";

import React, { useState } from "react";
import { WalletConnectButton } from "@/components/wallet/wallet-connect-button";
import { ThemeToggle } from "@/components/theme/theme-toggle";
import { Card } from "@/components/ui/card";
import { getSolanaRpcUrl } from "@/lib/infrastructure/solana";
import { ArtistEditorForm } from "@/components/brand-vault/artist-editor-form";
import { ArtistProfileCard } from "@/components/brand-vault/artist-profile-card";
import { ByokManager } from "@/components/settings/byok-manager";
import { AssistantSidebar } from "@/components/assistant/assistant-sidebar";
import { useSidebarToggle } from "@/lib/hooks/use-sidebar-toggle";
import { useAssistantStream } from "@/lib/hooks/use-assistant-stream";
import type { ArtistProfile } from "@/lib/pipelines/brand-vault/brand-schemas";

const DEFAULT_ARTIST: Partial<ArtistProfile> = {
  name: "Solaris Duo",
  genre: "Synthwave / Cyberpunk",
  bio: "Dúo independiente de sintetizadores analógicos, atmósferas retrofuturistas y producción DIY.",
  colorPalette: ["#0F172A", "#6366F1", "#06B6D4"],
  toneOfVoice: "Cinemático, melancólico, introspectivo",
};

export default function HomePage() {
  // Step 1: Active tab navigation state
  const [activeTab, setActiveTab] = useState<"overview" | "brand-vault" | "byok">("overview");

  // Step 2: Live artist profile state for live card preview
  const [previewArtist, setPreviewArtist] = useState<Partial<ArtistProfile>>(DEFAULT_ARTIST);

  // Step 3: Sidebar toggle hook handling keyboard shortcuts (Cmd+K / Cmd+J)
  const { isOpen, close, toggle } = useSidebarToggle(false);

  // Step 4: Assistant conversational streaming hook
  const { messages, isStreaming, sendMessage } = useAssistantStream({
    initialMessages: [
      {
        id: "welcome-msg",
        role: "assistant",
        content:
          "¡Hola! Soy tu Director Creativo de Indie-Sync Suite. Puedo guiarte a través de una entrevista socrática para sintetizar tu manual de marca musical o ayudarte a gestionar tus herramientas operativas.",
      },
    ],
    onSendMessage: async (prompt) => {
      // Socratic assistant response simulation
      return `Excelente reflexión sobre: "${prompt}". Para profundizar en tu identidad sonora, ¿qué dos directores de cine o fotógrafos definen mejor la iluminación de tus directos?`;
    },
  });

  const rpcUrl = getSolanaRpcUrl();

  return (
    <main className="flex min-h-screen flex-col bg-zinc-950 text-zinc-100">
      {/* Step 5: Top Header Navigation */}
      <header className="sticky top-0 z-30 flex items-center justify-between px-6 py-4 border-b border-zinc-800/80 bg-zinc-950/80 backdrop-blur-md">
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-3">
            <div className="h-9 w-9 rounded-xl bg-gradient-to-br from-indigo-500 via-purple-500 to-pink-500 flex items-center justify-center font-bold text-white shadow-lg shadow-indigo-500/20">
              ISS
            </div>
            <div>
              <h1 className="text-base font-bold tracking-tight text-white">Indie-Sync Suite</h1>
              <p className="text-[11px] text-zinc-400 font-mono">Bóveda de Identidad & Orquestador</p>
            </div>
          </div>

          {/* Navigation Tabs */}
          <nav className="hidden md:flex items-center gap-1 ml-4 p-1 rounded-lg bg-zinc-900 border border-zinc-800">
            <button
              type="button"
              onClick={() => setActiveTab("overview")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "overview"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Visión General
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("brand-vault")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "brand-vault"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Bóveda de Marca
            </button>
            <button
              type="button"
              onClick={() => setActiveTab("byok")}
              className={`px-3.5 py-1.5 rounded-md text-xs font-medium transition-colors ${
                activeTab === "byok"
                  ? "bg-indigo-600 text-white shadow-sm"
                  : "text-zinc-400 hover:text-zinc-200"
              }`}
            >
              Bóveda BYOK
            </button>
          </nav>
        </div>

        <div className="flex items-center gap-3">
          <div className="hidden sm:inline-flex items-center gap-2 rounded-full border border-emerald-500/30 bg-emerald-500/10 px-3 py-1 text-xs font-medium text-emerald-400">
            <span className="h-2 w-2 rounded-full bg-emerald-400 animate-pulse" />
            Devnet Ready
          </div>
          <ThemeToggle />
          <WalletConnectButton />
        </div>
      </header>

      {/* Step 6: Mobile Sub-Navigation */}
      <div className="flex md:hidden border-b border-zinc-800 bg-zinc-900/50 p-2 gap-2 overflow-x-auto">
        <button
          type="button"
          onClick={() => setActiveTab("overview")}
          className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
            activeTab === "overview" ? "bg-indigo-600 text-white" : "text-zinc-400"
          }`}
        >
          Visión General
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("brand-vault")}
          className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
            activeTab === "brand-vault" ? "bg-indigo-600 text-white" : "text-zinc-400"
          }`}
        >
          Bóveda de Marca
        </button>
        <button
          type="button"
          onClick={() => setActiveTab("byok")}
          className={`px-3 py-1 rounded text-xs whitespace-nowrap ${
            activeTab === "byok" ? "bg-indigo-600 text-white" : "text-zinc-400"
          }`}
        >
          Bóveda BYOK
        </button>
      </div>

      {/* Step 7: Main Content Body */}
      <div className="flex-1 max-w-7xl w-full mx-auto p-6 sm:p-8">
        {activeTab === "overview" && (
          <div className="space-y-12">
            {/* Hero Banner */}
            <div className="text-center max-w-3xl mx-auto pt-6 pb-2">
              <span className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-indigo-950/60 border border-indigo-700/50 text-indigo-400 mb-4">
                Épica 1 Certificada (182 tests en verde)
              </span>
              <h2 className="text-3xl sm:text-5xl font-extrabold tracking-tight text-zinc-100">
                Sustrato Determinista & Activación Agéntica
              </h2>
              <p className="mt-4 text-sm sm:text-base text-zinc-400 max-w-2xl mx-auto leading-relaxed">
                Persistencia local offline-first con SQLite WAL, almacenamiento Zero-Trust de llaves BYOK,
                Brand Vault interactivo con WCAG AA, y asistente conversacional socrático con guardrails Human-in-the-Loop.
              </p>
              <div className="mt-6 flex flex-wrap items-center justify-center gap-4">
                <button
                  type="button"
                  onClick={() => setActiveTab("brand-vault")}
                  className="px-5 py-2.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 font-medium text-sm text-white shadow-lg shadow-indigo-600/20 transition cursor-pointer"
                >
                  Abrir Bóveda de Marca
                </button>
                <button
                  type="button"
                  onClick={() => setActiveTab("byok")}
                  className="px-5 py-2.5 rounded-lg bg-zinc-800 hover:bg-zinc-700 font-medium text-sm text-zinc-200 border border-zinc-700 transition cursor-pointer"
                >
                  Configurar API Keys (BYOK)
                </button>
                <button
                  type="button"
                  onClick={toggle}
                  className="px-5 py-2.5 rounded-lg bg-zinc-900 hover:bg-zinc-800 font-medium text-sm text-indigo-400 border border-indigo-800/60 transition cursor-pointer flex items-center gap-2"
                >
                  <span>Probar Asistente</span>
                  <span className="text-xs px-1.5 py-0.5 rounded bg-indigo-950 text-indigo-300 font-mono">⌘K</span>
                </button>
              </div>
            </div>

            {/* 4-Layer Architecture Cards */}
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Card>
                <div className="p-2">
                  <div className="text-xs uppercase font-bold text-indigo-400 tracking-wider">Capa 1</div>
                  <h3 className="text-sm font-semibold text-zinc-100 mt-1">Presentación (UI)</h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    Next.js 16 App Router, Tailwind CSS, Motion 12 y componentes desacoplados de persistencia.
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-2">
                  <div className="text-xs uppercase font-bold text-blue-400 tracking-wider">Capa 2</div>
                  <h3 className="text-sm font-semibold text-zinc-100 mt-1">Aplicación (Hooks)</h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    Gestión reactiva de estado con hooks dedicados (useBrandVault, useSidebarToggle, useAssistantStream).
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-2">
                  <div className="text-xs uppercase font-bold text-purple-400 tracking-wider">Capa 3</div>
                  <h3 className="text-sm font-semibold text-zinc-100 mt-1">Dominio (Pipelines)</h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    AiProviderRegistry anti-SSRF, esquemas Zod estrictos, prompts socráticos y guardrails Human-in-the-Loop.
                  </p>
                </div>
              </Card>
              <Card>
                <div className="p-2">
                  <div className="text-xs uppercase font-bold text-emerald-400 tracking-wider">Capa 4</div>
                  <h3 className="text-sm font-semibold text-zinc-100 mt-1">Infraestructura</h3>
                  <p className="mt-2 text-xs text-zinc-400 leading-relaxed">
                    SQLite WAL nativo con busy_timeout=5000ms, OS Keychain (keyring-rs) y conectores RPC de Solana Devnet.
                  </p>
                </div>
              </Card>
            </div>
          </div>
        )}

        {activeTab === "brand-vault" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Bóveda de Identidad Visual y Conceptual (Brand Vault)</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Registra y edita perfiles de artistas con validación estricta de paletas de color Hex (WCAG AA) y previsualización en vivo.
              </p>
            </div>
            <div className="grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
              <div className="lg:col-span-2">
                <ArtistEditorForm
                  initialArtist={previewArtist}
                  onSaveProfile={async (updated) => {
                    setPreviewArtist(updated);
                  }}
                />
              </div>
              <div className="space-y-4">
                <h3 className="text-sm font-semibold text-zinc-300">Previsualización de Tarjeta de Artista</h3>
                <ArtistProfileCard profile={previewArtist} />
              </div>
            </div>
          </div>
        )}

        {activeTab === "byok" && (
          <div className="space-y-6">
            <div>
              <h2 className="text-xl font-bold text-white">Bóveda de Secretos BYOK (Bring Your Own Key)</h2>
              <p className="text-xs text-zinc-400 mt-1">
                Gestión segura de credenciales de OpenAI, Anthropic, Gemini y Groq con almacenamiento cifrado y diagnóstico de salud.
              </p>
            </div>
            <ByokManager />
          </div>
        )}
      </div>

      {/* Step 8: Omnipresent Socratic Assistant Sidebar */}
      <AssistantSidebar
        isOpen={isOpen}
        onClose={close}
        onToggle={toggle}
        messages={messages}
        onSendMessage={sendMessage}
        isStreaming={isStreaming}
      />

      {/* Step 9: Footer */}
      <footer className="mt-auto border-t border-zinc-800/80 py-4 px-6 text-center text-xs text-zinc-500 font-mono">
        Indie-Sync Suite &bull; Solana Devnet ({rpcUrl}) &bull; Offline-First SQLite WAL
      </footer>
    </main>
  );
}
