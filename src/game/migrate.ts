// Upgrades old save data to the current format.
// Right now there is only version 1, so this does nothing — it exists so
// loadSave() already has a place to send older or newer saveVersions.

import type { SaveData } from './types';

export function migrate(data: SaveData): SaveData {
  return data;
}
