/**
 * @file byok-manager.tsx
 * @layer Presentation
 * @description Accessible Next.js BYOK Credential Management Console with real-time health badges and latency feedback.
 */

'use client';

import React, { useState } from 'react';
import {
  useByokCredentials,
  ProviderItemState,
} from '../../lib/hooks/use-byok-credentials';
import { SupportedProvider } from '../../lib/pipelines/security/credential-service';
import { ProviderHealthStatus } from '../../lib/infrastructure/security/health-checker';

const PROVIDER_METADATA: Record<SupportedProvider, { name: string; placeholder: string; docUrl: string }> = {
  openai: {
    name: 'OpenAI',
    placeholder: 'sk-proj-...',
    docUrl: 'https://platform.openai.com/api-keys',
  },
  anthropic: {
    name: 'Anthropic',
    placeholder: 'sk-ant-...',
    docUrl: 'https://console.anthropic.com/settings/keys',
  },
  google: {
    name: 'Google Gemini',
    placeholder: 'AIzaSy...',
    docUrl: 'https://aistudio.google.com/app/apikey',
  },
  groq: {
    name: 'Groq Cloud',
    placeholder: 'gsk_...',
    docUrl: 'https://console.groq.com/keys',
  },
};

function HealthBadge({ status, latencyMs }: { status?: ProviderHealthStatus; latencyMs?: number }) {
  if (!status) return null;

  const styles: Record<ProviderHealthStatus, { bg: string; text: string; label: string }> = {
    healthy: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-400', label: 'Operativo' },
    low_quota: { bg: 'bg-amber-100 dark:bg-amber-950/60', text: 'text-amber-700 dark:text-amber-400', label: 'Cuota Baja' },
    invalid_key: { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-400', label: 'Clave Inválida' },
    unreachable: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-700 dark:text-zinc-400', label: 'Sin Conexión' },
  };

  const current = styles[status] || styles.unreachable;

  return (
    <div className="flex items-center gap-2" role="status" aria-label={`Estado de proveedor: ${current.label}`}>
      <span className={`inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-semibold ${current.bg} ${current.text}`}>
        {current.label}
      </span>
      {typeof latencyMs === 'number' && latencyMs > 0 && (
        <span className="text-xs text-zinc-500 dark:text-zinc-400 font-mono">
          {latencyMs}ms
        </span>
      )}
    </div>
  );
}

export function ByokManager() {
  const {
    providers,
    isInitializing,
    actionError,
    saveKey,
    revokeKey,
    testConnection,
  } = useByokCredentials();

  const [inputValues, setInputValues] = useState<Record<string, string>>({});
  const [submittingProvider, setSubmittingProvider] = useState<string | null>(null);

  const handleInputChange = (provider: SupportedProvider, value: string) => {
    setInputValues(prev => ({ ...prev, [provider]: value }));
  };

  const handleSave = async (provider: SupportedProvider) => {
    const raw = inputValues[provider];
    if (!raw) return;

    setSubmittingProvider(provider);
    try {
      await saveKey(provider, raw);
      setInputValues(prev => ({ ...prev, [provider]: '' }));
    } catch {
      // Error handled by hook
    } finally {
      setSubmittingProvider(null);
    }
  };

  const handleRevoke = async (provider: SupportedProvider) => {
    try {
      await revokeKey(provider);
      setInputValues(prev => ({ ...prev, [provider]: '' }));
    } catch {
      // Error handled by hook
    }
  };

  if (isInitializing) {
    return (
      <div className="p-8 text-center text-zinc-500 dark:text-zinc-400 animate-pulse">
        Cargando bóveda de credenciales...
      </div>
    );
  }

  return (
    <div className="w-full max-w-4xl mx-auto space-y-6">
      <header className="border-b border-zinc-200 dark:border-zinc-800 pb-4">
        <h2 className="text-2xl font-bold tracking-tight text-zinc-900 dark:text-zinc-100">
          Credenciales de IA (BYOK)
        </h2>
        <p className="text-sm text-zinc-500 dark:text-zinc-400 mt-1">
          Tus claves se resguardan de forma segura en el llavero de tu sistema con cifrado AES-256-GCM. Jamás tocan servidores externos ni viajan en texto plano.
        </p>
      </header>

      {actionError && (
        <div className="p-4 rounded-md bg-rose-50 dark:bg-rose-950/40 border border-rose-200 dark:border-rose-900 text-rose-800 dark:text-rose-300 text-sm" role="alert">
          {actionError}
        </div>
      )}

      <div className="grid grid-cols-1 gap-6">
        {(Object.keys(providers) as SupportedProvider[]).map(providerKey => {
          const item: ProviderItemState = providers[providerKey];
          const meta = PROVIDER_METADATA[providerKey];
          const isConfigured = Boolean(item.maskedKey);
          const isSaving = submittingProvider === providerKey;
          const isBusy = item.isChecking || isSaving;

          return (
            <div
              key={providerKey}
              className="p-5 rounded-lg border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 shadow-sm transition-all"
              data-testid={`byok-card-${providerKey}`}
            >
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <div>
                  <div className="flex items-center gap-3">
                    <h3 className="text-base font-semibold text-zinc-900 dark:text-zinc-100">
                      {meta.name}
                    </h3>
                    <HealthBadge
                      status={item.health?.status}
                      latencyMs={item.health?.latencyMs}
                    />
                  </div>
                  {isConfigured ? (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 font-mono mt-1">
                      Clave activa: <span className="font-semibold text-zinc-700 dark:text-zinc-300">{item.maskedKey}</span>
                    </p>
                  ) : (
                    <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
                      No configurada. Puedes obtener una clave en{' '}
                      <a
                        href={meta.docUrl}
                        target="_blank"
                        rel="noreferrer"
                        className="underline hover:text-zinc-700 dark:hover:text-zinc-200"
                      >
                        la consola oficial
                      </a>.
                    </p>
                  )}
                </div>

                <div className="flex items-center gap-2">
                  {isConfigured && (
                    <>
                      <button
                        type="button"
                        onClick={() => testConnection(providerKey)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs font-medium rounded-md border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 transition disabled:opacity-50"
                        aria-label={`Probar conexión con ${meta.name}`}
                      >
                        {item.isChecking ? 'Probando...' : 'Probar'}
                      </button>
                      <button
                        type="button"
                        onClick={() => handleRevoke(providerKey)}
                        disabled={isBusy}
                        className="px-3 py-1.5 text-xs font-medium rounded-md text-rose-600 dark:text-rose-400 hover:bg-rose-50 dark:hover:bg-rose-950/40 transition disabled:opacity-50"
                        aria-label={`Revocar clave de ${meta.name}`}
                      >
                        Revocar
                      </button>
                    </>
                  )}
                </div>
              </div>

              {/* Form Input Section */}
              <div className="mt-4 pt-4 border-t border-zinc-100 dark:border-zinc-800/60 flex flex-col sm:flex-row gap-3">
                <input
                  type="password"
                  value={inputValues[providerKey] || ''}
                  onChange={e => handleInputChange(providerKey, e.target.value)}
                  placeholder={isConfigured ? 'Reemplazar clave existente...' : meta.placeholder}
                  disabled={isBusy}
                  className="flex-1 px-3 py-2 text-sm rounded-md border border-zinc-300 dark:border-zinc-700 bg-zinc-50/50 dark:bg-zinc-950 text-zinc-900 dark:text-zinc-100 placeholder-zinc-400 focus:outline-none focus:ring-2 focus:ring-indigo-500 dark:focus:ring-indigo-400 font-mono"
                  aria-label={`Nueva clave API para ${meta.name}`}
                />
                <button
                  type="button"
                  onClick={() => handleSave(providerKey)}
                  disabled={isBusy || !inputValues[providerKey]?.trim()}
                  className="px-4 py-2 text-sm font-medium rounded-md bg-zinc-900 text-white dark:bg-zinc-100 dark:text-zinc-900 hover:bg-zinc-800 dark:hover:bg-zinc-200 transition disabled:opacity-40 disabled:cursor-not-allowed"
                >
                  {isSaving ? 'Guardando...' : isConfigured ? 'Actualizar' : 'Guardar y Probar'}
                </button>
              </div>

              {item.health?.details && (
                <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-2 italic">
                  {item.health.details}
                </p>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
