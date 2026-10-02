// All game balance numbers live in this file, each with a one-line
// comment explaining what it controls. No magic numbers anywhere else.

import type { TaskCategory } from './types';

/** The city grid starts as a square of this many tiles per side. */
export const GRID_SIZE = 12;

/** Current save format version — bump when the save shape changes. */
export const SAVE_VERSION = 3;

/** Coins paid when a small task is completed. */
export const SMALL_TASK_REWARD = 1;

/** Coins paid when a medium task is completed. */
export const MEDIUM_TASK_REWARD = 3;

/** Coins paid when a large task is completed. */
export const LARGE_TASK_REWARD = 8;

/** Cost of the cheapest building in each district. */
export const TIER_1_BUILDING_COST = 3;

/** Cost of the second building in each district. */
export const TIER_2_BUILDING_COST = 6;

/** Cost of the third building in each district. */
export const TIER_3_BUILDING_COST = 10;

/** Cost of the fourth building in Education and Parks. */
export const TIER_4_BUILDING_COST = 15;

/** Coins taken from each category when building a home. */
export const HOME_COST_PER_CATEGORY = 1;

/** Different categories needed to build a home. */
export const HOME_CATEGORY_COUNT = 3;

/** Residents housed by each home. */
export const PEOPLE_PER_HOME = 4;

/** Residents supported by each district building. */
export const PEOPLE_PER_SERVICE_BUILDING = 8;

/** Days without a completed task before a district goes quiet. */
export const DORMANT_AFTER_DAYS = 7;

/** A Wonder is a square of this many tiles per side. */
export const WONDER_SIZE = 2;

/** Progress needed to show each Wonder stage, in order:
 *  foundation, frame, walls, finished. The last number is the total. */
export const WONDER_STAGE_THRESHOLDS = [0, 10, 25, 40] as const;

/** Progress that finishes a Wonder (the last stage threshold). */
export const WONDER_TOTAL: number =
  WONDER_STAGE_THRESHOLDS[WONDER_STAGE_THRESHOLDS.length - 1];

/** The one Wonder each category can build. */
export const WONDERS: Record<TaskCategory, { name: string; emoji: string }> = {
  Study: { name: 'Grand Observatory', emoji: '🔭' },
  Health: { name: 'Stadium', emoji: '🏟️' },
  Chores: { name: 'Hydro Dam', emoji: '🌊' },
  'Money/Admin': { name: 'Stock Exchange', emoji: '🏛️' },
  Social: { name: 'Opera House', emoji: '🎭' },
  Projects: { name: 'Space Port', emoji: '🚀' },
};
