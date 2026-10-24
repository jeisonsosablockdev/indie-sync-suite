/**
 * @file role-preview-toggle.tsx
 * @layer Presentation
 * @description Accessible toggle control for switching between Label Manager and Artist perspectives.
 */

'use client';

import React from 'react';
import { UserRole } from '../../lib/pipelines/planner/role-permissions';

export interface RolePreviewToggleProps {
  currentRole: UserRole;
  onToggle: () => void;
  onSelectRole?: (role: UserRole) => void;
}

export function RolePreviewToggle({
  currentRole,
  onToggle,
  onSelectRole,
}: RolePreviewToggleProps) {
  const isLabelManager = currentRole === 'LABEL_MANAGER';

  return (
    <div
      className="inline-flex items-center p-1 rounded-xl bg-zinc-100 dark:bg-zinc-800 border border-zinc-200 dark:border-zinc-700/80 shadow-inner"
      role="group"
      aria-label="Perspectiva de Rol"
      data-testid="role-preview-toggle"
    >
      <button
        type="button"
        onClick={() => onSelectRole ? onSelectRole('LABEL_MANAGER') : (isLabelManager ? undefined : onToggle())}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
          isLabelManager
            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
        data-testid="role-btn-label"
      >
        <span>🏢</span>
        <span>Sello / Manager</span>
      </button>

      <button
        type="button"
        onClick={() => onSelectRole ? onSelectRole('ARTIST') : (!isLabelManager ? undefined : onToggle())}
        className={`px-3 py-1.5 rounded-lg text-xs font-semibold transition flex items-center gap-1.5 ${
          !isLabelManager
            ? 'bg-white dark:bg-zinc-900 text-zinc-900 dark:text-zinc-100 shadow-sm'
            : 'text-zinc-600 dark:text-zinc-400 hover:text-zinc-900 dark:hover:text-zinc-200'
        }`}
        data-testid="role-btn-artist"
      >
        <span>🎨</span>
        <span>Artista</span>
      </button>
    </div>
  );
}
