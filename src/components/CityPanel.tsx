import { DISTRICTS } from '../game/buildings';
import type { BuildingType, CityData, TaskCategory, Wallet } from '../game/types';
import { DISTRICT_PROBLEMS } from '../game/neglect';
import type { NewBuilding } from '../useJuice';
import CityGrid from './CityGrid';
import ShopPanel from './ShopPanel';
import './CityPanel.css';

interface CityPanelProps {
  city: CityData;
  wallet: Wallet;
  selected: BuildingType | null;
  neglected: TaskCategory[];
  newBuilding: NewBuilding | null;
  onSelect: (type: BuildingType | null) => void;
  onTileClick: (row: number, col: number) => void;
  onBuildEnd: () => void;
}

function CityPanel({
  city,
  wallet,
  selected,
  neglected,
  newBuilding,
  onSelect,
  onTileClick,
  onBuildEnd,
}: CityPanelProps) {
  const attentionMessage = neglected
    .map((category) => `${DISTRICTS[category]} (${DISTRICT_PROBLEMS[category]})`)
    .join(', ');

  return (
    <section className="city-column" aria-label="City">
      <h2>City</h2>
      <ShopPanel wallet={wallet} selected={selected} onSelect={onSelect} />
      {neglected.length > 0 && (
        <p className="city-neglect" role="status">
          Needs attention: {attentionMessage}
        </p>
      )}
      <CityGrid
        city={city}
        neglected={neglected}
        newBuilding={newBuilding}
        onTileClick={onTileClick}
        onBuildEnd={onBuildEnd}
      />
    </section>
  );
}

export default CityPanel;
