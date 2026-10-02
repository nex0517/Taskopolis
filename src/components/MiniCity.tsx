import { GRID_SIZE } from '../game/config';
import { getBuilding } from '../game/buildings';
import { buildingAt } from '../game/city';
import type { CityData, Goal } from '../game/types';
import { wonderAt } from '../game/wonders';
import { districtClass, tileClass } from './tileClass';
import { wonderLook } from './wonderLook';
import './CityGrid.css';
import './MiniCity.css';

interface MiniCityProps {
  city: CityData;
  /** Goals whose Wonders stood in this city (archived with the season). */
  goals: Goal[];
}

/** A small read-only picture of a city, used by the gallery. */
function MiniCity({ city, goals }: MiniCityProps) {
  const tiles = [];
  for (let row = 0; row < GRID_SIZE; row++) {
    for (let col = 0; col < GRID_SIZE; col++) {
      const goal = wonderAt(goals, row, col);
      if (goal) {
        if (goal.row !== row || goal.col !== col) continue;
        const look = wonderLook(goal);
        tiles.push(
          <div
            key={goal.id}
            className={`mini-tile mini-wonder ${districtClass(goal.category)} wonder-${look.stage}`}
            style={{ gridArea: `${row + 1} / ${col + 1} / span 2 / span 2` }}
            title={look.summary}
          >
            <span aria-hidden="true">{look.emoji}</span>
          </div>,
        );
        continue;
      }
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
  const wonders = goals.length === 1 ? '1 Wonder' : `${goals.length} Wonders`;
  return (
    <div
      className="mini-city"
      role="img"
      aria-label={`City with ${city.buildings.length} buildings and ${wonders}`}
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
    >
      {tiles}
    </div>
  );
}

export default MiniCity;
