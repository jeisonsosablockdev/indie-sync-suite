/**
 * @file use-role-perspective.ts
 * @layer Application
 * @description React hook for switching between Label Manager and Artist perspectives with field permission checks.
 */

'use client';

import { useState, useCallback, useMemo } from 'react';
import { ReleaseTask } from '../pipelines/planner/planner-schemas';
import {
  canEditField,
  canTransitionDeliverable,
  filterTasksByRole,
  PlannerField,
  UserRole,
} from '../pipelines/planner/role-permissions';

export interface UseRolePerspectiveProps {
  initialRole?: UserRole;
  tasks?: ReleaseTask[];
}

export function useRolePerspective({
  initialRole = 'LABEL_MANAGER',
  tasks = [],
}: UseRolePerspectiveProps = {}) {
  const [currentRole, setCurrentRole] = useState<UserRole>(initialRole);

  const toggleRole = useCallback(() => {
    setCurrentRole(prev => (prev === 'LABEL_MANAGER' ? 'ARTIST' : 'LABEL_MANAGER'));
  }, []);

  const setRole = useCallback((role: UserRole) => {
    setCurrentRole(role);
  }, []);

  const checkCanEdit = useCallback(
    (field: PlannerField): boolean => {
      return canEditField(currentRole, field);
    },
    [currentRole]
  );

  const checkCanTransition = useCallback(
    (action: 'APPROVE' | 'REJECT' | 'SUBMIT'): boolean => {
      return canTransitionDeliverable(currentRole, action);
    },
    [currentRole]
  );

  const visibleTasks = useMemo(() => {
    return filterTasksByRole(tasks, currentRole);
  }, [tasks, currentRole]);

  return {
    currentRole,
    isLabelManager: currentRole === 'LABEL_MANAGER',
    isArtist: currentRole === 'ARTIST',
    toggleRole,
    setRole,
    checkCanEdit,
    checkCanTransition,
    visibleTasks,
  };
}
