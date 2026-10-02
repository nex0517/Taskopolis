import { DISTRICTS } from '../game/buildings';
import type {
  BuildingType,
  CityData,
  CurrentSeason,
  PlacedBuilding,
  TaskCategory,
  Wallet,
} from '../game/types';
import type { NewBuilding, Waking } from '../useJuice';
import CityGrid from './CityGrid';
import EndSeasonPanel from './EndSeasonPanel';
import ShopPanel from './ShopPanel';
import './CityPanel.css';

interface CityPanelProps {
  city: CityData;
  wallet: Wallet;
  season: CurrentSeason;
  selected: BuildingType | null;
  dormant: TaskCategory[];
  newBuilding: NewBuilding | null;
  waking: Waking | null;
  onSelect: (type: BuildingType | null) => void;
  onTileClick: (row: number, col: number) => void;
  onBuildEnd: () => void;
  onWakeEnd: () => void;
  onEndSeason: (keepsake: PlacedBuilding | null) => void;
}

function CityPanel({
  city,
  wallet,
  season,
  selected,
  dormant,
  newBuilding,
  waking,
  onSelect,
  onTileClick,
  onBuildEnd,
  onWakeEnd,
  onEndSeason,
}: CityPanelProps) {
  const quietDistricts = dormant
    .map((category) => DISTRICTS[category])
    .join(', ');

  return (
    <section className="city-column" aria-label="City">
      <h2>City</h2>
      <EndSeasonPanel season={season} city={city} onEnd={onEndSeason} />
      <ShopPanel wallet={wallet} selected={selected} onSelect={onSelect} />
      {dormant.length > 0 && (
        <p className="city-quiet">
          Quiet districts: {quietDistricts}. Finish a task there to wake them
          up.
        </p>
      )}
      <CityGrid
        city={city}
        dormant={dormant}
        newBuilding={newBuilding}
        waking={waking}
        onTileClick={onTileClick}
        onBuildEnd={onBuildEnd}
        onWakeEnd={onWakeEnd}
      />
    </section>
  );
}

export default CityPanel;
