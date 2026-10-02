import { useState, type FormEvent } from 'react';

import { WONDERS, WONDER_TOTAL } from '../game/config';
import type { Goal, TaskCategory } from '../game/types';
import { CATEGORIES } from '../game/types';
import { isWonderComplete } from '../game/wonders';
import { wonderLook } from './wonderLook';
import './GoalPanel.css';

/** A goal the player has named but not yet placed on the grid. */
export interface PendingGoal {
  title: string;
  category: TaskCategory;
}

interface GoalPanelProps {
  goals: Goal[];
  placing: PendingGoal | null;
  onStart: (pending: PendingGoal) => void;
  onCancel: () => void;
  onFinish: (id: string) => void;
  onAbandon: (id: string) => void;
}

/** Goals and their Wonders: the list, plus the form that starts a new one. */
function GoalPanel({
  goals,
  placing,
  onStart,
  onCancel,
  onFinish,
  onAbandon,
}: GoalPanelProps) {
  const [title, setTitle] = useState('');
  const [category, setCategory] = useState<TaskCategory>(CATEGORIES[0]);

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return;
    onStart({ title: title.trim(), category });
    setTitle('');
  }

  return (
    <section className="goal-panel" aria-label="Goals">
      <h3>Goals</h3>
      {goals.length === 0 && placing === null && (
        <p className="goal-empty">
          A goal is something big you are working towards. Link tasks to it and
          each one you finish builds a giant Wonder in your city. No coins
          needed.
        </p>
      )}
      {goals.length > 0 && (
        <ul className="goal-list">
          {goals.map((goal) => (
            <GoalRow
              key={goal.id}
              goal={goal}
              onFinish={onFinish}
              onAbandon={onAbandon}
            />
          ))}
        </ul>
      )}
      {placing ? (
        <p className="goal-placing" role="status">
          Click the top-left tile of an empty 2×2 spot for your{' '}
          {WONDERS[placing.category].name}.
          <button type="button" onClick={onCancel}>
            Cancel
          </button>
        </p>
      ) : (
        <form className="goal-form" onSubmit={handleSubmit}>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="New goal, e.g. Pass the exam"
            aria-label="Goal title"
          />
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as TaskCategory)}
            aria-label="Goal category"
          >
            {CATEGORIES.map((c) => (
              <option key={c} value={c}>
                {c} · {WONDERS[c].name}
              </option>
            ))}
          </select>
          <button type="submit">Choose a spot</button>
        </form>
      )}
    </section>
  );
}

interface GoalRowProps {
  goal: Goal;
  onFinish: (id: string) => void;
  onAbandon: (id: string) => void;
}

function GoalRow({ goal, onFinish, onAbandon }: GoalRowProps) {
  const [confirmingAbandon, setConfirmingAbandon] = useState(false);
  const look = wonderLook(goal);
  const active = goal.status === 'active';

  return (
    <li className={`goal-row goal-${goal.status}`}>
      <div>
        <strong>{goal.title}</strong>
        <span className="goal-wonder">
          {WONDERS[goal.category].emoji} {look.name} · {goal.category}
        </span>
      </div>
      <div className="goal-progress">
        <span className="goal-bar" aria-hidden="true">
          <span style={{ width: `${look.percent}%` }} />
        </span>
        <span>
          {goal.progress} / {WONDER_TOTAL} · {look.stage}
        </span>
      </div>
      <span className="goal-actions">
        {active && isWonderComplete(goal) && (
          <button
            type="button"
            className="goal-finish"
            onClick={() => onFinish(goal.id)}
          >
            Finish
          </button>
        )}
        {active && !confirmingAbandon && (
          <button type="button" onClick={() => setConfirmingAbandon(true)}>
            Abandon
          </button>
        )}
        {active && confirmingAbandon && (
          <>
            <span>Abandon? The Wonder stays as it is.</span>
            <button type="button" onClick={() => onAbandon(goal.id)}>
              Yes
            </button>
            <button type="button" onClick={() => setConfirmingAbandon(false)}>
              No
            </button>
          </>
        )}
        {goal.status === 'finished' && (
          <span className="goal-badge">finished</span>
        )}
        {goal.status === 'abandoned' && (
          <span className="goal-badge">unfinished</span>
        )}
      </span>
    </li>
  );
}

export default GoalPanel;
