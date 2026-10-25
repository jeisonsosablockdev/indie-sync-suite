/**
 * @file api-keys-manager.tsx
 * @layer Presentation
 * @description Administration console for Open REST API keys: key generation modal,
 *              granular scope checkboxes, one-time plaintext reveal with copy action,
 *              and immediate key revocation. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React, { useState } from 'react';
import {
  Key,
  Plus,
  Copy,
  Check,
  Trash2,
  ShieldCheck,
  AlertTriangle,
  Loader2,
  Sparkles,
} from 'lucide-react';
import {
  useApiKeys,
  ApiKeyScope,
  ExternalApiKey,
} from '../../lib/hooks/use-api-keys';

export interface ApiKeysManagerProps {
  className?: string;
}

const AVAILABLE_SCOPES: { scope: ApiKeyScope; label: string; description: string }[] = [
  {
    scope: 'READ_RELEASES',
    label: 'Lectura de Lanzamientos',
    description: 'Acceso a catálogo de releases, fechas y metadatos.',
  },
  {
    scope: 'WRITE_TASKS',
    label: 'Escritura de Tareas',
    description: 'Creación y actualización de entregables y estados.',
  },
  {
    scope: 'READ_METRICS',
    label: 'Lectura de Métricas',
    description: 'Consulta de analítica de streaming y presupuestos.',
  },
  {
    scope: 'FULL_ACCESS',
    label: 'Acceso Total',
    description: 'Control administrativo completo sobre todos los recursos.',
  },
];

/**
 * ApiKeysManager presentation component.
 *
 * @param props - Component styling props
 * @returns JSX Element rendering the API key management console
 */
export function ApiKeysManager({ className = '' }: ApiKeysManagerProps): React.JSX.Element {
  // Step 1: Bind application hook
  const {
    apiKeys,
    newlyIssuedKey,
    isCreating,
    error,
    generateKey,
    revokeKey,
    clearIssuedKey,
  } = useApiKeys();

  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [label, setLabel] = useState<string>('');
  const [selectedScopes, setSelectedScopes] = useState<ApiKeyScope[]>(['READ_RELEASES']);
  const [hasCopied, setHasCopied] = useState<boolean>(false);

  // Step 2: Toggle scope selection
  const toggleScope = (scope: ApiKeyScope) => {
    if (selectedScopes.includes(scope)) {
      setSelectedScopes(selectedScopes.filter((s) => s !== scope));
    } else {
      setSelectedScopes([...selectedScopes, scope]);
    }
  };

  // Step 3: Handle key creation form
  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault();
    const createdKey = await generateKey(label, selectedScopes);
    if (createdKey) {
      setLabel('');
      setIsModalOpen(false);
    }
  };

  // Step 4: Handle copy to clipboard
  const handleCopy = async () => {
    if (newlyIssuedKey) {
      await navigator.clipboard.writeText(newlyIssuedKey.rawKey);
      setHasCopied(true);
      setTimeout(() => setHasCopied(false), 2000);
    }
  };

  return (
    <div className={`space-y-6 ${className}`}>
      {/* Step 5: Header with Create Button */}
      <div className="flex flex-col sm:flex-row items-start sm:items-center justify-between gap-4 border-b border-border/40 pb-4">
        <div>
          <h2 className="text-lg font-bold tracking-tight text-foreground flex items-center gap-2">
            <Key className="h-5 w-5 text-indigo-500" />
            Gestión de API Keys REST
          </h2>
          <p className="text-xs text-muted-foreground">
            Emite credenciales con scopes específicos para conectar ChatGPT Actions, Claude o scripts externos
          </p>
        </div>

        <button
          type="button"
          onClick={() => setIsModalOpen(true)}
          className="px-3.5 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 transition-colors"
        >
          <Plus className="h-4 w-4" />
          <span>Generar Nueva Llave</span>
        </button>
      </div>

      {/* Step 6: Newly Issued Key Reveal Card (One-time only) */}
      {newlyIssuedKey && (
        <div className="p-4 rounded-xl border border-emerald-500/40 bg-emerald-500/10 space-y-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Sparkles className="h-4 w-4 text-emerald-500" />
              <h4 className="text-xs font-bold text-foreground">
                Llave Creada: {newlyIssuedKey.label}
              </h4>
            </div>
            <button
              type="button"
              onClick={clearIssuedKey}
              className="text-[11px] text-muted-foreground hover:text-foreground"
            >
              Cerrar
            </button>
          </div>

          <div className="flex items-center gap-2 bg-background/80 p-2.5 rounded-lg border border-border/60">
            <code className="text-xs font-mono text-foreground flex-1 break-all">
              {newlyIssuedKey.rawKey}
            </code>
            <button
              type="button"
              onClick={() => void handleCopy()}
              className="p-1.5 rounded-md hover:bg-muted/50 text-indigo-500 transition-colors"
              title="Copiar llave"
            >
              {hasCopied ? <Check className="h-4 w-4 text-emerald-500" /> : <Copy className="h-4 w-4" />}
            </button>
          </div>

          <p className="text-[11px] text-amber-500 flex items-center gap-1">
            <AlertTriangle className="h-3.5 w-3.5 shrink-0" />
            Por seguridad, esta llave solo se mostrará una vez. Guárdala en tu gestor de secretos.
          </p>
        </div>
      )}

      {/* Step 7: Creation Dialog / Drawer */}
      {isModalOpen && (
        <form onSubmit={handleCreate} className="p-4 rounded-xl border border-border/60 bg-card/50 space-y-4">
          <h3 className="text-xs font-bold text-foreground uppercase tracking-wider">
            Nueva Clave de Acceso
          </h3>

          <div className="space-y-1">
            <label className="text-xs text-muted-foreground">Nombre de la Aplicación o Cliente</label>
            <input
              type="text"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              placeholder="ej. ChatGPT Desktop Action"
              className="w-full bg-background/60 border border-border/60 rounded-lg px-3 py-2 text-xs text-foreground placeholder:text-muted-foreground focus:outline-hidden focus:ring-1 focus:ring-indigo-500"
              required
            />
          </div>

          <div className="space-y-2">
            <label className="text-xs text-muted-foreground">Permisos / Scopes Autorizados</label>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
              {AVAILABLE_SCOPES.map((item) => (
                <label
                  key={item.scope}
                  className={`p-2.5 rounded-lg border cursor-pointer text-xs flex items-start gap-2 transition-colors ${
                    selectedScopes.includes(item.scope)
                      ? 'border-indigo-500/60 bg-indigo-500/5'
                      : 'border-border/40 hover:bg-muted/30'
                  }`}
                >
                  <input
                    type="checkbox"
                    checked={selectedScopes.includes(item.scope)}
                    onChange={() => toggleScope(item.scope)}
                    className="mt-0.5"
                  />
                  <div>
                    <span className="font-semibold text-foreground">{item.label}</span>
                    <p className="text-[10px] text-muted-foreground">{item.description}</p>
                  </div>
                </label>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-2">
            <button
              type="button"
              onClick={() => setIsModalOpen(false)}
              className="px-3 py-1.5 rounded-lg border border-border/60 text-xs text-muted-foreground hover:text-foreground"
            >
              Cancelar
            </button>
            <button
              type="submit"
              disabled={isCreating || !label.trim() || selectedScopes.length === 0}
              className="px-4 py-1.5 rounded-lg bg-indigo-600 hover:bg-indigo-500 text-white text-xs font-semibold flex items-center gap-1.5 disabled:opacity-50"
            >
              {isCreating ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ShieldCheck className="h-3.5 w-3.5" />}
              <span>Generar Llave</span>
            </button>
          </div>
        </form>
      )}

      {/* Step 8: Active API Keys Table */}
      <div className="space-y-3">
        <h4 className="text-xs font-semibold uppercase tracking-wider text-muted-foreground">
          Llaves Activas y Revocadas
        </h4>

        {apiKeys.length === 0 ? (
          <p className="text-xs text-muted-foreground italic p-4 text-center">
            No hay claves de API emitidas todavía.
          </p>
        ) : (
          <div className="space-y-2">
            {apiKeys.map((key: ExternalApiKey) => (
              <div
                key={key.id}
                className="p-3 rounded-xl border border-border/40 bg-card/30 flex flex-col sm:flex-row items-start sm:items-center justify-between gap-3 text-xs"
              >
                <div className="space-y-1">
                  <div className="flex items-center gap-2">
                    <span className="font-bold text-foreground">{key.label}</span>
                    {key.revokedAt ? (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-red-500/10 text-red-500">
                        Revocada
                      </span>
                    ) : (
                      <span className="px-2 py-0.5 rounded-full text-[10px] font-bold bg-emerald-500/10 text-emerald-500">
                        Activa
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 font-mono text-[11px] text-muted-foreground">
                    <span>{key.keyPrefix}...</span>
                    <span>•</span>
                    <span>Último uso: {key.lastUsedAt ? new Date(key.lastUsedAt).toLocaleDateString() : 'Nunca'}</span>
                  </div>
                  <div className="flex flex-wrap gap-1 pt-1">
                    {key.scopes.map((s) => (
                      <span
                        key={s}
                        className="px-1.5 py-0.5 rounded-sm bg-muted text-[10px] font-mono text-muted-foreground"
                      >
                        {s}
                      </span>
                    ))}
                  </div>
                </div>

                {!key.revokedAt && (
                  <button
                    type="button"
                    onClick={() => void revokeKey(key.id)}
                    className="p-1.5 rounded-lg text-muted-foreground hover:text-red-500 hover:bg-red-500/10 transition-colors"
                    title="Revocar inmediatamente"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                )}
              </div>
            ))}
          </div>
        )}
      </div>

      {error && (
        <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-xs text-red-500">
          {error}
        </div>
      )}
    </div>
  );
}
