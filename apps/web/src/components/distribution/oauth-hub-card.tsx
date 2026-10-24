/**
 * @file oauth-hub-card.tsx
 * @layer Presentation
 * @description Connected social accounts and ad accounts overview card with health badges
 *              and 1-click OAuth connection triggers. Pure React UI, zero Layer 3/4 imports.
 */

'use client';

import React from 'react';
import { Share2, CheckCircle2, AlertTriangle, XCircle, RefreshCw, Plus } from 'lucide-react';
import {
  useOAuthHub,
  SocialPlatform,
  HealthStatus,
  SocialConnection,
} from '../../lib/hooks/use-oauth-hub';

export interface OAuthHubCardProps {
  labelId: string;
  initialConnections?: SocialConnection[];
}

const PLATFORM_NAMES: Record<SocialPlatform, string> = {
  INSTAGRAM: 'Instagram',
  TIKTOK: 'TikTok',
  TWITTER_X: 'X (Twitter)',
  YOUTUBE: 'YouTube',
  FACEBOOK: 'Facebook',
  META_ADS: 'Meta Ads Manager',
  TIKTOK_ADS: 'TikTok Ads Manager',
};

const HEALTH_CONFIG: Record<
  HealthStatus,
  { label: string; text: string; bg: string; icon: React.ElementType }
> = {
  CONNECTED: {
    label: 'Conectada',
    text: 'text-emerald-700 dark:text-emerald-300',
    bg: 'bg-emerald-50 dark:bg-emerald-950/60 border-emerald-200 dark:border-emerald-800',
    icon: CheckCircle2,
  },
  EXPIRED: {
    label: 'Token Expirado',
    text: 'text-amber-700 dark:text-amber-300',
    bg: 'bg-amber-50 dark:bg-amber-950/60 border-amber-200 dark:border-amber-800',
    icon: AlertTriangle,
  },
  DISCONNECTED: {
    label: 'Desconectada',
    text: 'text-zinc-600 dark:text-zinc-400',
    bg: 'bg-zinc-100 dark:bg-zinc-800 border-zinc-200 dark:border-zinc-700',
    icon: XCircle,
  },
};

/**
 * OAuthHubCard presentation component.
 */
export function OAuthHubCard({ labelId, initialConnections }: OAuthHubCardProps) {
  // Step 1: Bind application hook
  const {
    connections,
    isLoading,
    refreshConnections,
    initiateOAuthConnect,
    disconnectAccount,
  } = useOAuthHub({ labelId, initialConnections });

  return (
    <div
      className="space-y-6 rounded-2xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-950 p-6"
      data-testid="oauth-hub-card"
    >
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 border-b border-zinc-100 dark:border-zinc-800 pb-5">
        <div className="flex items-center gap-3">
          <span className="p-2.5 rounded-xl bg-indigo-50 dark:bg-indigo-950/60 text-indigo-600 dark:text-indigo-400">
            <Share2 className="w-5 h-5" />
          </span>
          <div>
            <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
              OAuth Hub & Cuentas Conectadas
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400">
              Vincula los perfiles de redes sociales y cuentas publicitarias para publicación automática y pauta.
            </p>
          </div>
        </div>

        <button
          type="button"
          onClick={() => refreshConnections()}
          disabled={isLoading}
          className="flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium rounded-lg border border-zinc-200 dark:border-zinc-700 hover:bg-zinc-100 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition-colors"
        >
          <RefreshCw className={`w-3.5 h-3.5 ${isLoading ? 'animate-spin' : ''}`} />
          Sincronizar Estado
        </button>
      </div>

      {/* Grid of Connections */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        {(Object.keys(PLATFORM_NAMES) as SocialPlatform[]).map((platform) => {
          const connection = connections.find((c) => c.platform === platform);
          const isConnected = !!connection && connection.healthStatus === 'CONNECTED';
          const healthCfg = connection
            ? HEALTH_CONFIG[connection.healthStatus]
            : HEALTH_CONFIG.DISCONNECTED;
          const HealthIcon = healthCfg.icon;

          return (
            <div
              key={platform}
              className="rounded-xl border border-zinc-200 dark:border-zinc-800 p-4 space-y-3 bg-white dark:bg-zinc-900 flex flex-col justify-between"
            >
              <div>
                <div className="flex items-center justify-between pb-1">
                  <span className="text-xs font-bold text-zinc-900 dark:text-zinc-100">
                    {PLATFORM_NAMES[platform]}
                  </span>
                  <span
                    className={`px-2 py-0.5 rounded-md text-[10px] font-semibold border flex items-center gap-1 ${healthCfg.bg} ${healthCfg.text}`}
                  >
                    <HealthIcon className="w-3 h-3" />
                    {healthCfg.label}
                  </span>
                </div>
                <p className="text-[11px] text-zinc-500 dark:text-zinc-400 truncate">
                  {connection ? connection.accountName : 'No vinculada'}
                </p>
              </div>

              <div className="pt-2 border-t border-zinc-100 dark:border-zinc-800 flex justify-end">
                {isConnected ? (
                  <button
                    type="button"
                    onClick={() => disconnectAccount(connection.id)}
                    className="text-[11px] text-zinc-400 hover:text-rose-600 transition-colors"
                  >
                    Desconectar
                  </button>
                ) : (
                  <button
                    type="button"
                    onClick={() => initiateOAuthConnect(platform)}
                    className="flex items-center gap-1 text-[11px] font-medium text-indigo-600 dark:text-indigo-400 hover:text-indigo-500 transition-colors"
                  >
                    <Plus className="w-3 h-3" />
                    Vincular Cuenta
                  </button>
                )}
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
