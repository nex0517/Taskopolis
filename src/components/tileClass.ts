import type { BuildingDef } from '../game/buildings';
import type { TaskCategory } from '../game/types';

/** CSS class that colours a tile by its district (homes have their own). */
export function tileClass(def: BuildingDef): string {
  return districtClass(def.category);
}

export function districtClass(category: TaskCategory | null): string {
  if (category === null) return 'home';
  return `district-${category.toLowerCase().replace(/[^a-z]+/g, '-')}`;
}
