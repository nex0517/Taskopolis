import { DISTRICTS } from '../game/buildings';
import type {
  BuildingType,
  CityData,
  CurrentSeason,
  Goal,
  PlacedBuilding,
  TaskCategory,
  Wallet,
} from '../game/types';
import type { NewBuilding, Waking } from '../useJuice';
import CityGrid from './CityGrid';
import EndSeasonPanel from './EndSeasonPanel';
import GoalPanel, { type PendingGoal } from './GoalPanel';
import ShopPanel from './ShopPanel';
import './CityPanel.css';

interface CityPanelProps {
  city: CityData;
  goals: Goal[];
  wallet: Wallet;
  season: CurrentSeason;
  selected: BuildingType | null;
  placingGoal: PendingGoal | null;
  dormant: TaskCategory[];
  newBuilding: NewBuilding | null;
  waking: Waking | null;
  onSelect: (type: BuildingType | null) => void;
  onTileClick: (row: number, col: number) => void;
  onBuildEnd: () => void;
  onWakeEnd: () => void;
  onEndSeason: (keepsake: PlacedBuilding | null) => void;
  onStartGoal: (pending: PendingGoal) => void;
  onCancelGoal: () => void;
  onFinishGoal: (id: string) => void;
  onAbandonGoal: (id: string) => void;
}

function CityPanel({
  city,
  goals,
  wallet,
  season,
  selected,
  placingGoal,
  dormant,
  newBuilding,
  waking,
  onSelect,
  onTileClick,
  onBuildEnd,
  onWakeEnd,
  onEndSeason,
  onStartGoal,
  onCancelGoal,
  onFinishGoal,
  onAbandonGoal,
}: CityPanelProps) {
  const quietDistricts = dormant
    .map((category) => DISTRICTS[category])
    .join(', ');

  return (
    <section className="city-column" aria-label="City">
      <h2>City</h2>
      <EndSeasonPanel season={season} city={city} onEnd={onEndSeason} />
      <ShopPanel wallet={wallet} selected={selected} onSelect={onSelect} />
      <GoalPanel
        goals={goals}
        placing={placingGoal}
        onStart={onStartGoal}
        onCancel={onCancelGoal}
        onFinish={onFinishGoal}
        onAbandon={onAbandonGoal}
      />
      {dormant.length > 0 && (
        <p className="city-quiet">
          Quiet districts: {quietDistricts}. Finish a task there to wake them
          up.
        </p>
      )}
      <CityGrid
        city={city}
        goals={goals}
        dormant={dormant}
        newBuilding={newBuilding}
        waking={waking}
        placingWonder={placingGoal !== null}
        onTileClick={onTileClick}
        onBuildEnd={onBuildEnd}
        onWakeEnd={onWakeEnd}
      />
    </section>
  );
}

export default CityPanel;
