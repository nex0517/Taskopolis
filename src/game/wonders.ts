// Wonders: long-term goals shown in the city as giant 2x2 buildings.
// Pure functions only — data in, new data out.

import {
  GRID_SIZE,
  WONDER_SIZE,
  WONDER_STAGE_THRESHOLDS,
  WONDER_TOTAL,
} from './config';
import { rewardForTask } from './economy';
import type { CityData, Goal, Task, TaskCategory } from './types';

/** The four looks a Wonder goes through, matching WONDER_STAGE_THRESHOLDS. */
export const WONDER_STAGES = [
  'foundation',
  'frame',
  'walls',
  'finished',
] as const;

export type WonderStage = (typeof WONDER_STAGES)[number];

/** 0–3: the highest stage whose threshold this much progress has reached. */
export function wonderStageIndex(progress: number): number {
  let index = 0;
  WONDER_STAGE_THRESHOLDS.forEach((threshold, i) => {
    if (progress >= threshold) index = i;
  });
  return index;
}

export function wonderStage(progress: number): WonderStage {
  return WONDER_STAGES[wonderStageIndex(progress)];
}

/** True once the Wonder has all the progress it needs. */
export function isWonderComplete(goal: Pick<Goal, 'progress'>): boolean {
  return goal.progress >= WONDER_TOTAL;
}

export interface Tile {
  row: number;
  col: number;
}

/** The tiles a Wonder covers when its top-left corner is on `origin`. */
export function wonderTiles(origin: Tile): Tile[] {
  const tiles: Tile[] = [];
  for (let r = 0; r < WONDER_SIZE; r++) {
    for (let c = 0; c < WONDER_SIZE; c++) {
      tiles.push({ row: origin.row + r, col: origin.col + c });
    }
  }
  return tiles;
}

/** The goal whose Wonder covers this tile, if any. */
export function wonderAt(
  goals: Goal[],
  row: number,
  col: number,
): Goal | undefined {
  return goals.find(
    (goal) =>
      row >= goal.row &&
      row < goal.row + WONDER_SIZE &&
      col >= goal.col &&
      col < goal.col + WONDER_SIZE,
  );
}

export type WonderPlaceFailure = 'out-of-bounds' | 'occupied';

export type WonderPlaceCheck =
  { ok: true } | { ok: false; reason: WonderPlaceFailure };

/** Can a Wonder stand with its top-left corner on (row, col)? */
export function canPlaceWonder(
  city: CityData,
  goals: Goal[],
  row: number,
  col: number,
): WonderPlaceCheck {
  if (
    !Number.isInteger(row) ||
    !Number.isInteger(col) ||
    row < 0 ||
    col < 0 ||
    row + WONDER_SIZE > GRID_SIZE ||
    col + WONDER_SIZE > GRID_SIZE
  ) {
    return { ok: false, reason: 'out-of-bounds' };
  }
  for (const tile of wonderTiles({ row, col })) {
    const hasBuilding = city.buildings.some(
      (building) => building.row === tile.row && building.col === tile.col,
    );
    if (hasBuilding || wonderAt(goals, tile.row, tile.col)) {
      return { ok: false, reason: 'occupied' };
    }
  }
  return { ok: true };
}

/** What the goal form collects. (row, col) is the Wonder's top-left tile. */
export interface GoalDraft {
  title: string;
  category: TaskCategory;
  row: number;
  col: number;
}

export type AddGoalResult =
  | { ok: true; goals: Goal[]; goal: Goal }
  | { ok: false; reason: WonderPlaceFailure | 'empty-title' };

/** Start a new goal with its Wonder at stage 0. `now` is injectable for tests. */
export function addGoal(
  goals: Goal[],
  city: CityData,
  draft: GoalDraft,
  now: Date = new Date(),
): AddGoalResult {
  const title = draft.title.trim();
  if (title === '') return { ok: false, reason: 'empty-title' };
  const spot = canPlaceWonder(city, goals, draft.row, draft.col);
  if (!spot.ok) return spot;
  const goal: Goal = {
    id: crypto.randomUUID(),
    title,
    category: draft.category,
    row: draft.row,
    col: draft.col,
    progress: 0,
    status: 'active',
    createdAt: now.toISOString(),
    closedAt: null,
  };
  return { ok: true, goals: [...goals, goal], goal };
}

/** Goals still being worked on, optionally only those of one category. */
export function activeGoals(goals: Goal[], category?: TaskCategory): Goal[] {
  return goals.filter(
    (goal) =>
      goal.status === 'active' &&
      (category === undefined || goal.category === category),
  );
}

/** A task may only link to an active goal of its own category; anything else means no goal. */
export function validGoalLink(
  goals: Goal[],
  category: TaskCategory,
  goalId: string | null,
): string | null {
  if (goalId === null) return null;
  const linkable = activeGoals(goals, category).some(
    (goal) => goal.id === goalId,
  );
  return linkable ? goalId : null;
}

/** Add progress to one active goal (negative takes it away, never below 0). */
export function addProgress(
  goals: Goal[],
  goalId: string | null,
  amount: number,
): Goal[] {
  if (goalId === null) return goals;
  return goals.map((goal) =>
    goal.id === goalId && goal.status === 'active'
      ? { ...goal, progress: Math.max(0, goal.progress + amount) }
      : goal,
  );
}

/** Completing a linked task adds its coin value as progress; un-completing takes it back. */
export function applyTaskProgress(
  goals: Goal[],
  task: Pick<Task, 'goalId' | 'size'>,
  completing: boolean,
): Goal[] {
  const amount = rewardForTask(task);
  return addProgress(goals, task.goalId, completing ? amount : -amount);
}

/** Mark a complete, active goal as finished. Anything else is left alone. */
export function finishGoal(
  goals: Goal[],
  id: string,
  now: Date = new Date(),
): Goal[] {
  return goals.map((goal) =>
    goal.id === id && goal.status === 'active' && isWonderComplete(goal)
      ? { ...goal, status: 'finished', closedAt: now.toISOString() }
      : goal,
  );
}

/** Give up on an active goal. Its Wonder stays at its current stage. */
export function abandonGoal(
  goals: Goal[],
  id: string,
  now: Date = new Date(),
): Goal[] {
  return goals.map((goal) =>
    goal.id === id && goal.status === 'active'
      ? { ...goal, status: 'abandoned', closedAt: now.toISOString() }
      : goal,
  );
}
