import { GRID_SIZE } from '../game/config';
import { getBuilding } from '../game/buildings';
import { buildingAt } from '../game/city';
import type { CityData } from '../game/types';
import { tileClass } from './tileClass';
import './CityGrid.css';
import './MiniCity.css';

interface MiniCityProps {
  city: CityData;
}

/** A small read-only picture of a city, used by the gallery. */
function MiniCity({ city }: MiniCityProps) {
  const tiles = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const placed = buildingAt(city, row, col);
      const def = placed ? getBuilding(placed.type) : null;
      tiles.push(
        <div
          key={`${row}-${col}`}
          className={`mini-tile ${def ? tileClass(def) : 'mini-tile-empty'}`}
          title={def?.name}
        >
          {def && <span aria-hidden="true">{def.emoji}</span>}
        </div>,
      );
    }
  }
  return (
    <div
      className="mini-city"
      role="img"
      aria-label={`City with ${city.buildings.length} buildings`}
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
    >
      {tiles}
    </div>
  );
}

export default MiniCity;
