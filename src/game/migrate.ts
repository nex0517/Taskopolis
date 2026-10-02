// Upgrades old save data to the current format, one version step at a time.
// Pure functions only: the caller (save.ts) has already checked the shape.

import { SAVE_VERSION } from './config';
import type { CityData, SaveData, Task, Wallet } from './types';

/** The fields every save version has had since Milestone 1. */
export interface CoreSave {
  saveVersion: number;
  tasks: Task[];
  wallet: Wallet;
  city: CityData;
}

/** Version 1 (Milestones 1–6) had nothing beyond the core fields. */
export type SaveV1 = CoreSave;

/**
 * Bring any known save version up to SAVE_VERSION.
 * Returns null for a version we don't know how to read (for example a file
 * from a newer app), so the caller can treat it like a corrupted save.
 */
export function migrate(data: CoreSave, now: Date = new Date()): SaveData | null {
  if (data.saveVersion === SAVE_VERSION) return data as SaveData;
  if (data.saveVersion === 1) return migrateV1ToV2(data, now);
  return null;
}

/** v1 → v2: the existing city becomes season 1, started when the first task was. */
function migrateV1ToV2(data: SaveV1, now: Date): SaveData {
  return {
    // Always 2, not SAVE_VERSION: when v3 arrives this step still produces v2
    // and a new v2 → v3 step runs after it.
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

/** The createdAt of the oldest task, or null if there is no readable one. */
export function earliestCreatedAt(tasks: Task[]): string | null {
  let earliest: string | null = null;
  for (const task of tasks) {
    const time = Date.parse(task.createdAt);
    if (Number.isNaN(time)) continue;
    if (earliest === null || time < Date.parse(earliest)) earliest = task.createdAt;
  }
  return earliest;
}
