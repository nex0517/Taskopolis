import { DORMANT_AFTER_DAYS, GRID_SIZE } from '../game/config';
import { buildingAt } from '../game/city';
import { getBuilding } from '../game/buildings';
import { isBuildingDormant } from '../game/dormant';
import type { CityData, TaskCategory } from '../game/types';
import type { NewBuilding, Waking } from '../useJuice';
import { tileClass } from './tileClass';
import './CityGrid.css';

interface CityGridProps {
  city: CityData;
  dormant: TaskCategory[];
  newBuilding: NewBuilding | null;
  waking: Waking | null;
  onTileClick: (row: number, col: number) => void;
  onBuildEnd: () => void;
  onWakeEnd: () => void;
}

function CityGrid({
  city,
  dormant,
  newBuilding,
  waking,
  onTileClick,
  onBuildEnd,
  onWakeEnd,
}: CityGridProps) {
  return (
    <div
      className="city-grid"
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      aria-label="City grid"
    >
      {Array.from({ length: GRID_SIZE }, (_, row) =>
        Array.from({ length: GRID_SIZE }, (_, col) => {
          const building = buildingAt(city, row, col);
          const rowLabel = row + 1;
          const colLabel = col + 1;
          if (!building) {
            return (
              <button
                key={`${row}-${col}`}
                type="button"
                className="city-tile city-tile-empty"
                aria-label={`Empty tile, row ${rowLabel}, column ${colLabel}`}
                onClick={() => onTileClick(row, col)}
              />
            );
          }
          const definition = getBuilding(building.type);
          const className = tileClass(definition);
          const quiet = isBuildingDormant(definition, dormant);
          const isWaking =
            waking !== null && definition.category === waking.category;
          const isNew =
            newBuilding !== null &&
            newBuilding.row === row &&
            newBuilding.col === col;
          const place = `row ${rowLabel}, column ${colLabel}`;
          return (
            <button
              key={isWaking ? `${row}-${col}-wake-${waking.key}` : `${row}-${col}`}
              type="button"
              className={`city-tile ${className}${quiet ? ' city-tile-dormant' : ''}${isWaking ? ' city-tile-waking' : ''}${isNew ? ' city-tile-new' : ''}`}
              title={
                quiet
                  ? `${definition.name} — quiet: no ${definition.category} task done in ${DORMANT_AFTER_DAYS} days`
                  : definition.name
              }
              aria-label={
                quiet
                  ? `${definition.name}, ${place}, quiet`
                  : `${definition.name}, ${place}`
              }
              onClick={() => onTileClick(row, col)}
              onAnimationEnd={(event) => {
                if (event.animationName === 'construct') onBuildEnd();
                if (event.animationName === 'wake-up') onWakeEnd();
              }}
            >
              <span className="city-tile-emoji" aria-hidden="true">
                {definition.emoji}
              </span>
              <span className="city-tile-name">{definition.name}</span>
            </button>
          );
        }),
      )}
    </div>
  );
}

export default CityGrid;
