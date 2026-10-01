// The ONLY file that talks to localStorage.
// The storage object is injectable so tests can pass a fake instead of a DOM.

import { SAVE_VERSION } from './game/config';
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
  | 'migrated'; // a different saveVersion went through migrate()

export interface LoadResult {
  save: SaveData;
  status: LoadStatus;
}

/**
 * Read the save from storage, handling every edge case:
 * - nothing saved yet -> fresh game
 * - corrupted data    -> copy it to a backup key so it's not lost, start fresh
 * - another version    -> run through migrate() (a no-op for now)
 */
export function loadSave(
  storage: StorageLike = window.localStorage,
): LoadResult {
  const raw = storage.getItem(SAVE_KEY);
  if (raw === null) {
    return { save: newGame(), status: 'new' };
  }

  const save = parseSave(raw);
  if (save === null) {
    storage.setItem(BACKUP_KEY, raw); // keep the bad data, just out of the way
    return { save: newGame(), status: 'corrupted' };
  }

  return {
    save,
    status: save.saveVersion === SAVE_VERSION ? 'ok' : 'migrated',
  };
}

/** Persist the save. Callers use this after every change. */
export function writeSave(
  save: SaveData,
  storage: StorageLike = window.localStorage,
): void {
  storage.setItem(SAVE_KEY, serializeSave(save));
}
