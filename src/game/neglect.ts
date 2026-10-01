import type { Task, TaskCategory } from './types';
import { CATEGORIES } from './types';

export const DISTRICT_PROBLEMS: Record<TaskCategory, string> = {
  Study: 'Flickering lights',
  Health: 'Weeds',
  Chores: 'Potholes',
  'Money/Admin': 'Unpaid bills',
  Social: 'Graffiti',
  Projects: 'Broken machines',
};

export function todayKey(now: Date): string {
  // Date inputs use the local calendar, so UTC can shift their selected day.
  const year = String(now.getFullYear()).padStart(4, '0');
  const month = String(now.getMonth() + 1).padStart(2, '0');
  const day = String(now.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
}

export function isOverdue(task: Task, today: string): boolean {
  return (
    task.completedAt === null &&
    task.dueDate !== null &&
    task.dueDate < today
  );
}

export function neglectedCategories(
  tasks: Task[],
  today: string,
): TaskCategory[] {
  return CATEGORIES.filter((category) =>
    tasks.some(
      (task) => task.category === category && isOverdue(task, today),
    ),
  );
}
