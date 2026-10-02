// Building, checking, and (de)serializing the save object.
// Pure functions only — the localStorage calls live in src/storage.ts.

import { GRID_SIZE, SAVE_VERSION } from './config';
import { migrate } from './migrate';
import type { PlacedBuilding, SaveData, Task, Wallet } from './types';
import { BUILDING_TYPES, CATEGORIES } from './types';

/** A brand-new save: no tasks, empty wallet, empty city. */
export function newGame(): SaveData {
  const wallet = {} as Wallet;
  for (const category of CATEGORIES) {
    wallet[category] = 0;
  }
  return { saveVersion: SAVE_VERSION, tasks: [], wallet, city: { buildings: [] } };
}

/** Turn a save into JSON text (pretty-printed so exported files are readable). */
export function serializeSave(save: SaveData): string {
  return JSON.stringify(save, null, 2);
}

/**
 * Turn saved JSON text back into a SaveData.
 * Returns null for missing, unparseable, or wrongly-shaped data — callers
 * decide what to do with a bad save (see storage.ts).
 * Runs migrate() for anything whose version isn't current.
 */
export function parseSave(raw: string | null): SaveData | null {
  if (raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isSaveData(data)) return null;
  return data.saveVersion === SAVE_VERSION ? data : migrate(data);
}

/** Shape-check only — we don't validate every field deeply, just enough
 *  to know a foreign JSON file can't silently corrupt the app. */
function isSaveData(data: unknown): data is SaveData {
  if (typeof data !== 'object' || data === null) return false;
  const save = data as SaveData;
  return (
    typeof save.saveVersion === 'number' &&
    Array.isArray(save.tasks) &&
    save.tasks.every(isTask) &&
    typeof save.wallet === 'object' &&
    save.wallet !== null &&
    typeof save.city === 'object' &&
    save.city !== null &&
    Array.isArray(save.city.buildings) &&
    save.city.buildings.every(isPlacedBuilding) &&
    hasUniqueTiles(save.city.buildings)
  );
}

function hasUniqueTiles(buildings: PlacedBuilding[]): boolean {
  // The grid shows one building per tile, so duplicates would inflate population.
  const tiles = new Set(buildings.map(({ row, col }) => `${row},${col}`));
  return tiles.size === buildings.length;
}

function isPlacedBuilding(building: unknown): building is PlacedBuilding {
  if (typeof building !== 'object' || building === null) return false;
  const placed = building as PlacedBuilding;
  return (
    BUILDING_TYPES.includes(placed.type) &&
    Number.isInteger(placed.row) &&
    Number.isInteger(placed.col) &&
    placed.row >= 0 &&
    placed.row < GRID_SIZE &&
    placed.col >= 0 &&
    placed.col < GRID_SIZE
  );
}

function isDueDate(value: unknown): boolean {
  // The date picker only produces this format, so anything else means a damaged save.
  return (
    value === null ||
    (typeof value === 'string' && /^\d{4}-\d{2}-\d{2}$/.test(value))
  );
}

function isTask(task: unknown): task is Task {
  if (typeof task !== 'object' || task === null) return false;
  const t = task as Task;
  return (
    typeof t.id === 'string' &&
    typeof t.title === 'string' &&
    typeof t.category === 'string' &&
    typeof t.size === 'string' &&
    typeof t.createdAt === 'string' &&
    isDueDate(t.dueDate) &&
    (t.completedAt === null || typeof t.completedAt === 'string')
  );
}
