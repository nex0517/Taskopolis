import type { CityStats } from '../game/city';
import PopulationBar from './PopulationBar';
import SaveControls from './SaveControls';
import './AppHeader.css';

export type View = 'city' | 'gallery';

interface AppHeaderProps {
  stats: CityStats;
  view: View;
  /** How many finished seasons the gallery holds. */
  galleryCount: number;
  onViewChange: (view: View) => void;
  onExport: () => void;
  onImport: (fileText: string) => void;
}

function AppHeader({
  stats,
  view,
  galleryCount,
  onViewChange,
  onExport,
  onImport,
}: AppHeaderProps) {
  function tab(target: View, label: string) {
    return (
      <button
        type="button"
        className={`view-tab${view === target ? ' selected' : ''}`}
        aria-pressed={view === target}
        onClick={() => onViewChange(target)}
      >
        {label}
      </button>
    );
  }

  return (
    <header className="app-header">
      <div>
        <h1>Taskopolis</h1>
        <p className="app-tagline">Complete real tasks. Build a city.</p>
      </div>
      <PopulationBar stats={stats} />
      <div className="view-tabs" role="group" aria-label="View">
        {tab('city', 'City')}
        {tab('gallery', `Gallery (${galleryCount})`)}
      </div>
      <SaveControls onExport={onExport} onImport={onImport} />
    </header>
  );
}

export default AppHeader;
