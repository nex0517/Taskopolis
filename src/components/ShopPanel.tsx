import {
  HOME_CATEGORY_COUNT,
  HOME_COST_PER_CATEGORY,
} from '../game/config';
import { buildingCost, BUILDINGS, DISTRICTS } from '../game/buildings';
import { canAffordBuilding } from '../game/economy';
import type { BuildingType, TaskCategory, Wallet } from '../game/types';
import { CATEGORIES } from '../game/types';
import './ShopPanel.css';

interface ShopPanelProps {
  wallet: Wallet;
  selected: BuildingType | null;
  onSelect: (type: BuildingType | null) => void;
}

function ShopPanel({ wallet, selected, onSelect }: ShopPanelProps) {
  function renderBuilding(type: BuildingType) {
    const building = BUILDINGS.find((item) => item.type === type);
    if (!building) return null;
    const isSelected = selected === building.type;
    const unaffordable = !canAffordBuilding(wallet, building);
    const costText =
      building.category === null
        ? `${HOME_COST_PER_CATEGORY} coin from ${HOME_CATEGORY_COUNT} categories`
        : `${buildingCost(building)} ${building.category} coins`;

    return (
      <button
        key={building.type}
        type="button"
        className={`shop-item${isSelected ? ' selected' : ''}${unaffordable ? ' unaffordable' : ''}`}
        aria-pressed={isSelected}
        disabled={unaffordable && !isSelected}
        onClick={() => onSelect(isSelected ? null : building.type)}
      >
        <span className="shop-item-title">
          <span aria-hidden="true">{building.emoji}</span> {building.name}
        </span>
        <span className="shop-item-cost">{costText}</span>
      </button>
    );
  }

  function renderDistrict(category: TaskCategory) {
    return (
      <section className="shop-section" key={category}>
        <h3>
          {DISTRICTS[category]} ({category})
        </h3>
        <div className="shop-items">
          {BUILDINGS.filter((building) => building.category === category).map(
            (building) => renderBuilding(building.type),
          )}
        </div>
      </section>
    );
  }

  return (
    <section className="shop-panel" aria-label="Building shop">
      <p className="shop-hint">Pick a building, then click an empty tile.</p>
      <section className="shop-section">
        <h3>Homes</h3>
        <div className="shop-items">{renderBuilding('home')}</div>
      </section>
      {CATEGORIES.map(renderDistrict)}
    </section>
  );
}

export default ShopPanel;
