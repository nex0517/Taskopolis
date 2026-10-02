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
const now = new Date('2026-10-02T12:00:00.000Z');

function saveWithTask(): SaveData {
  const save = newGame(now);
  save.tasks.push({
    id: 't1',
    title: 'Do laundry',
    category: 'Chores',
    size: 'S',
    dueDate: null,
    createdAt: '2026-10-01T00:00:00.000Z',
    completedAt: null,
    goalId: null,
  });
  return save;
}

describe('loadSave', () => {
  it('starts a fresh game when nothing is saved', () => {
    const { storage } = fakeStorage();
    const result = loadSave(storage, now);
    expect(result.status).toBe('new');
    expect(result.save).toEqual(newGame(now));
  });

  it('loads a valid save', () => {
    const save = saveWithTask();
    const { storage } = fakeStorage({ [SAVE_KEY]: serializeSave(save) });
    const result = loadSave(storage, now);
    expect(result.status).toBe('ok');
    expect(result.save).toEqual(save);
  });

  it('recovers from corrupted data: fresh save + bad data backed up', () => {
    const { storage, data } = fakeStorage({ [SAVE_KEY]: '{broken json' });
    const result = loadSave(storage, now);
    expect(result.status).toBe('corrupted');
    expect(result.save).toEqual(newGame(now));
    expect(data.get(BACKUP_KEY)).toBe('{broken json');
  });

  it('treats valid JSON with the wrong shape as corrupted', () => {
    const { storage, data } = fakeStorage({ [SAVE_KEY]: '[1,2,3]' });
    const result = loadSave(storage, now);
    expect(result.status).toBe('corrupted');
    expect(data.get(BACKUP_KEY)).toBe('[1,2,3]');
  });

  it('upgrades a version-1 save and reports it as migrated', () => {
    const { tasks, wallet, city } = saveWithTask();
    const old = { saveVersion: 1, tasks, wallet, city };
    const { storage } = fakeStorage({ [SAVE_KEY]: JSON.stringify(old) });
    const result = loadSave(storage, now);
    expect(result.status).toBe('migrated');
    expect(result.save).toEqual({
      ...saveWithTask(),
      // Season 1 starts at the oldest task, not at `now`.
      seasons: {
        current: { number: 1, startedAt: '2026-10-01T00:00:00.000Z' },
        archive: [],
      },
    });
  });

  it('treats a damaged version-2 save as corrupted: fresh save + backup', () => {
    const damaged = {
      ...saveWithTask(),
      seasons: { current: null, archive: [] },
    };
    const raw = JSON.stringify(damaged);
    const { storage, data } = fakeStorage({ [SAVE_KEY]: raw });
    const result = loadSave(storage, now);
    expect(result.status).toBe('corrupted');
    expect(result.save).toEqual(newGame(now));
    expect(data.get(BACKUP_KEY)).toBe(raw);
  });

  it('treats a save from an unknown future version as corrupted', () => {
    const raw = JSON.stringify({ ...saveWithTask(), saveVersion: 99 });
    const { storage, data } = fakeStorage({ [SAVE_KEY]: raw });
    const result = loadSave(storage, now);
    expect(result.status).toBe('corrupted');
    expect(data.get(BACKUP_KEY)).toBe(raw);
  });
});

describe('writeSave + loadSave', () => {
  it('round-trips a save through storage (same as export then import)', () => {
    const save = saveWithTask();
    const { storage } = fakeStorage();
    writeSave(save, storage);
    const result = loadSave(storage, now);
    expect(result.status).toBe('ok');
    expect(result.save).toEqual(save);
  });
});
