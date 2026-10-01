import { describe, expect, it } from 'vitest';

import { neglectedCategories, DISTRICT_PROBLEMS, isOverdue, todayKey } from './neglect';
import { removeTask, setTaskCompleted } from './tasks';
import type { Task } from './types';
import { CATEGORIES } from './types';

const today = '2026-01-05';
const fixedNow = new Date(2026, 0, 5, 23, 30);

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Sample task',
    category: 'Study',
    size: 'S',
    dueDate: null,
    createdAt: '2026-01-01T12:00:00.000Z',
    completedAt: null,
    ...overrides,
  };
}

describe('isOverdue', () => {
  it('does not treat a task without a due date as overdue', () => {
    expect(isOverdue(makeTask(), today)).toBe(false);
  });

  it('does not treat a task due today as overdue', () => {
    expect(isOverdue(makeTask({ dueDate: today }), today)).toBe(false);
  });

  it('treats a task due yesterday as overdue', () => {
    expect(
      isOverdue(makeTask({ dueDate: '2026-01-04' }), today),
    ).toBe(true);
  });

  it('does not treat a task due tomorrow as overdue', () => {
    expect(
      isOverdue(makeTask({ dueDate: '2026-01-06' }), today),
    ).toBe(false);
  });

  it('does not treat a completed task as overdue', () => {
    expect(
      isOverdue(
        makeTask({
          dueDate: '2026-01-04',
          completedAt: '2026-01-05T08:00:00.000Z',
        }),
        today,
      ),
    ).toBe(false);
  });
});

describe('neglectedCategories', () => {
  it('returns no categories for an empty task list', () => {
    expect(neglectedCategories([], today)).toEqual([]);
  });

  it('returns overdue categories once each in CATEGORIES order', () => {
    const tasks = [
      makeTask({ id: 'health-1', category: 'Health', dueDate: '2026-01-01' }),
      makeTask({ id: 'health-2', category: 'Health', dueDate: '2026-01-02' }),
      makeTask({ id: 'study-1', category: 'Study', dueDate: '2026-01-03' }),
    ];
    expect(neglectedCategories(tasks, today)).toEqual(['Study', 'Health']);
  });

  it('ignores tasks that are not overdue', () => {
    const tasks = [
      makeTask({ dueDate: today }),
      makeTask({ id: 'future', category: 'Health', dueDate: '2026-01-06' }),
    ];
    expect(neglectedCategories(tasks, today)).toEqual([]);
  });

  it('clears a category when its overdue task is completed', () => {
    const tasks = [
      makeTask({ id: 'late', category: 'Health', dueDate: '2026-01-04' }),
    ];
    const completed = setTaskCompleted(tasks, 'late', true, fixedNow);
    expect(neglectedCategories(completed, today)).toEqual([]);
  });

  it('clears a category when its overdue task is deleted', () => {
    const tasks = [
      makeTask({ id: 'late', category: 'Health', dueDate: '2026-01-04' }),
    ];
    expect(neglectedCategories(removeTask(tasks, 'late'), today)).toEqual([]);
  });
});

describe('todayKey', () => {
  it('formats local calendar dates with zero-padded month and day', () => {
    expect(todayKey(new Date(2026, 0, 5, 23, 30))).toBe('2026-01-05');
    expect(todayKey(new Date(2026, 10, 30, 0, 5))).toBe('2026-11-30');
  });
});

describe('district problems', () => {
  it('has a non-empty problem for every category', () => {
    for (const category of CATEGORIES) {
      expect(DISTRICT_PROBLEMS[category].trim()).not.toBe('');
    }
  });
});
