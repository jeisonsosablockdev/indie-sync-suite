/**
 * @file release-timeline.tsx
 * @layer Presentation
 * @description Chronological visual timeline representing release phases, tasks, and gatekeepers relative to T-0.
 */

'use client';

import React from 'react';
import { ReleasePhase, ReleaseTask, TaskStatus } from '../../lib/pipelines/planner/planner-schemas';

export interface ReleaseTimelineProps {
  phases: ReleasePhase[];
  tasks: ReleaseTask[];
  onTaskClick?: (task: ReleaseTask) => void;
  onStatusChange?: (taskId: string, status: TaskStatus) => void;
}

const STATUS_COLORS: Record<TaskStatus, { bg: string; text: string; label: string }> = {
  TODO: { bg: 'bg-zinc-100 dark:bg-zinc-800', text: 'text-zinc-600 dark:text-zinc-400', label: 'Por hacer' },
  IN_PROGRESS: { bg: 'bg-blue-100 dark:bg-blue-950/60', text: 'text-blue-700 dark:text-blue-300', label: 'En progreso' },
  IN_REVIEW: { bg: 'bg-purple-100 dark:bg-purple-950/60', text: 'text-purple-700 dark:text-purple-300', label: 'En revisión' },
  DONE: { bg: 'bg-emerald-100 dark:bg-emerald-950/60', text: 'text-emerald-700 dark:text-emerald-300', label: 'Completada' },
  BLOCKED: { bg: 'bg-rose-100 dark:bg-rose-950/60', text: 'text-rose-700 dark:text-rose-300', label: 'Bloqueada' },
};

export function ReleaseTimeline({
  phases,
  tasks,
  onTaskClick,
  onStatusChange,
}: ReleaseTimelineProps) {
  return (
    <div
      className="w-full rounded-xl border border-zinc-200 dark:border-zinc-800 bg-white dark:bg-zinc-900 p-6 space-y-6"
      data-testid="release-timeline"
    >
      <div className="flex items-center justify-between border-b border-zinc-100 dark:border-zinc-800 pb-4">
        <div>
          <h3 className="text-lg font-bold text-zinc-900 dark:text-zinc-100">
            Cronograma Visual de Lanzamiento
          </h3>
          <p className="text-xs text-zinc-500 dark:text-zinc-400 mt-0.5">
            Secuencia temporal de fases e hitos críticos organizados con relación a T-0.
          </p>
        </div>
      </div>

      {phases.length === 0 ? (
        <div className="py-12 text-center text-sm text-zinc-400 dark:text-zinc-500 italic">
          No hay fases configuradas aún. Selecciona un arquetipo para generar el cronograma.
        </div>
      ) : (
        <div className="space-y-8">
          {phases.map(phase => {
            const phaseTasks = tasks.filter(t => t.phaseId === phase.id);

            return (
              <div key={phase.id} className="space-y-3" data-testid={`phase-${phase.phaseType.toLowerCase()}`}>
                {/* Phase Header */}
                <div className="flex items-center gap-3">
                  <span className="px-2 py-0.5 rounded text-[11px] font-bold tracking-wider uppercase bg-zinc-200 dark:bg-zinc-800 text-zinc-800 dark:text-zinc-200">
                    {phase.name}
                  </span>
                  <span className="text-xs text-zinc-400">
                    {new Date(phase.startDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })} –{' '}
                    {new Date(phase.endDate).toLocaleDateString('es-ES', { month: 'short', day: 'numeric' })}
                  </span>
                  <div className="flex-1 border-t border-zinc-200 dark:border-zinc-800 ml-2" />
                </div>

                {/* Phase Tasks Grid */}
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
                  {phaseTasks.map(task => {
                    const statusMeta = STATUS_COLORS[task.status];

                    return (
                      <div
                        key={task.id}
                        onClick={() => onTaskClick?.(task)}
                        className={`p-3.5 rounded-xl border transition cursor-pointer flex flex-col justify-between space-y-2 ${
                          task.isGatekeeper
                            ? 'border-amber-300 dark:border-amber-900/60 bg-amber-50/20 dark:bg-amber-950/10 hover:border-amber-400'
                            : 'border-zinc-200 dark:border-zinc-800 bg-zinc-50/50 dark:bg-zinc-950/40 hover:border-zinc-300 dark:hover:border-zinc-700'
                        }`}
                        data-testid={`task-card-${task.id}`}
                      >
                        <div className="flex items-start justify-between gap-2">
                          <h4 className="text-xs font-semibold text-zinc-900 dark:text-zinc-100 line-clamp-2">
                            {task.title}
                          </h4>
                          {task.isGatekeeper && (
                            <span
                              className="px-1.5 py-0.5 rounded text-[10px] font-bold tracking-wide uppercase bg-amber-100 text-amber-800 dark:bg-amber-900/50 dark:text-amber-300 shrink-0"
                              title="Hito Gatekeeper Crítico"
                            >
                              Gatekeeper
                            </span>
                          )}
                        </div>

                        {task.description && (
                          <p className="text-[11px] text-zinc-500 dark:text-zinc-400 line-clamp-2">
                            {task.description}
                          </p>
                        )}

                        <div className="flex items-center justify-between pt-2 border-t border-zinc-100 dark:border-zinc-800/80 text-[11px]">
                          <span className="font-mono text-zinc-500 dark:text-zinc-400">
                            {task.offsetDays === 0
                              ? 'T-0 (Día D)'
                              : task.offsetDays < 0
                              ? `T${task.offsetDays}d`
                              : `T+${task.offsetDays}d`}
                          </span>

                          <div className="flex items-center gap-2">
                            <span className="text-[10px] text-zinc-400">
                              {task.assignedRole === 'ARTIST' ? '🎨 Artista' : '🏢 Sello'}
                            </span>
                            <span
                              className={`px-2 py-0.5 rounded-full text-[10px] font-medium ${statusMeta.bg} ${statusMeta.text}`}
                            >
                              {statusMeta.label}
                            </span>
                          </div>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
