import type { BuildingDef } from '../game/buildings';

/** CSS class that colours a tile by its district (homes have their own). */
export function tileClass(def: BuildingDef): string {
  if (def.category === null) return 'home';
  return `district-${def.category.toLowerCase().replace(/[^a-z]+/g, '-')}`;
}
