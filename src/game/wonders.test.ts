import { describe, expect, it } from 'vitest';

import {
  GRID_SIZE,
  LARGE_TASK_REWARD,
  MEDIUM_TASK_REWARD,
  WONDER_STAGE_THRESHOLDS,
  WONDER_TOTAL,
} from './config';
import { placeBuilding } from './city';
import { newGame } from './save';
import type { CityData, Goal, Task } from './types';
import {
  abandonGoal,
  activeGoals,
  addGoal,
  addProgress,
  applyTaskProgress,
  canPlaceWonder,
  finishGoal,
  isWonderComplete,
  validGoalLink,
  wonderAt,
  wonderStage,
  wonderStageIndex,
  wonderTiles,
} from './wonders';

const now = new Date('2026-10-01T12:00:00Z');

function goal(overrides: Partial<Goal> = {}): Goal {
  return {
    id: 'goal-1',
    title: 'Finish the thesis',
    category: 'Study',
    row: 2,
    col: 2,
    progress: 0,
    status: 'active',
    createdAt: '2026-09-01T00:00:00.000Z',
    closedAt: null,
    ...overrides,
  };
}

function linkedTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Write chapter 2',
    category: 'Study',
    size: 'M',
    dueDate: null,
    createdAt: '2026-09-30T00:00:00.000Z',
    completedAt: null,
    goalId: 'goal-1',
    ...overrides,
  };
}

const emptyCity: CityData = { buildings: [] };

describe('wonder stages', () => {
  it('starts at the foundation with no progress', () => {
    expect(wonderStage(0)).toBe('foundation');
    expect(wonderStageIndex(0)).toBe(0);
  });

  it('changes stage exactly at each threshold', () => {
    const [, frame, walls, finished] = WONDER_STAGE_THRESHOLDS;
    expect(wonderStage(frame - 1)).toBe('foundation');
    expect(wonderStage(frame)).toBe('frame');
    expect(wonderStage(walls - 1)).toBe('frame');
    expect(wonderStage(walls)).toBe('walls');
    expect(wonderStage(finished - 1)).toBe('walls');
    expect(wonderStage(finished)).toBe('finished');
  });

  it('stays finished past the total', () => {
    expect(wonderStage(WONDER_TOTAL + 100)).toBe('finished');
  });

  it('is complete at the default total of 40', () => {
    expect(WONDER_TOTAL).toBe(40);
    expect(isWonderComplete({ progress: 39 })).toBe(false);
    expect(isWonderComplete({ progress: 40 })).toBe(true);
  });
});

describe('progress from linked tasks', () => {
  it('adds the coin value of a completed linked task', () => {
    const goals = applyTaskProgress([goal()], linkedTask({ size: 'L' }), true);
    expect(goals[0].progress).toBe(LARGE_TASK_REWARD);
  });

  it('removes the same amount when the task is un-completed', () => {
    const task = linkedTask({ size: 'M' });
    const after = applyTaskProgress([goal()], task, true);
    expect(after[0].progress).toBe(MEDIUM_TASK_REWARD);
    const undone = applyTaskProgress(after, task, false);
    expect(undone[0].progress).toBe(0);
  });

  it('ignores tasks with no goal and tasks linked to another goal', () => {
    const goals = [goal()];
    expect(applyTaskProgress(goals, linkedTask({ goalId: null }), true)).toBe(
      goals,
    );
    const other = applyTaskProgress(
      goals,
      linkedTask({ goalId: 'nope' }),
      true,
    );
    expect(other[0].progress).toBe(0);
  });

  it('never goes below zero', () => {
    expect(addProgress([goal({ progress: 1 })], 'goal-1', -5)[0].progress).toBe(
      0,
    );
  });

  it('does not change a finished or abandoned goal', () => {
    const finished = goal({ status: 'finished', progress: 40 });
    const abandoned = goal({ id: 'goal-2', status: 'abandoned', progress: 7 });
    const task = linkedTask();
    expect(applyTaskProgress([finished], task, true)[0].progress).toBe(40);
    expect(applyTaskProgress([finished], task, false)[0].progress).toBe(40);
    const task2 = linkedTask({ goalId: 'goal-2' });
    expect(applyTaskProgress([abandoned], task2, true)[0].progress).toBe(7);
  });

  it('does not touch the original goals array', () => {
    const goals = [goal()];
    applyTaskProgress(goals, linkedTask(), true);
    expect(goals[0].progress).toBe(0);
  });
});

describe('2x2 placement', () => {
  it('fits on empty ground', () => {
    expect(canPlaceWonder(emptyCity, [], 0, 0)).toEqual({ ok: true });
    expect(canPlaceWonder(emptyCity, [], GRID_SIZE - 2, GRID_SIZE - 2)).toEqual(
      {
        ok: true,
      },
    );
  });

  it('is blocked by the grid edge', () => {
    expect(canPlaceWonder(emptyCity, [], GRID_SIZE - 1, 0)).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    });
    expect(canPlaceWonder(emptyCity, [], 0, GRID_SIZE - 1)).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    });
    expect(canPlaceWonder(emptyCity, [], -1, 0).ok).toBe(false);
    expect(canPlaceWonder(emptyCity, [], 1.5, 0).ok).toBe(false);
  });

  it('is blocked by a building under any of its four tiles', () => {
    for (const [row, col] of [
      [0, 0],
      [0, 1],
      [1, 0],
      [1, 1],
    ]) {
      const city: CityData = { buildings: [{ type: 'home', row, col }] };
      expect(canPlaceWonder(city, [], 0, 0)).toEqual({
        ok: false,
        reason: 'occupied',
      });
    }
    // A building just outside the footprint is fine.
    const city: CityData = { buildings: [{ type: 'home', row: 2, col: 0 }] };
    expect(canPlaceWonder(city, [], 0, 0)).toEqual({ ok: true });
  });

  it('is blocked by another Wonder, even an abandoned one', () => {
    const existing = goal({ row: 2, col: 2, status: 'abandoned' });
    // Overlapping by one tile (bottom-right of the new one hits top-left of the old).
    expect(canPlaceWonder(emptyCity, [existing], 1, 1)).toEqual({
      ok: false,
      reason: 'occupied',
    });
    expect(canPlaceWonder(emptyCity, [existing], 3, 3).ok).toBe(false);
    expect(canPlaceWonder(emptyCity, [existing], 0, 0)).toEqual({ ok: true });
    expect(canPlaceWonder(emptyCity, [existing], 4, 2)).toEqual({ ok: true });
  });

  it('covers exactly four tiles', () => {
    expect(wonderTiles({ row: 3, col: 5 })).toEqual([
      { row: 3, col: 5 },
      { row: 3, col: 6 },
      { row: 4, col: 5 },
      { row: 4, col: 6 },
    ]);
    const g = goal({ row: 3, col: 5 });
    expect(wonderAt([g], 4, 6)).toBe(g);
    expect(wonderAt([g], 5, 5)).toBeUndefined();
    expect(wonderAt([g], 3, 4)).toBeUndefined();
  });

  it('stops ordinary buildings from being placed under a Wonder', () => {
    const wallet = { ...newGame().wallet, Study: 100 };
    const blocked = placeBuilding(emptyCity, wallet, 'school', 3, 3, [goal()]);
    expect(blocked).toEqual({ ok: false, reason: 'occupied' });
    const beside = placeBuilding(emptyCity, wallet, 'school', 4, 3, [goal()]);
    expect(beside.ok).toBe(true);
  });
});

describe('addGoal', () => {
  const draft = {
    title: '  Learn piano ',
    category: 'Social' as const,
    row: 0,
    col: 0,
  };

  it('creates an active goal at stage 0 with a trimmed title', () => {
    const result = addGoal([], emptyCity, draft, now);
    expect(result.ok).toBe(true);
    if (!result.ok) return;
    expect(result.goals).toHaveLength(1);
    expect(result.goal).toMatchObject({
      title: 'Learn piano',
      category: 'Social',
      row: 0,
      col: 0,
      progress: 0,
      status: 'active',
      createdAt: now.toISOString(),
      closedAt: null,
    });
    expect(result.goal.id).toBeTruthy();
  });

  it('refuses a blank title or a bad spot', () => {
    expect(addGoal([], emptyCity, { ...draft, title: '   ' })).toEqual({
      ok: false,
      reason: 'empty-title',
    });
    expect(addGoal([goal({ row: 0, col: 0 })], emptyCity, draft)).toEqual({
      ok: false,
      reason: 'occupied',
    });
    expect(addGoal([], emptyCity, { ...draft, row: GRID_SIZE - 1 })).toEqual({
      ok: false,
      reason: 'out-of-bounds',
    });
  });

  it('allows several goals, even in the same category', () => {
    const first = addGoal([], emptyCity, draft, now);
    if (!first.ok) throw new Error('first failed');
    const second = addGoal(first.goals, emptyCity, { ...draft, row: 4 }, now);
    expect(second.ok).toBe(true);
    if (second.ok) expect(second.goals).toHaveLength(2);
  });
});

describe('finishing and abandoning', () => {
  it('finishes only an active goal that has reached the total', () => {
    const notYet = finishGoal(
      [goal({ progress: WONDER_TOTAL - 1 })],
      'goal-1',
      now,
    );
    expect(notYet[0].status).toBe('active');
    const done = finishGoal([goal({ progress: WONDER_TOTAL })], 'goal-1', now);
    expect(done[0]).toMatchObject({
      status: 'finished',
      closedAt: now.toISOString(),
      progress: WONDER_TOTAL,
    });
  });

  it('abandons an active goal and keeps its progress', () => {
    const left = abandonGoal([goal({ progress: 12 })], 'goal-1', now);
    expect(left[0]).toMatchObject({
      status: 'abandoned',
      progress: 12,
      closedAt: now.toISOString(),
    });
    expect(wonderStage(left[0].progress)).toBe('frame');
  });

  it('leaves other goals and already-closed goals alone', () => {
    const goals = [
      goal({ id: 'a', status: 'finished', progress: 40, closedAt: 'x' }),
      goal({ id: 'b' }),
    ];
    expect(abandonGoal(goals, 'a', now)).toEqual(goals);
    expect(finishGoal(goals, 'missing', now)).toEqual(goals);
  });
});

describe('linking rules', () => {
  const goals = [
    goal({ id: 'study', category: 'Study' }),
    goal({ id: 'health', category: 'Health', row: 6 }),
    goal({ id: 'old', category: 'Study', row: 8, status: 'abandoned' }),
  ];

  it('lists only active goals, optionally per category', () => {
    expect(activeGoals(goals).map((g) => g.id)).toEqual(['study', 'health']);
    expect(activeGoals(goals, 'Study').map((g) => g.id)).toEqual(['study']);
    expect(activeGoals(goals, 'Chores')).toEqual([]);
  });

  it('keeps a link only to an active goal of the same category', () => {
    expect(validGoalLink(goals, 'Study', 'study')).toBe('study');
    expect(validGoalLink(goals, 'Health', 'study')).toBeNull();
    expect(validGoalLink(goals, 'Study', 'old')).toBeNull();
    expect(validGoalLink(goals, 'Study', 'missing')).toBeNull();
    expect(validGoalLink(goals, 'Study', null)).toBeNull();
  });
});
