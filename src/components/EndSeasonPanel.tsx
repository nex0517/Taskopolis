import { useState } from 'react';

import { getBuilding } from '../game/buildings';
import type { CityData, CurrentSeason, PlacedBuilding } from '../game/types';
import { formatDate } from '../formatDate';
import './EndSeasonPanel.css';

interface EndSeasonPanelProps {
  season: CurrentSeason;
  city: CityData;
  onEnd: (keepsake: PlacedBuilding | null) => void;
}

function tileKey(building: PlacedBuilding): string {
  return `${building.row}-${building.col}`;
}

/** The "Season N" line, and the confirm step for ending it. */
function EndSeasonPanel({ season, city, onEnd }: EndSeasonPanelProps) {
  const [confirming, setConfirming] = useState(false);
  // '' means "keep nothing"; otherwise the tile key of the chosen building.
  const [chosen, setChosen] = useState('');
  // Always look the choice up in the *current* city: an import while this box
  // is open can replace the city, and then the old tile may not exist any more.
  const keepsake = city.buildings.find((b) => tileKey(b) === chosen) ?? null;

  function start() {
    setChosen(city.buildings.length > 0 ? tileKey(city.buildings[0]) : '');
    setConfirming(true);
  }

  function confirm() {
    setConfirming(false);
    onEnd(keepsake);
  }

  return (
    <div className="season-panel">
      <div className="season-line">
        <span>
          Season {season.number} · since {formatDate(season.startedAt)}
        </span>
        {!confirming && (
          <button type="button" onClick={start}>
            End season
          </button>
        )}
      </div>
      {confirming && (
        <div className="season-confirm" role="group" aria-label="End season">
          <p>
            End season {season.number}? The city goes into the gallery with its
            stats, then a fresh city begins. Your coins and tasks stay as they
            are.
          </p>
          {city.buildings.length > 0 ? (
            <label>
              Keep one building as a keepsake:{' '}
              <select
                value={keepsake ? tileKey(keepsake) : ''}
                onChange={(e) => setChosen(e.target.value)}
              >
                {city.buildings.map((b) => (
                  <option key={tileKey(b)} value={tileKey(b)}>
                    {getBuilding(b.type).name} (row {b.row + 1}, column{' '}
                    {b.col + 1})
                  </option>
                ))}
                <option value="">Keep nothing</option>
              </select>
            </label>
          ) : (
            <p className="season-empty">
              The city is empty, so there is nothing to keep.
            </p>
          )}
          <div className="season-actions">
            <button type="button" className="season-end" onClick={confirm}>
              Yes, end season {season.number}
            </button>
            <button type="button" onClick={() => setConfirming(false)}>
              Cancel
            </button>
          </div>
        </div>
      )}
    </div>
  );
}

export default EndSeasonPanel;
