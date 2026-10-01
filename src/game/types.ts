// Shared types for everything the game knows about.
// This file is plain TypeScript: no React, no DOM, no localStorage.

/** Task categories — each one earns its own coins and funds a district. */
export const CATEGORIES = [
  'Study',
  'Health',
  'Chores',
  'Money/Admin',
  'Social',
  'Projects',
] as const;

export type TaskCategory = (typeof CATEGORIES)[number];

/** Task sizes — bigger tasks pay more coins (see config.ts). */
export const TASK_SIZES = ['S', 'M', 'L'] as const;

export type TaskSize = (typeof TASK_SIZES)[number];

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  size: TaskSize;
  /** Optional 'YYYY-MM-DD' date string, or null. */
  dueDate: string | null;
  /** ISO timestamp of when the task was created. */
  createdAt: string;
  /** ISO timestamp of completion, or null while the task is open. */
  completedAt: string | null;
}

/** One coin balance per category (e.g. "Study coins"). */
export type Wallet = Record<TaskCategory, number>;

/** The city is built in milestone 3; the shape exists now so saves stay stable. */
export interface CityData {
  buildings: unknown[];
}

/** Everything we persist — one object in localStorage. */
export interface SaveData {
  saveVersion: number;
  tasks: Task[];
  wallet: Wallet;
  city: CityData;
}
