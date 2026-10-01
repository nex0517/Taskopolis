import type { TaskCategory } from '../game/types';
import { CATEGORIES } from '../game/types';
import './FilterBar.css';

export type StatusFilter = 'all' | 'open' | 'done';

interface FilterBarProps {
  category: TaskCategory | 'all';
  status: StatusFilter;
  onCategoryChange: (category: TaskCategory | 'all') => void;
  onStatusChange: (status: StatusFilter) => void;
}

function FilterBar({
  category,
  status,
  onCategoryChange,
  onStatusChange,
}: FilterBarProps) {
  return (
    <div className="filter-bar">
      <label>
        Category{' '}
        <select
          value={category}
          onChange={(e) =>
            onCategoryChange(e.target.value as TaskCategory | 'all')
          }
        >
          <option value="all">All</option>
          {CATEGORIES.map((c) => (
            <option key={c} value={c}>
              {c}
            </option>
          ))}
        </select>
      </label>
      <label>
        Status{' '}
        <select
          value={status}
          onChange={(e) => onStatusChange(e.target.value as StatusFilter)}
        >
          <option value="all">All</option>
          <option value="open">To do</option>
          <option value="done">Done</option>
        </select>
      </label>
    </div>
  );
}

export default FilterBar;
