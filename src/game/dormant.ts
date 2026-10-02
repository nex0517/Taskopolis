import type { BuildingDef } from './buildings';
import { DORMANT_AFTER_DAYS } from './config';
import type { Task, TaskCategory } from './types';
import { CATEGORIES } from './types';

// Unit conversion only; the balance number is DORMANT_AFTER_DAYS in config.ts.
const MS_PER_DAY = 24 * 60 * 60 * 1000;

/** One friendly line per category, shown when its district wakes up. */
export const WAKE_MESSAGES: Record<TaskCategory, string> = {
  Study: 'The library is open again.',
  Health: 'The park is busy again.',
  Chores: 'The lights are back on in Utilities.',
  'Money/Admin': 'The market is open again.',
  Social: 'The café is buzzing again.',
  Projects: 'The workshop is humming again.',
};

/** Timestamp (ms) of the newest completed task in a category, or null if none. */
export function lastCompletedAt(
  tasks: Task[],
  category: TaskCategory,
): number | null {
  let latest: number | null = null;
  for (const task of tasks) {
    if (task.category !== category || task.completedAt === null) continue;
    const time = Date.parse(task.completedAt);
    // A hand-edited save may hold a date we can't read; skip it rather than
    // letting NaN make the category never go quiet.
    if (Number.isNaN(time)) continue;
    if (latest === null || time > latest) latest = time;
  }
  return latest;
}

export function isDormant(
  tasks: Task[],
  category: TaskCategory,
  now: Date,
): boolean {
  const latest = lastCompletedAt(tasks, category);
  // A category that was never used is simply empty, not asleep.
  if (latest === null) return false;
  return now.getTime() - latest >= DORMANT_AFTER_DAYS * MS_PER_DAY;
}

export function dormantCategories(tasks: Task[], now: Date): TaskCategory[] {
  return CATEGORIES.filter((category) => isDormant(tasks, category, now));
}

export function isBuildingDormant(
  def: BuildingDef,
  dormant: TaskCategory[],
): boolean {
  // Homes belong to no category, so they never sleep.
  return def.category !== null && dormant.includes(def.category);
}
