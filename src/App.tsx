import { useEffect, useState } from 'react';

import FilterBar, { type StatusFilter } from './components/FilterBar';
import SaveControls from './components/SaveControls';
import CityPanel from './components/CityPanel';
import PopulationBar from './components/PopulationBar';
import TaskForm from './components/TaskForm';
import TaskList from './components/TaskList';
import WalletPanel from './components/WalletPanel';
import { payTaskReward, refundTaskReward, rewardForTask } from './game/economy';
import { cityStats, placeBuilding } from './game/city';
import { neglectedCategories } from './game/neglect';
import { parseSave, serializeSave } from './game/save';
import {
  addTask,
  removeTask,
  setTaskCompleted,
  updateTask,
  type TaskDraft,
} from './game/tasks';
import type { BuildingType, SaveData, Task, TaskCategory } from './game/types';
import { loadSave, writeSave } from './storage';
import { useJuice } from './useJuice';
import { useToday } from './useToday';
import './App.css';

function App() {
  // Load once on mount; the status tells us if the old save was corrupted.
  const [loadResult] = useState(loadSave);
  const [save, setSave] = useState<SaveData>(loadResult.save);
  const [editing, setEditing] = useState<Task | null>(null);
  const [selectedBuilding, setSelectedBuilding] = useState<BuildingType | null>(
    null,
  );
  const [categoryFilter, setCategoryFilter] = useState<TaskCategory | 'all'>(
    'all',
  );
  const [statusFilter, setStatusFilter] = useState<StatusFilter>('all');
  const [notice, setNotice] = useState(
    loadResult.status === 'corrupted'
      ? 'Your save file was corrupted, so a fresh one was started. The old data was kept as a backup.'
      : '',
  );
  const juice = useJuice();

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
    if (task.completedAt === null) {
      juice.showCoinPop(task.id, `+${rewardForTask(task)} ${task.category}`);
    }
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

  function handleTileClick(row: number, col: number) {
    if (selectedBuilding === null) {
      setNotice('Pick a building from the shop first.');
      return;
    }
    const result = placeBuilding(
      save.city,
      save.wallet,
      selectedBuilding,
      row,
      col,
    );
    if (result.ok) {
      setSave({ ...save, city: result.city, wallet: result.wallet });
      setNotice('');
      juice.showNewBuilding(row, col);
      return;
    }
    if (result.reason === 'occupied') {
      setNotice('That tile is already taken.');
    } else if (result.reason === 'unaffordable') {
      setNotice("You can't afford that building yet.");
    } else {
      setNotice('That tile is outside the city.');
    }
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
  const editingTask = editing
    ? save.tasks.find((task) => task.id === editing.id) ?? null
    : null;
  const stats = cityStats(save.city);
  const today = useToday();
  const neglected = neglectedCategories(save.tasks, today);

  return (
    <main className="app">
      <header className="app-header">
        <div>
          <h1>Taskopolis</h1>
          <p className="app-tagline">Complete real tasks. Build a city.</p>
        </div>
        <PopulationBar stats={stats} />
        <SaveControls onExport={handleExport} onImport={handleImport} />
      </header>

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      <WalletPanel wallet={save.wallet} />

      <div className="app-layout">
        <section className="task-column" aria-label="Tasks">
          {/* key forces a fresh form when switching between add and edit */}
          <TaskForm
            key={editingTask?.id ?? 'new'}
            editing={editingTask}
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
            today={today}
            onToggle={handleToggle}
            onEdit={setEditing}
            onDelete={handleDelete}
            coinPop={juice.coinPop}
            onCoinPopEnd={juice.clearCoinPop}
          />
        </section>

        <CityPanel
          city={save.city}
          wallet={save.wallet}
          selected={selectedBuilding}
          neglected={neglected}
          newBuilding={juice.newBuilding}
          onSelect={setSelectedBuilding}
          onTileClick={handleTileClick}
          onBuildEnd={juice.clearNewBuilding}
        />
      </div>
    </main>
  );
}

export default App;
