import type { Goal, Task } from '../game/types';
import type { CoinPop } from '../useJuice';
import './TaskList.css';

interface TaskListProps {
  tasks: Task[];
  goals: Goal[];
  coinPop: CoinPop | null;
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
  onCoinPopEnd: () => void;
}

function TaskList({
  tasks,
  goals,
  coinPop,
  onToggle,
  onEdit,
  onDelete,
  onCoinPopEnd,
}: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="task-list-empty">No tasks here yet.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => {
        const rowClass = task.completedAt ? 'task-row done' : 'task-row';
        const goal = goals.find((g) => g.id === task.goalId);
        return (
          <li key={task.id} className={rowClass}>
            {coinPop?.taskId === task.id && (
              <span
                key={coinPop.key}
                className="coin-pop"
                aria-hidden="true"
                onAnimationEnd={onCoinPopEnd}
              >
                {coinPop.text}
              </span>
            )}
            <label className="task-check">
              <input
                type="checkbox"
                checked={task.completedAt !== null}
                onChange={() => onToggle(task)}
              />
              <span className="task-title">{task.title}</span>
            </label>
            <span className="task-meta">
              <span className="task-category">{task.category}</span>
              <span className="task-size">{task.size}</span>
              {task.dueDate && (
                <span className="task-due">due {task.dueDate}</span>
              )}
              {goal && (
                <span className="task-goal" title="Counts towards this goal">
                  → {goal.title}
                </span>
              )}
            </span>
            <span className="task-actions">
              <button type="button" onClick={() => onEdit(task)}>
                Edit
              </button>
              <button type="button" onClick={() => onDelete(task.id)}>
                Delete
              </button>
            </span>
          </li>
        );
      })}
    </ul>
  );
}

export default TaskList;
