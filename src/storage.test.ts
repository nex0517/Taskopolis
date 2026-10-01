import { describe, expect, it } from 'vitest';

import { newGame, serializeSave } from './game/save';
import type { SaveData } from './game/types';
import { loadSave, writeSave, type StorageLike } from './storage';

/** In-memory stand-in for localStorage. */
function fakeStorage(initial: Record<string, string> = {}) {
  const data = new Map<string, string>(Object.entries(initial));
  const storage: StorageLike = {
    getItem: (key) => data.get(key) ?? null,
    setItem: (key, value) => {
      data.set(key, value);
    },
  };
  return { storage, data };
}

const SAVE_KEY = 'taskopolis-save';
const BACKUP_KEY = 'taskopolis-save-backup';

function saveWithTask(): SaveData {
  const save = newGame();
  save.tasks.push({
    id: 't1',
    title: 'Do laundry',
    category: 'Chores',
    size: 'S',
    dueDate: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    completedAt: null,
  });
  return save;
}

describe('loadSave', () => {
  it('starts a fresh game when nothing is saved', () => {
    const { storage } = fakeStorage();
    const result = loadSave(storage);
    expect(result.status).toBe('new');
    expect(result.save).toEqual(newGame());
  });

  it('loads a valid save', () => {
    const save = saveWithTask();
    const { storage } = fakeStorage({ [SAVE_KEY]: serializeSave(save) });
    const result = loadSave(storage);
    expect(result.status).toBe('ok');
    expect(result.save).toEqual(save);
  });

  it('recovers from corrupted data: fresh save + bad data backed up', () => {
    const { storage, data } = fakeStorage({ [SAVE_KEY]: '{broken json' });
    const result = loadSave(storage);
    expect(result.status).toBe('corrupted');
    expect(result.save).toEqual(newGame());
    expect(data.get(BACKUP_KEY)).toBe('{broken json');
  });

  it('treats valid JSON with the wrong shape as corrupted', () => {
    const { storage, data } = fakeStorage({ [SAVE_KEY]: '[1,2,3]' });
    const result = loadSave(storage);
    expect(result.status).toBe('corrupted');
    expect(data.get(BACKUP_KEY)).toBe('[1,2,3]');
  });

  it('reports a different saveVersion as migrated', () => {
    const future = { ...newGame(), saveVersion: 2 };
    const { storage } = fakeStorage({ [SAVE_KEY]: serializeSave(future) });
    const result = loadSave(storage);
    expect(result.status).toBe('migrated');
    expect(result.save).toEqual(future);
  });
});

describe('writeSave + loadSave', () => {
  it('round-trips a save through storage (same as export then import)', () => {
    const save = saveWithTask();
    const { storage } = fakeStorage();
    writeSave(save, storage);
    const result = loadSave(storage);
    expect(result.status).toBe('ok');
    expect(result.save).toEqual(save);
  });
});
