// The ONLY file that talks to localStorage.
// The storage object is injectable so tests can pass a fake instead of a DOM.

import { newGame, parseSave, serializeSave } from './game/save';
import type { SaveData } from './game/types';

const SAVE_KEY = 'taskopolis-save';
const BACKUP_KEY = 'taskopolis-save-backup';

/** The smallest slice of Storage we actually use. */
export type StorageLike = Pick<Storage, 'getItem' | 'setItem'>;

export type LoadStatus =
  | 'new' // nothing saved yet
  | 'ok' // a current-version save loaded fine
  | 'corrupted' // bad data — backed up, started fresh
  | 'migrated'; // an older saveVersion was upgraded by migrate()

export interface LoadResult {
  save: SaveData;
  status: LoadStatus;
}

/**
 * Read the save from storage, handling every edge case:
 * - nothing saved yet -> fresh game
 * - corrupted data    -> copy it to a backup key so it's not lost, start fresh
 * - an older version   -> upgraded by migrate() inside parseSave()
 * `now` is injectable so tests get a predictable season start time.
 */
export function loadSave(
  storage: StorageLike = window.localStorage,
  now: Date = new Date(),
): LoadResult {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) {
    return { save: newGame(now), status: 'new' };
  }

  const parsed = parseSave(raw, now);
  if (parsed === null) {
    storage.setItem(BACKUP_KEY, raw); // keep the bad data, just out of the way
    return { save: newGame(now), status: 'corrupted' };
  }

  return { save: parsed.save, status: parsed.migrated ? 'migrated' : 'ok' };
}

/** Persist the save. Callers use this after every change. */
export function writeSave(
  save: SaveData,
  storage: StorageLike = window.localStorage,
): void {
  storage.setItem(SAVE_KEY, serializeSave(save));
}
