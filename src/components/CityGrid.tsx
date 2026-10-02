import { DORMANT_AFTER_DAYS, GRID_SIZE } from '../game/config';
import { buildingAt } from '../game/city';
import { getBuilding } from '../game/buildings';
import { isBuildingDormant } from '../game/dormant';
import type { CityData, Goal, TaskCategory } from '../game/types';
import { wonderAt } from '../game/wonders';
import type { NewBuilding, Waking } from '../useJuice';
import { districtClass, tileClass } from './tileClass';
import { wonderLook } from './wonderLook';
import './CityGrid.css';

interface CityGridProps {
  city: CityData;
  goals: Goal[];
  dormant: TaskCategory[];
  newBuilding: NewBuilding | null;
  waking: Waking | null;
  /** True while the player is choosing a 2x2 spot for a new Wonder. */
  placingWonder: boolean;
  onTileClick: (row: number, col: number) => void;
  onBuildEnd: () => void;
  onWakeEnd: () => void;
}

function CityGrid({
  city,
  goals,
  dormant,
  newBuilding,
  waking,
  placingWonder,
  onTileClick,
  onBuildEnd,
  onWakeEnd,
}: CityGridProps) {
  return (
    <div
      className={placingWonder ? 'city-grid city-grid-placing' : 'city-grid'}
      style={{ gridTemplateColumns: `repeat(${GRID_SIZE}, 1fr)` }}
      aria-label="City grid"
    >
      {Array.from({ length: GRID_SIZE }, (_, row) =>
        Array.from({ length: GRID_SIZE }, (_, col) => {
          const rowLabel = row + 1;
          const colLabel = col + 1;
          const place = `row ${rowLabel}, column ${colLabel}`;
          const goal = wonderAt(goals, row, col);
          if (goal) {
            // One element spans the whole 2x2; the other three tiles draw nothing.
            if (goal.row !== row || goal.col !== col) return null;
            const look = wonderLook(goal);
            const quiet = dormant.includes(goal.category);
            const isWaking =
              waking !== null && goal.category === waking.category;
            return (
              <button
                key={isWaking ? `${goal.id}-wake-${waking.key}` : goal.id}
                type="button"
                className={`city-tile city-wonder ${districtClass(goal.category)} wonder-${look.stage}${quiet ? ' city-tile-dormant' : ''}${isWaking ? ' city-tile-waking' : ''}`}
                style={{
                  gridArea: `${rowLabel} / ${colLabel} / span 2 / span 2`,
                }}
                title={look.summary}
                aria-label={`Wonder: ${look.summary}, ${place}${quiet ? ', quiet' : ''}`}
                onClick={() => onTileClick(row, col)}
                onAnimationEnd={(event) => {
                  if (event.animationName === 'wake-up') onWakeEnd();
                }}
              >
                <span className="city-tile-emoji" aria-hidden="true">
                  {look.emoji}
                </span>
                <span className="city-tile-name">{look.name}</span>
                <span className="wonder-bar" aria-hidden="true">
                  <span style={{ width: `${look.percent}%` }} />
                </span>
                {look.unfinished && (
                  <span className="wonder-label">unfinished</span>
                )}
              </button>
            );
          }
          const building = buildingAt(city, row, col);
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
          return (
            <button
              key={
                isWaking ? `${row}-${col}-wake-${waking.key}` : `${row}-${col}`
              }
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
