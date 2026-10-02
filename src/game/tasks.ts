// Pure task operations: data goes in, new data comes out.
// Nothing here touches React, the DOM, or localStorage.

import type { Task, TaskCategory, TaskSize } from './types';

/** What the form collects — everything except generated fields. */
export interface TaskDraft {
  title: string;
  category: TaskCategory;
  size: TaskSize;
  dueDate: string | null;
  /** An active goal of the same category to count towards, or null. */
  goalId: string | null;
}

/** Append a new task built from a draft. `now` is injectable for tests. */
export function addTask(
  tasks: Task[],
  draft: TaskDraft,
  now: Date = new Date(),
): Task[] {
  const task: Task = {
    id: crypto.randomUUID(),
    title: draft.title.trim(),
    category: draft.category,
    size: draft.size,
    dueDate: draft.dueDate,
    createdAt: now.toISOString(),
    completedAt: null,
    goalId: draft.goalId,
  };
  return [...tasks, task];
}

/** Apply edits to one task (title/category/size/dueDate/goalId only). */
export function updateTask(
  tasks: Task[],
  id: string,
  changes: TaskDraft,
): Task[] {
  return tasks.map((task) => {
    if (task.id !== id) return task;
    if (task.completedAt !== null) {
      // Coins (and goal progress) were already paid for this category, size and goal.
      return {
        ...task,
        title: changes.title.trim(),
        dueDate: changes.dueDate,
      };
    }
    return { ...task, ...changes, title: changes.title.trim() };
  });
}

/** Mark a task done or open. `now` is injectable for tests. */
export function setTaskCompleted(
  tasks: Task[],
  id: string,
  completed: boolean,
  now: Date = new Date(),
): Task[] {
  return tasks.map((task) =>
    task.id === id
      ? { ...task, completedAt: completed ? now.toISOString() : null }
      : task,
  );
}

/** Remove a task entirely. */
export function removeTask(tasks: Task[], id: string): Task[] {
  return tasks.filter((task) => task.id !== id);
}
