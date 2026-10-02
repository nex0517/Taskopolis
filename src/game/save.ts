// Building, checking, and (de)serializing the save object.
// Pure functions only — the localStorage calls live in src/storage.ts.

import { GRID_SIZE, SAVE_VERSION } from './config';
import { migrate, type CoreSave } from './migrate';
import type {
  ArchivedSeason,
  CityData,
  Keepsake,
  PlacedBuilding,
  SaveData,
  SeasonsData,
  Task,
  Wallet,
} from './types';
import { BUILDING_TYPES, CATEGORIES } from './types';

/** A brand-new save: no tasks, empty wallet, empty city, season 1 starting now. */
export function newGame(now: Date = new Date()): SaveData {
  const wallet = {} as Wallet;
  for (const category of CATEGORIES) {
    wallet[category] = 0;
  }
  return {
    saveVersion: SAVE_VERSION,
    tasks: [],
    wallet,
    city: { buildings: [] },
    seasons: {
      current: { number: 1, startedAt: now.toISOString() },
      archive: [],
    },
    goals: [],
    keepsake: null,
  };
}

/** Turn a save into JSON text (pretty-printed so exported files are readable). */
export function serializeSave(save: SaveData): string {
  return JSON.stringify(save, null, 2);
}

export interface ParsedSave {
  save: SaveData;
  /** True when the text was an older version that migrate() upgraded. */
  migrated: boolean;
}

/**
 * Turn saved JSON text back into a SaveData.
 * Returns null for missing, unparseable, or wrongly-shaped data — callers
 * decide what to do with a bad save (see storage.ts).
 * Older versions go through migrate(); unknown versions count as bad data.
 */
export function parseSave(
  raw: string | null,
  now: Date = new Date(),
): ParsedSave | null {
  if (raw === null) return null;
  let data: unknown;
  try {
    data = JSON.parse(raw);
  } catch {
    return null;
  }
  if (!isCoreSave(data)) return null;
  const save = migrate(data, now);
  if (save === null || !hasCurrentFields(save)) return null;
  return { save, migrated: data.saveVersion !== SAVE_VERSION };
}

/** Shape-check only — we don't validate every field deeply, just enough
 *  to know a foreign JSON file can't silently corrupt the app.
 *  These are the fields every version has had, so they are checked first. */
function isCoreSave(data: unknown): data is CoreSave {
  if (typeof data !== 'object' || data === null) return false;
  const save = data as CoreSave;
  return (
    typeof save.saveVersion === 'number' &&
    Array.isArray(save.tasks) &&
    save.tasks.every(isTask) &&
    typeof save.wallet === 'object' &&
    save.wallet !== null &&
    isCity(save.city)
  );
}

/** The fields added in version 2. Checked after migrate() has run. */
function hasCurrentFields(save: SaveData): boolean {
  return (
    isSeasons(save.seasons) &&
    Array.isArray(save.goals) &&
    (save.keepsake === null || isKeepsake(save.keepsake))
  );
}

function isKeepsake(keepsake: unknown): keepsake is Keepsake {
  return (
    isPlacedBuilding(keepsake) &&
    isSeasonNumber((keepsake as Keepsake).fromSeason)
  );
}

function isSeasons(seasons: unknown): seasons is SeasonsData {
  if (typeof seasons !== 'object' || seasons === null) return false;
  const s = seasons as SeasonsData;
  return (
    typeof s.current === 'object' &&
    s.current !== null &&
    isSeasonNumber(s.current.number) &&
    typeof s.current.startedAt === 'string' &&
    Array.isArray(s.archive) &&
    s.archive.every(isArchivedSeason)
  );
}

function isSeasonNumber(value: unknown): boolean {
  return Number.isInteger(value) && (value as number) >= 1;
}

function isArchivedSeason(season: unknown): season is ArchivedSeason {
  if (typeof season !== 'object' || season === null) return false;
  const s = season as ArchivedSeason;
  return (
    isSeasonNumber(s.number) &&
    typeof s.name === 'string' &&
    typeof s.startedAt === 'string' &&
    typeof s.endedAt === 'string' &&
    isCity(s.city) &&
    typeof s.stats === 'object' &&
    s.stats !== null &&
    typeof s.stats.population === 'number' &&
    typeof s.stats.tasksCompleted === 'object' &&
    s.stats.tasksCompleted !== null &&
    CATEGORIES.every(
      (category) => typeof s.stats.tasksCompleted[category] === 'number',
    )
  );
}

function isCity(city: unknown): city is CityData {
  if (typeof city !== 'object' || city === null) return false;
  const c = city as CityData;
  return (
    Array.isArray(c.buildings) &&
    c.buildings.every(isPlacedBuilding) &&
    hasUniqueTiles(c.buildings)
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
