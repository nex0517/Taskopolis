import { describe, expect, it } from 'vitest';

import { SAVE_VERSION } from './config';
import { newGame, parseSave, serializeSave } from './save';
import { CATEGORIES } from './types';

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
    expect(parseSave(serializeSave(save))).toEqual(save);
  });

  it('sends other saveVersions through migrate() and still returns data', () => {
    const save = { ...newGame(), saveVersion: 99 };
    expect(parseSave(serializeSave(save))).toEqual(save);
  });
});
