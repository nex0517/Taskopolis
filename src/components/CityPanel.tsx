import { DISTRICTS } from '../game/buildings';
import type { BuildingType, CityData, TaskCategory, Wallet } from '../game/types';
import { DISTRICT_PROBLEMS } from '../game/neglect';
import CityGrid from './CityGrid';
import ShopPanel from './ShopPanel';
import './CityPanel.css';

interface CityPanelProps {
  city: CityData;
  wallet: Wallet;
  selected: BuildingType | null;
  neglected: TaskCategory[];
  onSelect: (type: BuildingType | null) => void;
  onTileClick: (row: number, col: number) => void;
}

function CityPanel({
  city,
  wallet,
  selected,
  neglected,
  onSelect,
  onTileClick,
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
        onTileClick={onTileClick}
      />
    </section>
  );
}

export default CityPanel;
