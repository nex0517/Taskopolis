import { useState, type FormEvent } from 'react';

import type { TaskDraft } from '../game/tasks';
import type { Goal, Task } from '../game/types';
import { CATEGORIES, TASK_SIZES } from '../game/types';
import { activeGoals } from '../game/wonders';
import './TaskForm.css';

interface TaskFormProps {
  /** When set, the form edits this task; otherwise it adds a new one. */
  editing: Task | null;
  goals: Goal[];
  onSubmit: (draft: TaskDraft, editingId: string | null) => void;
  onCancelEdit: () => void;
}

function TaskForm({ editing, goals, onSubmit, onCancelEdit }: TaskFormProps) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState(editing?.category ?? CATEGORIES[0]);
  const [size, setSize] = useState(editing?.size ?? 'M');
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? '');
  // A link to a goal that no longer exists (archived seasons ago) counts as none.
  const [goalId, setGoalId] = useState<string | null>(
    goals.some((goal) => goal.id === editing?.goalId)
      ? (editing?.goalId ?? null)
      : null,
  );
  const fieldsLocked = editing !== null && editing.completedAt !== null;
  // Only active goals of the same category can be chosen, but a completed
  // task keeps showing the goal it was linked to even if that goal is closed.
  const linkable = activeGoals(goals, category);
  const linked = goals.find((goal) => goal.id === goalId);
  const goalOptions =
    linked && !linkable.includes(linked) ? [...linkable, linked] : linkable;

  function changeCategory(next: typeof category) {
    setCategory(next);
    setGoalId(null); // goals belong to one category
  }

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return; // empty titles are meaningless
    onSubmit(
      { title, category, size, dueDate: dueDate || null, goalId },
      editing?.id ?? null,
    );
    if (!editing) setTitle(''); // keep the form ready for the next task
    setDueDate('');
  }

  return (
    <form className="task-form" onSubmit={handleSubmit}>
      <input
        type="text"
        value={title}
        onChange={(e) => setTitle(e.target.value)}
        placeholder="What needs doing?"
        aria-label="Task title"
      />
      <select
        value={category}
        onChange={(e) => changeCategory(e.target.value as typeof category)}
        aria-label="Category"
        disabled={fieldsLocked}
      >
        {CATEGORIES.map((c) => (
          <option key={c} value={c}>
            {c}
          </option>
        ))}
      </select>
      <select
        value={size}
        onChange={(e) => setSize(e.target.value as typeof size)}
        aria-label="Size"
        disabled={fieldsLocked}
      >
        {TASK_SIZES.map((s) => (
          <option key={s} value={s}>
            {s}
          </option>
        ))}
      </select>
      <input
        type="date"
        value={dueDate}
        onChange={(e) => setDueDate(e.target.value)}
        aria-label="Due date (optional)"
      />
      {goalOptions.length > 0 && (
        <select
          value={goalId ?? ''}
          onChange={(e) => setGoalId(e.target.value || null)}
          aria-label="Goal (optional)"
          disabled={fieldsLocked}
        >
          <option value="">No goal</option>
          {goalOptions.map((goal) => (
            <option key={goal.id} value={goal.id}>
              Goal: {goal.title}
            </option>
          ))}
        </select>
      )}
      {fieldsLocked && (
        <p className="task-form-hint">
          Un-complete this task to change its category, size or goal.
        </p>
      )}
      <button type="submit">{editing ? 'Save' : 'Add task'}</button>
      {editing && (
        <button type="button" onClick={onCancelEdit}>
          Cancel
        </button>
      )}
    </form>
  );
}

export default TaskForm;
