import { GRID_SIZE } from '../game/config';
import { buildingAt } from '../game/city';
import { getBuilding } from '../game/buildings';
import type { CityData, TaskCategory } from '../game/types';
import './CityGrid.css';

interface CityGridProps {
  city: CityData;
  onTileClick: (row: number, col: number) => void;
}

function districtClass(category: TaskCategory): string {
  return `district-${category.toLowerCase().replace(/[^a-z]+/g, '-')}`;
}

function CityGrid({ city, onTileClick }: CityGridProps) {
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
          return (
            <button
              key={`${row}-${col}`}
              type="button"
              className={`city-tile ${className}`}
              title={definition.name}
              aria-label={`${definition.name}, row ${rowLabel}, column ${colLabel}`}
              onClick={() => onTileClick(row, col)}
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
