import { describe, expect, it } from 'vitest';

import {
  addTask,
  removeTask,
  setTaskCompleted,
  updateTask,
  type TaskDraft,
} from './tasks';
import type { Task } from './types';

const draft: TaskDraft = {
  title: 'Read chapter 3',
  category: 'Study',
  size: 'M',
  dueDate: '2026-10-05',
  goalId: null,
};

const now = new Date('2026-10-01T12:00:00Z');

function makeTask(overrides: Partial<Task> = {}): Task {
  return {
    id: 'task-1',
    title: 'Existing task',
    category: 'Health',
    size: 'S',
    dueDate: null,
    createdAt: '2026-09-30T00:00:00.000Z',
    completedAt: null,
    goalId: null,
    ...overrides,
  };
}

describe('addTask', () => {
  it('appends a new task with generated fields filled in', () => {
    const tasks = addTask([], draft, now);
    expect(tasks).toHaveLength(1);
    const task = tasks[0];
    expect(task.id).toBeTruthy();
    expect(task.title).toBe('Read chapter 3');
    expect(task.category).toBe('Study');
    expect(task.size).toBe('M');
    expect(task.dueDate).toBe('2026-10-05');
    expect(task.createdAt).toBe('2026-10-01T12:00:00.000Z');
    expect(task.completedAt).toBeNull();
  });

  it('trims the title and leaves the original array untouched', () => {
    const tasks = [makeTask()];
    const result = addTask(tasks, { ...draft, title: '  spaced  ' }, now);
    expect(result).toHaveLength(2);
    expect(result[1].title).toBe('spaced');
    expect(tasks).toHaveLength(1); // no mutation
  });
});

describe('setTaskCompleted', () => {
  it('marks a task done with a timestamp', () => {
    const tasks = setTaskCompleted([makeTask()], 'task-1', true, now);
    expect(tasks[0].completedAt).toBe('2026-10-01T12:00:00.000Z');
  });

  it('un-completes by clearing the timestamp', () => {
    const done = makeTask({ completedAt: '2026-10-01T00:00:00.000Z' });
    const tasks = setTaskCompleted([done], 'task-1', false, now);
    expect(tasks[0].completedAt).toBeNull();
  });

  it('only touches the task with the matching id', () => {
    const other = makeTask({ id: 'task-2' });
    const tasks = setTaskCompleted([makeTask(), other], 'task-2', true, now);
    expect(tasks[0].completedAt).toBeNull();
    expect(tasks[1].completedAt).not.toBeNull();
  });
});

describe('updateTask', () => {
  it('replaces the editable fields', () => {
    const tasks = updateTask([makeTask()], 'task-1', {
      title: 'New title',
      category: 'Social',
      size: 'L',
      dueDate: '2026-12-01',
      goalId: null,
    });
    expect(tasks[0]).toMatchObject({
      title: 'New title',
      category: 'Social',
      size: 'L',
      dueDate: '2026-12-01',
    });
    // generated fields are preserved
    expect(tasks[0].createdAt).toBe('2026-09-30T00:00:00.000Z');
  });

  it('keeps category and size when editing a completed task', () => {
    const completed = makeTask({
      category: 'Health',
      size: 'S',
      completedAt: '2026-10-01T00:00:00.000Z',
    });
    const tasks = updateTask([completed], 'task-1', {
      title: '  Updated title  ',
      category: 'Social',
      size: 'L',
      dueDate: '2026-12-01',
      goalId: null,
    });
    expect(tasks[0]).toMatchObject({
      title: 'Updated title',
      category: 'Health',
      size: 'S',
      dueDate: '2026-12-01',
    });
  });
});

describe('goal links', () => {
  it('stores the goal a new task is linked to', () => {
    const tasks = addTask([], { ...draft, goalId: 'goal-1' }, now);
    expect(tasks[0].goalId).toBe('goal-1');
  });

  it('can link and unlink an open task', () => {
    const linked = updateTask([makeTask()], 'task-1', {
      ...draft,
      goalId: 'goal-1',
    });
    expect(linked[0].goalId).toBe('goal-1');
    const unlinked = updateTask(linked, 'task-1', { ...draft, goalId: null });
    expect(unlinked[0].goalId).toBeNull();
  });

  it('keeps the link of a completed task, like its category and size', () => {
    const done = makeTask({
      goalId: 'goal-1',
      completedAt: '2026-10-01T00:00:00.000Z',
    });
    const tasks = updateTask([done], 'task-1', { ...draft, goalId: null });
    expect(tasks[0].goalId).toBe('goal-1');
  });
});

describe('removeTask', () => {
  it('deletes the task with the given id', () => {
    const tasks = removeTask(
      [makeTask(), makeTask({ id: 'task-2' })],
      'task-1',
    );
    expect(tasks).toHaveLength(1);
    expect(tasks[0].id).toBe('task-2');
  });
});
