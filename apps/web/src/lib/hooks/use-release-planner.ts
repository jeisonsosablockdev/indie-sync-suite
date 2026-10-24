/**
 * @file use-release-planner.ts
 * @layer Application
 * @description React hook for orchestrating Release Planning, Contexto Nivel 3, and task management.
 */

'use client';

import { useState, useCallback } from 'react';
import {
  ReleaseConcept,
  ReleaseTask,
  ReleasePhase,
  TaskStatus,
} from '../pipelines/planner/planner-schemas';
import { ArchetypeTemplate } from '../pipelines/planner/archetype-templates';
import { calculateScheduleDates } from '../pipelines/planner/schedule-projector';

export interface UseReleasePlannerProps {
  initialConcept?: Partial<ReleaseConcept>;
  initialPhases?: ReleasePhase[];
  initialTasks?: ReleaseTask[];
  onSaveConcept?: (concept: ReleaseConcept) => Promise<void>;
  onFreezeConcept?: (releaseId: string) => Promise<void>;
  onApplyArchetype?: (template: ArchetypeTemplate, targetDate: string) => Promise<void>;
}

export function useReleasePlanner({
  initialConcept,
  initialPhases = [],
  initialTasks = [],
  onSaveConcept,
  onFreezeConcept,
  onApplyArchetype,
}: UseReleasePlannerProps = {}) {
  const [concept, setConcept] = useState<Partial<ReleaseConcept>>({
    narrative: '',
    lyricTheme: '',
    soundMood: '',
    isrc: '',
    upc: '',
    targetDate: new Date().toISOString(),
    budgetUsd: 0,
    snapshotFrozen: false,
    ...initialConcept,
  });

  const [phases, setPhases] = useState<ReleasePhase[]>(initialPhases);
  const [tasks, setTasks] = useState<ReleaseTask[]>(initialTasks);
  const [isLoading, setIsLoading] = useState(false);
  const [isSaving, setIsSaving] = useState(false);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const updateConceptField = useCallback(
    <K extends keyof ReleaseConcept>(field: K, value: ReleaseConcept[K]) => {
      // Step 1: Prevent editing if concept snapshot is frozen
      if (concept.snapshotFrozen) {
        setErrors(prev => ({
          ...prev,
          root: 'El concepto de lanzamiento se encuentra congelado y es inmutable.',
        }));
        return;
      }

      setConcept(prev => ({ ...prev, [field]: value }));
      setErrors(prev => {
        const next = { ...prev };
        delete next[field as string];
        delete next.root;
        return next;
      });
    },
    [concept.snapshotFrozen]
  );

  const saveConcept = useCallback(async () => {
    if (!onSaveConcept) return;
    setIsSaving(true);
    try {
      await onSaveConcept(concept as ReleaseConcept);
      setErrors({});
    } catch (err: any) {
      setErrors({ root: err.message || 'Error al guardar el concepto de lanzamiento.' });
    } finally {
      setIsSaving(false);
    }
  }, [concept, onSaveConcept]);

  const freezeSnapshot = useCallback(async () => {
    if (!onFreezeConcept || !concept.releaseId) return;
    setIsLoading(true);
    try {
      await onFreezeConcept(concept.releaseId);
      setConcept(prev => ({ ...prev, snapshotFrozen: true, frozenAt: new Date().toISOString() }));
    } catch (err: any) {
      setErrors({ root: err.message || 'Error al congelar el snapshot del concepto.' });
    } finally {
      setIsLoading(false);
    }
  }, [concept.releaseId, onFreezeConcept]);

  const applyArchetype = useCallback(
    async (template: ArchetypeTemplate) => {
      if (!concept.targetDate) return;
      setIsLoading(true);
      try {
        if (onApplyArchetype) {
          await onApplyArchetype(template, concept.targetDate);
        } else {
          // Client-side local projection fallback
          const projection = calculateScheduleDates(concept.targetDate, template);
          const generatedPhases: ReleasePhase[] = projection.phases.map((p, idx) => ({
            id: crypto.randomUUID(),
            releaseId: concept.releaseId || crypto.randomUUID(),
            phaseType: p.phaseType,
            name: p.name,
            startDate: p.startDate,
            endDate: p.endDate,
            orderIndex: idx,
          }));
          const phaseIdMap = new Map(generatedPhases.map(p => [p.phaseType, p.id]));
          const generatedTasks: ReleaseTask[] = projection.tasks.map((t, idx) => ({
            id: crypto.randomUUID(),
            releaseId: concept.releaseId || crypto.randomUUID(),
            phaseId: phaseIdMap.get(t.phaseType) || generatedPhases[0]!.id,
            parentTaskId: null,
            title: t.title,
            description: t.description,
            assignedRole: t.assignedRole,
            dueDate: t.dueDate,
            offsetDays: t.offsetDays,
            isGatekeeper: t.isGatekeeper,
            status: 'TODO',
            orderIndex: idx,
          }));
          setPhases(generatedPhases);
          setTasks(generatedTasks);
        }
      } catch (err: any) {
        setErrors({ root: err.message || 'Error al aplicar el arquetipo de lanzamiento.' });
      } finally {
        setIsLoading(false);
      }
    },
    [concept.targetDate, concept.releaseId, onApplyArchetype]
  );

  const updateTaskStatus = useCallback((taskId: string, newStatus: TaskStatus) => {
    setTasks(prev =>
      prev.map(task => (task.id === taskId ? { ...task, status: newStatus } : task))
    );
  }, []);

  return {
    concept,
    phases,
    tasks,
    isLoading,
    isSaving,
    errors,
    updateConceptField,
    saveConcept,
    freezeSnapshot,
    applyArchetype,
    updateTaskStatus,
    setTasks,
    setPhases,
  };
}
