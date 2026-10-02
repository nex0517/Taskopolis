import { useEffect, useState } from 'react';

import AppHeader, { type View } from './components/AppHeader';
import type { StatusFilter } from './components/FilterBar';
import CityPanel from './components/CityPanel';
import Gallery from './components/Gallery';
import TaskPanel from './components/TaskPanel';
import WalletPanel from './components/WalletPanel';
import { payTaskReward, refundTaskReward, rewardForTask } from './game/economy';
import { cityStats, hasDistrictBuilding, placeBuilding } from './game/city';
import { WAKE_MESSAGES, dormantCategories, isDormant } from './game/dormant';
import { parseSave } from './game/save';
import { endSeason, renameSeason } from './game/seasons';
import {
  addTask,
  removeTask,
  setTaskCompleted,
  updateTask,
  type TaskDraft,
} from './game/tasks';
import type {
  BuildingType,
  PlacedBuilding,
  SaveData,
  Task,
  TaskCategory,
} from './game/types';
import { downloadSave } from './saveFile';
import { loadSave, writeSave } from './storage';
import { useJuice } from './useJuice';
import { useNow } from './useNow';
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
  const [view, setView] = useState<View>('city');
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
    const completing = task.completedAt === null;
    if (!completing) {
      juice.clearCoinPop();
    } else if (statusFilter !== 'open') {
      // Under "To do" the row vanishes on completion, so the label would show up later instead.
      juice.showCoinPop(task.id, `+${rewardForTask(task)} ${task.category}`);
    }
    if (completing && isDormant(save.tasks, task.category, new Date())) {
      // No building means nothing plays (and clears) the glow, so don't arm it.
      if (hasDistrictBuilding(save.city, task.category)) {
        juice.showWaking(task.category);
      }
      setNotice(WAKE_MESSAGES[task.category]);
    }
    setSave((current) => {
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

  function handleEndSeason(keepsake: PlacedBuilding | null) {
    const ended = endSeason(save, keepsake, new Date());
    setSave(ended);
    setSelectedBuilding(null);
    setNotice(
      `Season ${save.seasons.current.number} is in the gallery. Welcome to season ${ended.seasons.current.number}.`,
    );
  }

  function handleRenameSeason(number: number, name: string) {
    setSave({ ...save, seasons: renameSeason(save.seasons, number, name) });
  }

  function handleImport(fileText: string) {
    const imported = parseSave(fileText);
    if (imported === null) {
      setNotice("That file isn't a valid Taskopolis save — nothing changed.");
    } else {
      setSave(imported.save);
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
  const now = useNow();
  const dormant = dormantCategories(save.tasks, now);

  return (
    <main className="app">
      <AppHeader
        stats={stats}
        view={view}
        galleryCount={save.seasons.archive.length}
        onViewChange={setView}
        onExport={() => downloadSave(save)}
        onImport={handleImport}
      />

      {notice && (
        <p className="notice" role="status">
          {notice}
        </p>
      )}

      {view === 'gallery' ? (
        <Gallery seasons={save.seasons} onRename={handleRenameSeason} />
      ) : (
        <>
          <WalletPanel wallet={save.wallet} />

          <div className="app-layout">
            <TaskPanel
              tasks={visibleTasks}
              editing={editingTask}
              category={categoryFilter}
              status={statusFilter}
              coinPop={juice.coinPop}
              onSubmit={handleSubmit}
              onCancelEdit={() => setEditing(null)}
              onCategoryChange={setCategoryFilter}
              onStatusChange={setStatusFilter}
              onToggle={handleToggle}
              onEdit={setEditing}
              onDelete={handleDelete}
              onCoinPopEnd={juice.clearCoinPop}
            />

            <CityPanel
              city={save.city}
              wallet={save.wallet}
              season={save.seasons.current}
              selected={selectedBuilding}
              dormant={dormant}
              newBuilding={juice.newBuilding}
              waking={juice.waking}
              onSelect={setSelectedBuilding}
              onTileClick={handleTileClick}
              onBuildEnd={juice.clearNewBuilding}
              onWakeEnd={juice.clearWaking}
              onEndSeason={handleEndSeason}
            />
          </div>
        </>
      )}
    </main>
  );
}

export default App;
