import { GRID_SIZE } from '../game/config';
import { buildingAt } from '../game/city';
import { getBuilding } from '../game/buildings';
import { DISTRICT_PROBLEMS } from '../game/neglect';
import type { CityData, TaskCategory } from '../game/types';
import type { NewBuilding } from '../useJuice';
import './CityGrid.css';

interface CityGridProps {
  city: CityData;
  neglected: TaskCategory[];
  newBuilding: NewBuilding | null;
  onTileClick: (row: number, col: number) => void;
  onBuildEnd: () => void;
}

function districtClass(category: TaskCategory): string {
  return `district-${category.toLowerCase().replace(/[^a-z]+/g, '-')}`;
}

function CityGrid({
  city,
  neglected,
  newBuilding,
  onTileClick,
  onBuildEnd,
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
          const className =
            definition.category === null
              ? 'home'
              : districtClass(definition.category);
          const problem =
            definition.category !== null &&
            neglected.includes(definition.category)
              ? DISTRICT_PROBLEMS[definition.category]
              : null;
          const title = problem
            ? `${definition.name} — ${problem}: a ${definition.category} task is overdue`
            : definition.name;
          const tileClass = problem ? ' city-tile-neglected' : '';
          const isNew =
            newBuilding !== null &&
            newBuilding.row === row &&
            newBuilding.col === col;
          return (
            <button
              key={`${row}-${col}`}
              type="button"
              className={`city-tile ${className}${tileClass}${isNew ? ' city-tile-new' : ''}`}
              title={title}
              aria-label={
                problem
                  ? `${definition.name}, row ${rowLabel}, column ${colLabel}, needs attention: ${problem}`
                  : `${definition.name}, row ${rowLabel}, column ${colLabel}`
              }
              onClick={() => onTileClick(row, col)}
              onAnimationEnd={(event) => {
                if (event.animationName === 'construct') onBuildEnd();
              }}
            >
              <span className="city-tile-emoji" aria-hidden="true">
                {definition.emoji}
              </span>
              <span className="city-tile-name">{definition.name}</span>
              {problem && (
                <span className="city-tile-warning" aria-hidden="true">
                  ⚠️
                </span>
              )}
            </button>
          );
        }),
      )}
    </div>
  );
}

export default CityGrid;
