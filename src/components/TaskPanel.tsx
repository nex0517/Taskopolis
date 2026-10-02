import type { TaskDraft } from '../game/tasks';
import type { Goal, Task, TaskCategory } from '../game/types';
import type { CoinPop } from '../useJuice';
import FilterBar, { type StatusFilter } from './FilterBar';
import TaskForm from './TaskForm';
import TaskList from './TaskList';

interface TaskPanelProps {
  tasks: Task[];
  goals: Goal[];
  editing: Task | null;
  category: TaskCategory | 'all';
  status: StatusFilter;
  coinPop: CoinPop | null;
  onSubmit: (draft: TaskDraft, editingId: string | null) => void;
  onCancelEdit: () => void;
  onCategoryChange: (category: TaskCategory | 'all') => void;
  onStatusChange: (status: StatusFilter) => void;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onCoinPopEnd: () => void;
}

/** The left column: add/edit form, filters and the task list. */
function TaskPanel({
  tasks,
  goals,
  editing,
  category,
  status,
  coinPop,
  onSubmit,
  onCancelEdit,
  onCategoryChange,
  onStatusChange,
  onToggle,
  onEdit,
  onDelete,
  onCoinPopEnd,
}: TaskPanelProps) {
  return (
    <section className="task-column" aria-label="Tasks">
      {/* key forces a fresh form when switching between add and edit */}
      <TaskForm
        key={editing?.id ?? 'new'}
        editing={editing}
        goals={goals}
        onSubmit={onSubmit}
        onCancelEdit={onCancelEdit}
      />
      <FilterBar
        category={category}
        status={status}
        onCategoryChange={onCategoryChange}
        onStatusChange={onStatusChange}
      />
      <TaskList
        tasks={tasks}
        goals={goals}
        onToggle={onToggle}
        onEdit={onEdit}
        onDelete={onDelete}
        coinPop={coinPop}
        onCoinPopEnd={onCoinPopEnd}
      />
    </section>
  );
}

export default TaskPanel;
