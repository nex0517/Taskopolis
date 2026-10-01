import type { Task } from '../game/types';
import './TaskList.css';

interface TaskListProps {
  tasks: Task[];
  onToggle: (task: Task) => void;
  onEdit: (task: Task) => void;
  onDelete: (id: string) => void;
}

function TaskList({ tasks, onToggle, onEdit, onDelete }: TaskListProps) {
  if (tasks.length === 0) {
    return <p className="task-list-empty">No tasks here yet.</p>;
  }

  return (
    <ul className="task-list">
      {tasks.map((task) => (
        <li
          key={task.id}
          className={task.completedAt ? 'task-row done' : 'task-row'}
        >
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
            {task.dueDate && <span className="task-due">due {task.dueDate}</span>}
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
      ))}
    </ul>
  );
}

export default TaskList;
