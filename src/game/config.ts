// All game balance numbers live in this file, each with a one-line
// comment explaining what it controls. No magic numbers anywhere else.

/** The city grid starts as a square of this many tiles per side. */
export const GRID_SIZE = 12;

/** Current save format version — bump when the save shape changes. */
export const SAVE_VERSION = 1;

/** Coins paid when a small task is completed. */
export const SMALL_TASK_REWARD = 1;

/** Coins paid when a medium task is completed. */
export const MEDIUM_TASK_REWARD = 3;

/** Coins paid when a large task is completed. */
export const LARGE_TASK_REWARD = 8;
