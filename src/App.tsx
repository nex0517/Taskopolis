import { useEffect, useState } from 'react';

import FilterBar, { type StatusFilter } from './components/FilterBar';
import SaveControls from './components/SaveControls';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import {
  payTaskReward,
  refundTaskReward,
} from './game/economy';
import { parseSave, serializeSave } from './game/save';
import {
  addTask,
  removeTask,
  setTaskCompleted,
  updateTask,
  type TaskDraft,
} from './game/tasks';
import type { SaveData, Task, TaskCategory } from './game/types';
import { CATEGORIES } from './game/types';
import { loadSave, writeSave } from './storage';
import './App.css';

function App() {
  // Load once on mount; the status tells us if the old save was corrupted.
  const [loadResult] = useState(loadSave);
  const [save, setSave] = useState<SaveData>(loadResult.save);
  const [editing, setEditing] = useState<Task | null>(null);
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>(
    'all',
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [notice, setNotice] = useState(
    loadResult.status === 'corrupted'
      ? 'Your save file was corrupted, so a fresh one was started. The old data was kept as a backup.'
      : '',
  );

  // Persist the whole save object every time it changes.
  useEffect(() => writeSave(save), [save]);

  function handleSubmit(draft: TaskDraft, editingId: string | null) {
    setSave({
      ...save,
      tasks: editingId
        ? updateTask(save.tasks, editingId, draft)
        : addTask(save.tasks, draft),
    });
    setEditing(null);
  }

  function handleToggle(task: Task) {
    setSave((current) => {
      const completing = task.completedAt === null;
      return {
        ...current,
        tasks: setTaskCompleted(current.tasks, task.id, completing),
        wallet: completing
          ? payTaskReward(current.wallet, task)
          : refundTaskReward(current.wallet, task),
      };
    });
  }

  function handleDelete(id: string) {
    setSave({ ...save, tasks: removeTask(save.tasks, id) });
    if (editing?.id === id) setEditing(null);
  }

  function handleExport() {
    const blob = new Blob([serializeSave(save)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'taskopolis-save.json';
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleImport(fileText: string) {
    const imported = parseSave(fileText);
    if (imported === null) {
      setNotice("That file isn't a valid Taskopolis save — nothing changed.");
    } else {
      setSave(imported);
      setEditing(null);
      setNotice('Save imported.');
    }
  }

  const visibleTasks = save.tasks.filter(
    (task) =>
      (categoryFilter === 'all' || task.category === categoryFilter) &&
      (statusFilter === 'all' ||
        (statusFilter === 'done') === (task.completedAt !== null)),
  );

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>Taskopolis</h1>
          <p className="app-tagline">Complete real tasks. Build a city.</p>
        </div>
        <SaveControls onExport={handleExport} onImport={handleImport} />
      </header>

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <section className="wallet" aria-label="Wallet">
        <h2>Wallet</h2>
        <ul className="wallet-list">
          {CATEGORIES.map((category) => (
            <li key={category}>
              <span>{category}</span>
              <strong>{save.wallet[category]}</strong>
            </li>
          ))}
        </ul>
      </section>

      {/* key forces a fresh form when switching between add and edit */}
      <TaskForm
        key={editing?.id ?? 'new'}
        editing={editing}
        onSubmit={handleSubmit}
        onCancelEdit={() => setEditing(null)}
      />

      <FilterBar
        category={categoryFilter}
        status={statusFilter}
        onCategoryChange={setCategoryFilter}
        onStatusChange={setStatusFilter}
      />

      <TaskList
        tasks={visibleTasks}
        onToggle={handleToggle}
        onEdit={setEditing}
        onDelete={handleDelete}
      />
    </main>
  );
}

export default App;
