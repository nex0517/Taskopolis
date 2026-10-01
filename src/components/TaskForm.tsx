import { useState, type FormEvent } from 'react';

import type { TaskDraft } from '../game/tasks';
import type { Task } from '../game/types';
import { CATEGORIES, TASK_SIZES } from '../game/types';
import './TaskForm.css';

interface TaskFormProps {
  /** When set, the form edits this task; otherwise it adds a new one. */
  editing: Task | null;
  onSubmit: (draft: TaskDraft, editingId: string | null) => void;
  onCancelEdit: () => void;
}

function TaskForm({ editing, onSubmit, onCancelEdit }: TaskFormProps) {
  const [title, setTitle] = useState(editing?.title ?? '');
  const [category, setCategory] = useState(editing?.category ?? CATEGORIES[0]);
  const [size, setSize] = useState(editing?.size ?? 'M');
  const [dueDate, setDueDate] = useState(editing?.dueDate ?? '');

  function handleSubmit(event: FormEvent) {
    event.preventDefault();
    if (!title.trim()) return; // empty titles are meaningless
    onSubmit(
      { title, category, size, dueDate: dueDate || null },
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
        onChange={(e) => setCategory(e.target.value as typeof category)}
        aria-label="Category"
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
