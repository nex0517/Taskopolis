import { serializeSave } from './game/save';
import type { SaveData } from './game/types';

/** Offer the save as a JSON download in the browser. */
export function downloadSave(save: SaveData): void {
  const blob = new Blob([serializeSave(save)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = 'taskopolis-save.json';
  link.click();
  URL.revokeObjectURL(url);
}
