// Shared types for everything the game knows about.
// This file is plain TypeScript: no React, no DOM, no localStorage.

/** Task categories — each one earns its own coins and funds a district. */
export const CATEGORIES = [
  'Study',
  'Health',
  'Chores',
  'Money/Admin',
  'Social',
  'Projects',
] as const;

export type TaskCategory = (typeof CATEGORIES)[number];

/** Task sizes — bigger tasks pay more coins (see config.ts). */
export const TASK_SIZES = ['S', 'M', 'L'] as const;

export type TaskSize = (typeof TASK_SIZES)[number];

export interface Task {
  id: string;
  title: string;
  category: TaskCategory;
  size: TaskSize;
  /** Optional 'YYYY-MM-DD' date string, or null. */
  dueDate: string | null;
  /** ISO timestamp of when the task was created. */
  createdAt: string;
  /** ISO timestamp of completion, or null while the task is open. */
  completedAt: string | null;
}

/** One coin balance per category (e.g. "Study coins"). */
export type Wallet = Record<TaskCategory, number>;

/** Buildings placed on the city grid. */
export const BUILDING_TYPES = [
  'home',
  'school',
  'library',
  'lecture-hall',
  'observatory',
  'park',
  'gym',
  'clinic',
  'stadium',
  'water-tower',
  'power-plant',
  'recycling-centre',
  'market',
  'bank',
  'city-hall',
  'cafe',
  'plaza',
  'theatre',
  'workshop',
  'factory',
  'tech-campus',
] as const;

export type BuildingType = (typeof BUILDING_TYPES)[number];

export interface PlacedBuilding {
  type: BuildingType;
  row: number;
  col: number;
}

/** The buildings currently placed in the city. */
export interface CityData {
  buildings: PlacedBuilding[];
}

/** How many tasks were completed in each category while a season ran. */
export type TasksPerCategory = Record<TaskCategory, number>;

export interface SeasonStats {
  tasksCompleted: TasksPerCategory;
  /** Population when the season ended. */
  population: number;
}

/** The season being played right now. It gets a name when it is archived. */
export interface CurrentSeason {
  number: number;
  /** ISO timestamp of when this season began. */
  startedAt: string;
}

/** A finished season, kept so old cities can be looked at later. */
export interface ArchivedSeason {
  number: number;
  name: string;
  startedAt: string;
  endedAt: string;
  /** A copy of the city as it was when the season ended. */
  city: CityData;
  stats: SeasonStats;
}

export interface SeasonsData {
  current: CurrentSeason;
  archive: ArchivedSeason[];
}

/** A Wonder goal. Milestone 9 decides its fields; until then the list stays empty. */
export type Goal = Record<string, never>;

/** The one building kept when a season ended, and which season it came from. */
export interface Keepsake extends PlacedBuilding {
  fromSeason: number;
}

/** Everything we persist — one object in localStorage (format version 2). */
export interface SaveData {
  saveVersion: number;
  tasks: Task[];
  wallet: Wallet;
  city: CityData;
  seasons: SeasonsData;
  goals: Goal[];
  keepsake: Keepsake | null;
}
