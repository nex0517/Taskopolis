// Upgrades old save data to the current format, one version step at a time.
// Pure functions only: the caller (save.ts) has already checked the shape.

import { SAVE_VERSION } from './config';
import type {
  ArchivedSeason,
  CityData,
  CurrentSeason,
  Goal,
  Keepsake,
  SaveData,
  Task,
  Wallet,
} from './types';

/** A task as saved before version 3, when tasks had no goal link yet. */
export type TaskV2 = Omit<Task, 'goalId'>;

/** The fields every save version has had since Milestone 1. */
export interface CoreSave {
  saveVersion: number;
  tasks: TaskV2[];
  wallet: Wallet;
  city: CityData;
}

/** Version 1 (Milestones 1–6) had nothing beyond the core fields. */
export type SaveV1 = CoreSave;

/** Version 2 (Milestones 7–8) added seasons, an empty goals list and the
 *  keepsake. Archived seasons did not record goals yet. */
export interface SaveV2 extends CoreSave {
  seasons: {
    current: CurrentSeason;
    archive: Omit<ArchivedSeason, 'goals'>[];
  };
  goals: Goal[];
  keepsake: Keepsake | null;
}

/**
 * Bring any known save version up to SAVE_VERSION, one step at a time.
 * Returns null for a version we don't know how to read (for example a file
 * from a newer app), so the caller can treat it like a corrupted save.
 */
export function migrate(
  data: CoreSave,
  now: Date = new Date(),
): SaveData | null {
  let save: CoreSave = data;
  if (save.saveVersion === 1) save = migrateV1ToV2(save, now);
  if (save.saveVersion === 2) save = migrateV2ToV3(save as SaveV2);
  return save.saveVersion === SAVE_VERSION ? (save as SaveData) : null;
}

/** v1 → v2: the existing city becomes season 1, started when the first task was. */
function migrateV1ToV2(data: SaveV1, now: Date): SaveV2 {
  return {
    saveVersion: 2,
    tasks: data.tasks,
    wallet: data.wallet,
    city: data.city,
    seasons: {
      current: {
        number: 1,
        startedAt: earliestCreatedAt(data.tasks) ?? now.toISOString(),
      },
      archive: [],
    },
    goals: [],
    keepsake: null,
  };
}

/** v2 → v3: tasks get a goal link (none yet) and archived seasons a goal list (empty). */
function migrateV2ToV3(data: SaveV2): SaveData {
  return {
    ...data,
    saveVersion: 3,
    tasks: data.tasks.map((task) => ({ ...task, goalId: null })),
    seasons: {
      ...data.seasons,
      archive: data.seasons.archive.map((season) => ({ ...season, goals: [] })),
    },
  };
}

/** The createdAt of the oldest task, or null if there is no readable one. */
export function earliestCreatedAt(
  tasks: Pick<Task, 'createdAt'>[],
): string | null {
  let earliest: string | null = null;
  for (const task of tasks) {
    const time = Date.parse(task.createdAt);
    if (Number.isNaN(time)) continue;
    if (earliest === null || time < Date.parse(earliest))
      earliest = task.createdAt;
  }
  return earliest;
}
