import type { CityStats } from '../game/city';

interface PopulationBarProps {
  stats: CityStats;
}

function PopulationBar({ stats }: PopulationBarProps) {
  return (
    <div className="population">
      <strong>Population: {stats.population}</strong>
      <span>
        Homes house {stats.housing} · Services support {stats.supported}
      </span>
    </div>
  );
}

export default PopulationBar;
