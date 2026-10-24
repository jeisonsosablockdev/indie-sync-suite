/**
 * @file role-permissions.ts
 * @layer Domain
 * @description Pure role permission matrix and task filter selectors for asymmetric perspective
 *              (Label Manager vs Artist) in desktop and web views.
 */

import { ReleaseTask } from './planner-schemas';

export type UserRole = 'LABEL_MANAGER' | 'ARTIST';

export type PlannerField =
  | 'budgetUsd'
  | 'isrc'
  | 'upc'
  | 'internalCost'
  | 'legalContracts'
  | 'audioLinks'
  | 'deliverablesReview';

export interface FieldPermissionRule {
  allowedRoles: UserRole[];
  editableRoles: UserRole[];
}

export const FIELD_PERMISSIONS: Record<PlannerField, FieldPermissionRule> = {
  budgetUsd: { allowedRoles: ['LABEL_MANAGER'], editableRoles: ['LABEL_MANAGER'] },
  isrc: { allowedRoles: ['LABEL_MANAGER', 'ARTIST'], editableRoles: ['LABEL_MANAGER'] },
  upc: { allowedRoles: ['LABEL_MANAGER', 'ARTIST'], editableRoles: ['LABEL_MANAGER'] },
  internalCost: { allowedRoles: ['LABEL_MANAGER'], editableRoles: ['LABEL_MANAGER'] },
  legalContracts: { allowedRoles: ['LABEL_MANAGER'], editableRoles: ['LABEL_MANAGER'] },
  audioLinks: { allowedRoles: ['LABEL_MANAGER', 'ARTIST'], editableRoles: ['LABEL_MANAGER', 'ARTIST'] },
  deliverablesReview: { allowedRoles: ['LABEL_MANAGER', 'ARTIST'], editableRoles: ['LABEL_MANAGER', 'ARTIST'] },
};

/**
 * Pure predicate checking whether a given role can view a specific domain field.
 */
export function canViewField(role: UserRole, fieldKey: PlannerField): boolean {
  const rule = FIELD_PERMISSIONS[fieldKey];
  if (!rule) {
    return true; // Unrestricted fields default to visible
  }
  return rule.allowedRoles.includes(role);
}

/**
 * Pure predicate checking whether a given role can edit a specific domain field.
 */
export function canEditField(role: UserRole, fieldKey: PlannerField): boolean {
  const rule = FIELD_PERMISSIONS[fieldKey];
  if (!rule) {
    return true;
  }
  return rule.editableRoles.includes(role);
}

/**
 * Pure predicate checking whether a given role can execute deliverable approvals/rejections.
 */
export function canTransitionDeliverable(
  role: UserRole,
  action: 'APPROVE' | 'REJECT' | 'SUBMIT'
): boolean {
  if (action === 'SUBMIT') return true;
  // Approvals and formal rejections are strictly governed by Label Manager
  return role === 'LABEL_MANAGER';
}

/**
 * Filters the master task list according to active perspective.
 * Label Manager sees 100% of tasks; Artist sees tasks explicitly assigned to them or collaborators.
 */
export function filterTasksByRole(tasks: ReleaseTask[], activeRole: UserRole): ReleaseTask[] {
  if (activeRole === 'LABEL_MANAGER') {
    return tasks;
  }
  return tasks.filter(t => t.assignedRole === 'ARTIST' || t.assignedRole === 'COLLABORATOR');
}
