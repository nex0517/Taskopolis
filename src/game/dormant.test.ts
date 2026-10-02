import { describe, expect, it } from 'vitest';

import { getBuilding } from './buildings';
import { DORMANT_AFTER_DAYS } from './config';
import {
  WAKE_MESSAGES,
  dormantCategories,
  isBuildingDormant,
  isDormant,
  lastCompletedAt,
} from './dormant';
import { setTaskCompleted } from './tasks';
import type { Task } from './types';
import { CATEGORIES } from './types';

const now = new Date(2026, 0, 15, 12, 0);

function daysAgo(days: number): string {
  return new Date(now.getTime() - days * 24 * 60 * 60 * 1000).toISOString();
}

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Sample task',
    category: 'Study',
    size: 'S',
    dueDate: null,
    createdAt: daysAgo(30),
    completedAt: null,
    ...overrides,
  };
}

describe('lastCompletedAt', () => {
  it('returns null when the category has no completed tasks', () => {
    expect(lastCompletedAt([makeTask()], 'Study')).toBeNull();
  });

  it('picks the newest completion and ignores other categories', () => {
    const tasks = [
      makeTask({ id: 'old', completedAt: daysAgo(10) }),
      makeTask({ id: 'new', completedAt: daysAgo(2) }),
      makeTask({ id: 'health', category: 'Health', completedAt: daysAgo(0) }),
      makeTask({ id: 'open' }),
    ];
    expect(lastCompletedAt(tasks, 'Study')).toBe(Date.parse(daysAgo(2)));
  });

  it('ignores a completedAt that is not a readable date', () => {
    const tasks = [
      makeTask({ id: 'bad', completedAt: 'yesterday' }),
      makeTask({ id: 'ok', completedAt: daysAgo(10) }),
    ];
    expect(lastCompletedAt(tasks, 'Study')).toBe(Date.parse(daysAgo(10)));
    expect(lastCompletedAt([tasks[0]], 'Study')).toBeNull();
    expect(isDormant(tasks, 'Study', now)).toBe(true);
  });
});

describe('isDormant', () => {
  it('is dormant at exactly DORMANT_AFTER_DAYS days', () => {
    const tasks = [makeTask({ completedAt: daysAgo(DORMANT_AFTER_DAYS) })];
    expect(isDormant(tasks, 'Study', now)).toBe(true);
  });

  it('is not dormant one day short of DORMANT_AFTER_DAYS', () => {
    const tasks = [makeTask({ completedAt: daysAgo(DORMANT_AFTER_DAYS - 1) })];
    expect(isDormant(tasks, 'Study', now)).toBe(false);
  });

  it('is not dormant when the category was never used', () => {
    expect(isDormant([], 'Study', now)).toBe(false);
    expect(isDormant([makeTask()], 'Study', now)).toBe(false);
  });
});

describe('dormantCategories', () => {
  it('lists dormant categories once each, in CATEGORIES order', () => {
    const tasks = [
      makeTask({ id: 'p1', category: 'Projects', completedAt: daysAgo(20) }),
      makeTask({ id: 'p2', category: 'Projects', completedAt: daysAgo(9) }),
      makeTask({ id: 's1', category: 'Study', completedAt: daysAgo(8) }),
      makeTask({ id: 'h1', category: 'Health', completedAt: daysAgo(1) }),
    ];
    expect(dormantCategories(tasks, now)).toEqual(['Study', 'Projects']);
  });

  it('wakes a category as soon as one of its tasks is completed', () => {
    const tasks = [
      makeTask({ id: 'old', completedAt: daysAgo(12) }),
      makeTask({ id: 'todo' }),
    ];
    expect(dormantCategories(tasks, now)).toEqual(['Study']);
    const woken = setTaskCompleted(tasks, 'todo', true, now);
    expect(dormantCategories(woken, now)).toEqual([]);
  });

  it('goes dormant again when the only recent task is un-completed', () => {
    const tasks = [
      makeTask({ id: 'old', completedAt: daysAgo(12) }),
      makeTask({ id: 'recent', completedAt: daysAgo(1) }),
    ];
    expect(dormantCategories(tasks, now)).toEqual([]);
    const undone = setTaskCompleted(tasks, 'recent', false, now);
    expect(dormantCategories(undone, now)).toEqual(['Study']);
  });

  it('is only empty, not dormant, when the only completed task is undone', () => {
    const tasks = [makeTask({ id: 'only', completedAt: daysAgo(1) })];
    const undone = setTaskCompleted(tasks, 'only', false, now);
    expect(dormantCategories(undone, now)).toEqual([]);
  });
});

describe('isBuildingDormant', () => {
  it('never marks a home as dormant', () => {
    expect(isBuildingDormant(getBuilding('home'), [...CATEGORIES])).toBe(false);
  });

  it('marks a district building dormant only when its category is', () => {
    expect(isBuildingDormant(getBuilding('school'), ['Study'])).toBe(true);
    expect(isBuildingDormant(getBuilding('school'), ['Health'])).toBe(false);
  });
});

describe('wake messages', () => {
  it('has a non-empty message for every category', () => {
    for (const category of CATEGORIES) {
      expect(WAKE_MESSAGES[category].trim()).not.toBe('');
    }
  });
});
