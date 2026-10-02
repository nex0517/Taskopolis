import { useState } from 'react';

import { WONDERS } from '../game/config';
import type { ArchivedSeason, Goal, SeasonsData } from '../game/types';
import { CATEGORIES } from '../game/types';
import { formatDate } from '../formatDate';
import MiniCity from './MiniCity';
import './Gallery.css';

interface GalleryProps {
  seasons: SeasonsData;
  onRename: (number: number, name: string) => void;
}

/** Every finished season as a card, newest first. */
function Gallery({ seasons, onRename }: GalleryProps) {
  const past = [...seasons.archive].reverse();

  return (
    <section className="gallery" aria-label="Season gallery">
      <h2>Gallery</h2>
      {past.length === 0 ? (
        <p className="gallery-empty">
          No finished seasons yet. When you end a season, your city is kept
          here.
        </p>
      ) : (
        <div className="gallery-cards">
          {past.map((season) => (
            <SeasonCard
              key={season.number}
              season={season}
              onRename={onRename}
            />
          ))}
        </div>
      )}
    </section>
  );
}

interface SeasonCardProps {
  season: ArchivedSeason;
  onRename: (number: number, name: string) => void;
}

function SeasonCard({ season, onRename }: SeasonCardProps) {
  const [draft, setDraft] = useState<string | null>(null);

  function save() {
    if (draft !== null) onRename(season.number, draft);
    setDraft(null);
  }

  return (
    <article className="season-card">
      <header className="season-card-header">
        {draft === null ? (
          <>
            <h3>{season.name}</h3>
            <button type="button" onClick={() => setDraft(season.name)}>
              Rename
            </button>
          </>
        ) : (
          <form
            className="season-rename"
            onSubmit={(e) => {
              e.preventDefault();
              save();
            }}
          >
            <input
              aria-label="Season name"
              value={draft}
              maxLength={40}
              autoFocus
              onChange={(e) => setDraft(e.target.value)}
            />
            <button type="submit">Save</button>
            <button type="button" onClick={() => setDraft(null)}>
              Cancel
            </button>
          </form>
        )}
      </header>
      <p className="season-card-dates">
        Season {season.number} · {formatDate(season.startedAt)} –{' '}
        {formatDate(season.endedAt)}
      </p>
      <MiniCity city={season.city} goals={season.goals} />
      {season.goals.length > 0 && (
        <p className="season-card-wonders">
          Wonders: {season.goals.map(describeWonder).join(', ')}
        </p>
      )}
      <p className="season-card-population">
        Population {season.stats.population}
      </p>
      <ul className="season-card-stats">
        {CATEGORIES.map((category) => (
          <li key={category}>
            <span>{category}</span>
            <strong>{season.stats.tasksCompleted[category]}</strong>
          </li>
        ))}
      </ul>
    </article>
  );
}

function describeWonder(goal: Goal): string {
  const state =
    goal.status === 'finished'
      ? 'finished'
      : goal.status === 'abandoned'
        ? 'unfinished'
        : 'still building';
  return `${WONDERS[goal.category].name} (${state})`;
}

export default Gallery;
