/**
 * @file cascade-preview-modal.tsx
 * @layer Presentation
 * @description Modal dialog previewing the cascading impact of task date shifts across dependent tasks.
 */

'use client';

import React from 'react';
import { ScheduleDiff } from '../../lib/pipelines/planner/planner-schemas';

export interface CascadePreviewModalProps {
  isOpen: boolean;
  diff: ScheduleDiff | null;
  isCommitting?: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}

export function CascadePreviewModal({
  isOpen,
  diff,
  isCommitting = false,
  onConfirm,
  onCancel,
}: CascadePreviewModalProps) {
  if (!isOpen || !diff) return null;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-sm animate-fade-in"
      role="dialog"
      aria-modal="true"
      aria-labelledby="cascade-modal-title"
      data-testid="cascade-preview-modal"
    >
      <div className="w-full max-w-2xl rounded-2xl bg-white dark:bg-zinc-900 border border-zinc-200 dark:border-zinc-800 shadow-xl overflow-hidden p-6 space-y-6">
        {/* Step 1: Dialog Header */}
        <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
          <div>
            <h3 id="cascade-modal-title" className="text-xl font-bold text-zinc-900 dark:text-zinc-100">
              Vista Previa de Recálculo en Cascada
            </h3>
            <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-1">
              La modificación de fecha impacta directamente las tareas dependientes a través del grafo (DAG).
            </p>
          </div>
          <button
            type="button"
            onClick={onCancel}
            className="text-zinc-400 hover:text-zinc-600 dark:hover:text-zinc-200 transition text-lg leading-none"
            aria-label="Cerrar modal"
          >
            ✕
          </button>
        </div>

        {/* Step 2: Warning Banner if DSP Window is Violated */}
        {diff.dspWindowViolation && (
          <div className="p-3.5 rounded-xl bg-rose-50 dark:bg-rose-950/40 border border-rose-300 dark:border-rose-900/60 text-xs text-rose-800 dark:text-rose-200 space-y-1">
            <p className="font-bold flex items-center gap-1.5">
              <span>⚠️</span> Alerta de Invariante: Violación de Margen DSP ({diff.deficitDays} días de déficit)
            </p>
            <p>
              {diff.suggestedAction ||
                'Este desplazamiento empuja tareas críticas más allá de la ventana de seguridad previa a T-0.'}
            </p>
          </div>
        )}

        {/* Step 3: Affected Tasks Table */}
        <div className="space-y-2">
          <span className="text-xs font-semibold text-zinc-700 dark:text-zinc-300">
            Tareas Impactadas ({diff.affectedTasks.length}):
          </span>

          <div className="max-h-60 overflow-y-auto rounded-xl border border-zinc-200 dark:border-zinc-800">
            <table className="w-full text-left text-xs">
              <thead className="bg-zinc-50 dark:bg-zinc-950 text-zinc-500 dark:text-zinc-400 font-semibold border-b border-zinc-200 dark:border-zinc-800">
                <tr>
                  <th className="p-2.5">Tarea</th>
                  <th className="p-2.5">Fecha Anterior</th>
                  <th className="p-2.5">Nueva Fecha</th>
                  <th className="p-2.5 text-right">Variación</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-zinc-100 dark:divide-zinc-800/80">
                {diff.affectedTasks.map(task => (
                  <tr key={task.taskId} className="hover:bg-zinc-50/50 dark:hover:bg-zinc-850/30">
                    <td className="p-2.5 font-medium text-zinc-900 dark:text-zinc-100">
                      <div className="flex items-center gap-1.5">
                        {task.isGatekeeper && (
                          <span className="w-2 h-2 rounded-full bg-amber-500" title="Gatekeeper" />
                        )}
                        <span>{task.title}</span>
                      </div>
                    </td>
                    <td className="p-2.5 text-zinc-500 font-mono">
                      {new Date(task.oldDueDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-2.5 text-indigo-600 dark:text-indigo-400 font-semibold font-mono">
                      {new Date(task.newDueDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                    </td>
                    <td className="p-2.5 text-right font-mono font-bold text-zinc-700 dark:text-zinc-300">
                      {task.deltaDays > 0 ? `+${task.deltaDays}d` : `${task.deltaDays}d`}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Step 4: Dialog Actions */}
        <div className="flex items-center justify-end gap-3 pt-2">
          <button
            type="button"
            disabled={isCommitting}
            onClick={onCancel}
            className="px-4 py-2 text-xs font-semibold rounded-lg border border-zinc-300 dark:border-zinc-700 hover:bg-zinc-50 dark:hover:bg-zinc-800 text-zinc-700 dark:text-zinc-300 transition"
          >
            Descartar
          </button>
          <button
            type="button"
            disabled={isCommitting}
            onClick={onConfirm}
            className="px-4 py-2 text-xs font-semibold rounded-lg bg-indigo-600 hover:bg-indigo-700 text-white transition shadow-sm disabled:opacity-50"
            data-testid="confirm-cascade-btn"
          >
            {isCommitting ? 'Aplicando...' : 'Confirmar Recálculo'}
          </button>
        </div>
      </div>
    </div>
  );
}
