import { describe, expect, it } from 'vitest';

import { SAVE_VERSION } from './config';
import { newGame, parseSave, serializeSave } from './save';
import { CATEGORIES } from './types';

function saveWithDueDate(dueDate: string | null) {
  const save = newGame();
  save.tasks.push({
    id: 'task-1',
    title: 'Task with due date',
    category: 'Study',
    size: 'S',
    dueDate,
    createdAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
  });
  return save;
}

describe('newGame', () => {
  it('starts empty with a zeroed wallet for every category', () => {
    const save = newGame();
    expect(save.saveVersion).toBe(SAVE_VERSION);
    expect(save.tasks).toEqual([]);
    expect(save.city).toEqual({ buildings: [] });
    for (const category of CATEGORIES) {
      expect(save.wallet[category]).toBe(0);
    }
  });
});

describe('parseSave', () => {
  it('returns null for missing input', () => {
    expect(parseSave(null)).toBeNull();
  });

  it('returns null for text that is not JSON', () => {
    expect(parseSave('not json at all')).toBeNull();
    expect(parseSave('{')).toBeNull();
  });

  it('returns null for JSON that is not a save object', () => {
    expect(parseSave('"hello"')).toBeNull();
    expect(parseSave('[1,2,3]')).toBeNull();
    expect(parseSave('{"saveVersion": 1}')).toBeNull(); // missing fields
  });

  it('returns null when a task is malformed', () => {
    const save = newGame();
    const bad = { ...save, tasks: [{ title: 'no id or fields' }] };
    expect(parseSave(JSON.stringify(bad))).toBeNull();
  });

  it.each(['', '2026-1-4'])(
    'rejects a noncanonical task due date: %s',
    (dueDate) => {
      const save = saveWithDueDate(dueDate);
      expect(parseSave(serializeSave(save))).toBeNull();
    },
  );

  it.each(['2026-01-04', null])(
    'parses a task with a valid due date: %s',
    (dueDate) => {
      const save = saveWithDueDate(dueDate);
      expect(parseSave(serializeSave(save))).toEqual(save);
    },
  );

  it('round-trips: serialize then parse gives identical data', () => {
    const save = newGame();
    save.tasks.push({
      id: 't1',
      title: 'Task one',
      category: 'Chores',
      size: 'S',
      dueDate: null,
      createdAt: '2026-10-01T00:00:00.000Z',
      completedAt: '2026-10-01T01:00:00.000Z',
    });
    save.wallet.Chores = 7;
    save.city.buildings.push({ type: 'home', row: 0, col: 1 });
    expect(parseSave(serializeSave(save))).toEqual(save);
  });

  it('rejects an unknown building type', () => {
    const save = { ...newGame(), city: { buildings: [{ type: 'castle', row: 0, col: 0 }] } };
    expect(parseSave(JSON.stringify(save))).toBeNull();
  });

  it.each([
    { type: 'home', row: -1, col: 0 },
    { type: 'home', row: 0, col: 12 },
    { type: 'home', row: 1.5, col: 0 },
    { type: 'home', row: 0, col: 1.5 },
  ])('rejects an invalid building position: %o', (building) => {
    const save = { ...newGame(), city: { buildings: [building] } };
    expect(parseSave(JSON.stringify(save))).toBeNull();
  });

  it('still parses an old save with an empty buildings array', () => {
    const save = newGame();
    expect(parseSave(serializeSave(save))).toEqual(save);
  });

  it('rejects buildings that overlap the same tile', () => {
    const save = {
      ...newGame(),
      city: {
        buildings: [
          { type: 'home', row: 0, col: 0 },
          { type: 'school', row: 0, col: 0 },
        ],
      },
    };
    expect(parseSave(JSON.stringify(save))).toBeNull();
  });

  it('parses buildings on different tiles', () => {
    const save = newGame();
    save.city.buildings.push(
      { type: 'home', row: 0, col: 0 },
      { type: 'school', row: 0, col: 1 },
    );
    expect(parseSave(serializeSave(save))).toEqual(save);
  });

  it('sends other saveVersions through migrate() and still returns data', () => {
    const save = { ...newGame(), saveVersion: 99 };
    expect(parseSave(serializeSave(save))).toEqual(save);
  });
});
