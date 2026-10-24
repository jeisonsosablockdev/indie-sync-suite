/**
 * @file cascade-calculator.ts
 * @layer Domain
 * @description Pure topological sort algorithm for propagating date shifts across the
 *              task DAG and detecting circular dependencies. Zero classes, pure functions.
 */

import { ReleaseTask, TaskDateDiff } from './planner-schemas';
import { addDaysUtc, normalizeToUtcMidnight } from './schedule-projector';

export interface TaskDependencyEdge {
  taskId: string;
  prerequisiteTaskId: string;
}

export interface CascadeCalculationResult {
  hasCycles: boolean;
  affectedTasks: TaskDateDiff[];
  updatedTasks: ReleaseTask[];
}

/**
 * Asserts that the given dependency edges form an acyclic graph, throwing if a cycle is detected.
 */
export function assertNoCycle(dependencies: TaskDependencyEdge[]): void {
  const taskIds = Array.from(new Set(dependencies.flatMap(d => [d.taskId, d.prerequisiteTaskId])));
  if (detectCyclesInDag(taskIds, dependencies)) {
    throw new Error('DAG_CYCLE_DETECTED: La dependencia propuesta crea un ciclo cerrado en el cronograma.');
  }
}

/**
 * Checks for cycles in a directed graph using Depth First Search (DFS).
 */
export function detectCyclesInDag(
  taskIds: string[],
  dependencies: TaskDependencyEdge[]
): boolean {
  const adj = new Map<string, string[]>();
  for (const id of taskIds) {
    adj.set(id, []);
  }
  for (const edge of dependencies) {
    const list = adj.get(edge.prerequisiteTaskId);
    if (list) {
      list.push(edge.taskId);
    }
  }

  const visited = new Set<string>();
  const inStack = new Set<string>();

  function dfs(node: string): boolean {
    visited.add(node);
    inStack.add(node);

    const neighbors = adj.get(node) || [];
    for (const neighbor of neighbors) {
      if (!visited.has(neighbor)) {
        if (dfs(neighbor)) return true;
      } else if (inStack.has(neighbor)) {
        return true; // Cycle detected
      }
    }

    inStack.delete(node);
    return false;
  }

  for (const id of taskIds) {
    if (!visited.has(id)) {
      if (dfs(id)) return true;
    }
  }

  return false;
}

/**
 * Pure function that calculates date shifts across the DAG when a root task moves by deltaDays.
 */
export function calculateCascadeShift(
  tasks: ReleaseTask[],
  dependencies: TaskDependencyEdge[],
  rootTaskId: string,
  deltaDays: number
): CascadeCalculationResult {
  const taskMap = new Map<string, ReleaseTask>(tasks.map(t => [t.id, { ...t }]));
  const taskIds = tasks.map(t => t.id);

  // Step 1: Prevent calculation on cyclic graphs
  if (detectCyclesInDag(taskIds, dependencies)) {
    throw new Error('DAG_CYCLE_DETECTED: No se puede recalcular un cronograma con dependencias circulares.');
  }

  if (deltaDays === 0 || !taskMap.has(rootTaskId)) {
    return { hasCycles: false, affectedTasks: [], updatedTasks: tasks };
  }

  // Step 2: Build adjacency list (Prerequisite -> Dependent tasks)
  const dependentsMap = new Map<string, string[]>();
  for (const t of tasks) {
    dependentsMap.set(t.id, []);
  }
  for (const edge of dependencies) {
    const list = dependentsMap.get(edge.prerequisiteTaskId);
    if (list) {
      list.push(edge.taskId);
    }
  }

  // Step 3: Shift the root task
  const root = taskMap.get(rootTaskId)!;
  const oldRootDate = root.dueDate;
  const newRootDate = addDaysUtc(normalizeToUtcMidnight(oldRootDate), deltaDays).toISOString();
  root.dueDate = newRootDate;
  root.offsetDays += deltaDays;

  const affectedMap = new Map<string, TaskDateDiff>();
  affectedMap.set(root.id, {
    taskId: root.id,
    title: root.title,
    oldDueDate: oldRootDate,
    newDueDate: newRootDate,
    deltaDays,
    isGatekeeper: root.isGatekeeper,
    violatesDspWindow: false,
  });

  // Step 4: Propagate through descendants using Breadth First Search (BFS)
  const queue: string[] = [rootTaskId];
  const processed = new Set<string>();

  while (queue.length > 0) {
    const currentId = queue.shift()!;
    processed.add(currentId);
    const currentTask = taskMap.get(currentId)!;
    const currentDueUtc = normalizeToUtcMidnight(currentTask.dueDate).getTime();

    const children = dependentsMap.get(currentId) || [];
    for (const childId of children) {
      const child = taskMap.get(childId);
      if (!child) continue;

      const childDueUtc = normalizeToUtcMidnight(child.dueDate).getTime();
      // Invariant: child due date must be at least as late as current parent due date
      if (childDueUtc < currentDueUtc) {
        const diffMs = currentDueUtc - childDueUtc;
        const requiredShiftDays = Math.ceil(diffMs / (1000 * 60 * 60 * 24));
        const oldChildDate = child.dueDate;
        const newChildDate = addDaysUtc(normalizeToUtcMidnight(oldChildDate), requiredShiftDays).toISOString();

        child.dueDate = newChildDate;
        child.offsetDays += requiredShiftDays;

        affectedMap.set(child.id, {
          taskId: child.id,
          title: child.title,
          oldDueDate: oldChildDate,
          newDueDate: newChildDate,
          deltaDays: requiredShiftDays,
          isGatekeeper: child.isGatekeeper,
          violatesDspWindow: false,
        });

        if (!queue.includes(childId)) {
          queue.push(childId);
        }
      }
    }
  }

  return {
    hasCycles: false,
    affectedTasks: Array.from(affectedMap.values()),
    updatedTasks: Array.from(taskMap.values()),
  };
}
