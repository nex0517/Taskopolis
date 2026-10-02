// Seasons: ending one archives the city and starts a fresh one.
// Pure functions only — data in, new data out.

import { buildingAt, cityStats } from './city';
import type {
  ArchivedSeason,
  CityData,
  PlacedBuilding,
  SaveData,
  SeasonStats,
  SeasonsData,
  Task,
  TasksPerCategory,
} from './types';
import { CATEGORIES } from './types';

export function defaultSeasonName(number: number): string {
  return `Season ${number}`;
}

/** Tasks completed between the two timestamps, per category, plus the final population. */
export function seasonStats(
  tasks: Task[],
  city: CityData,
  startedAt: string,
  endedAt: string,
): SeasonStats {
  const tasksCompleted = {} as TasksPerCategory;
  for (const category of CATEGORIES) {
    tasksCompleted[category] = 0;
  }
  const start = Date.parse(startedAt);
  const end = Date.parse(endedAt);
  for (const task of tasks) {
    if (task.completedAt === null || !(task.category in tasksCompleted))
      continue;
    const time = Date.parse(task.completedAt);
    // A season owns completions from its start up to (not including) its end,
    // so a task finished at the exact moment one season ends belongs to the next.
    if (Number.isNaN(time) || time < start || time >= end) continue;
    tasksCompleted[task.category] += 1;
  }
  return { tasksCompleted, population: cityStats(city).population };
}

/**
 * Archive the current season and start the next one.
 * The keepsake (if it really is in the city) is the only building carried
 * over, standing on its old tile for free. Coins and tasks are untouched.
 */
export function endSeason(
  save: SaveData,
  keepsake: PlacedBuilding | null,
  now: Date = new Date(),
): SaveData {
  const { current, archive } = save.seasons;
  const endedAt = now.toISOString();
  const kept =
    keepsake !== null && isInCity(save.city, keepsake) ? keepsake : null;
  const archived: ArchivedSeason = {
    number: current.number,
    name: defaultSeasonName(current.number),
    startedAt: current.startedAt,
    endedAt,
    city: { buildings: [...save.city.buildings] },
    stats: seasonStats(save.tasks, save.city, current.startedAt, endedAt),
  };
  return {
    ...save,
    city: { buildings: kept ? [kept] : [] },
    seasons: {
      current: { number: current.number + 1, startedAt: endedAt },
      archive: [...archive, archived],
    },
    keepsake: kept ? { ...kept, fromSeason: current.number } : null,
  };
}

function isInCity(city: CityData, building: PlacedBuilding): boolean {
  const found = buildingAt(city, building.row, building.col);
  return found !== undefined && found.type === building.type;
}

/** Give an archived season a new name. Blank names are ignored. */
export function renameSeason(
  seasons: SeasonsData,
  number: number,
  name: string,
): SeasonsData {
  const trimmed = name.trim();
  if (trimmed === '') return seasons;
  return {
    ...seasons,
    archive: seasons.archive.map((season) =>
      season.number === number ? { ...season, name: trimmed } : season,
    ),
  };
}
