import { useEffect, useState } from 'react';

import AppHeader, { type View } from './components/AppHeader';
import type { StatusFilter } from './components/FilterBar';
import CityPanel from './components/CityPanel';
import Gallery from './components/Gallery';
import type { PendingGoal } from './components/GoalPanel';
import TaskPanel from './components/TaskPanel';
import WalletPanel from './components/WalletPanel';
import { WONDERS } from './game/config';
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
import {
  abandonGoal,
  addGoal,
  applyTaskProgress,
  finishGoal,
  isWonderComplete,
  validGoalLink,
} from './game/wonders';
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
  // A goal waiting for its 2x2 spot: the next tile click places its Wonder.
  const [placingGoal, setPlacingGoal] = useState<PendingGoal | null>(null);
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
    // The form only offers valid goals, but the save is the source of truth.
    const clean = {
      ...draft,
      goalId: validGoalLink(save.goals, draft.category, draft.goalId),
    };
    setSave({
      ...save,
      tasks: editingId
        ? updateTask(save.tasks, editingId, clean)
        : addTask(save.tasks, clean),
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
      const hasWonder = save.goals.some((g) => g.category === task.category);
      if (hasDistrictBuilding(save.city, task.category) || hasWonder) {
        juice.showWaking(task.category);
      }
      setNotice(WAKE_MESSAGES[task.category]);
    }
    const goals = applyTaskProgress(save.goals, task, completing);
    const before = save.goals.find((g) => g.id === task.goalId);
    const after = goals.find((g) => g.id === task.goalId);
    if (
      before &&
      after &&
      !isWonderComplete(before) &&
      isWonderComplete(after)
    ) {
      setNotice(
        `Your ${WONDERS[after.category].name} is complete! Mark "${after.title}" finished whenever you're ready.`,
      );
    }
    setSave((current) => {
      return {
        ...current,
        tasks: setTaskCompleted(current.tasks, task.id, completing),
        wallet: completing
          ? payTaskReward(current.wallet, task)
          : refundTaskReward(current.wallet, task),
        goals: applyTaskProgress(current.goals, task, completing),
      };
    });
  }

  function handleDelete(id: string) {
    setSave({ ...save, tasks: removeTask(save.tasks, id) });
    if (editing?.id === id) setEditing(null);
  }

  function handleSelectBuilding(type: BuildingType | null) {
    setSelectedBuilding(type);
    if (type !== null) setPlacingGoal(null); // one thing at a time
  }

  function handleStartGoal(pending: PendingGoal) {
    setPlacingGoal(pending);
    setSelectedBuilding(null);
  }

  function handleTileClick(row: number, col: number) {
    if (placingGoal !== null) {
      placeWonder(row, col);
      return;
    }
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
      save.goals,
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

  function placeWonder(row: number, col: number) {
    if (placingGoal === null) return;
    const result = addGoal(save.goals, save.city, { ...placingGoal, row, col });
    if (result.ok) {
      setSave({ ...save, goals: result.goals });
      setPlacingGoal(null);
      setNotice(
        `Your ${WONDERS[result.goal.category].name} has broken ground. Link ${result.goal.category} tasks to "${result.goal.title}" to build it.`,
      );
    } else if (result.reason === 'occupied') {
      setNotice(
        'A Wonder needs an empty 2×2 spot — some of those tiles are taken.',
      );
    } else {
      setNotice(
        'A Wonder needs a 2×2 spot — that one runs off the edge of the city.',
      );
    }
  }

  function handleFinishGoal(id: string) {
    const goal = save.goals.find((g) => g.id === id);
    if (!goal) return;
    setSave({ ...save, goals: finishGoal(save.goals, id) });
    setNotice(
      `"${goal.title}" is finished. The ${WONDERS[goal.category].name} is yours.`,
    );
  }

  function handleAbandonGoal(id: string) {
    const goal = save.goals.find((g) => g.id === id);
    if (!goal) return;
    setSave({ ...save, goals: abandonGoal(save.goals, id) });
    setNotice(
      `"${goal.title}" is set aside. Its ${WONDERS[goal.category].name} stays in the city, unfinished.`,
    );
  }

  function handleEndSeason(keepsake: PlacedBuilding | null) {
    const ended = endSeason(save, keepsake, new Date());
    setSave(ended);
    setSelectedBuilding(null);
    setPlacingGoal(null);
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
      setPlacingGoal(null);
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
    ? (save.tasks.find((task) => task.id === editing.id) ?? null)
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
              goals={save.goals}
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
              goals={save.goals}
              wallet={save.wallet}
              season={save.seasons.current}
              selected={selectedBuilding}
              placingGoal={placingGoal}
              dormant={dormant}
              newBuilding={juice.newBuilding}
              waking={juice.waking}
              onSelect={handleSelectBuilding}
              onTileClick={handleTileClick}
              onBuildEnd={juice.clearNewBuilding}
              onWakeEnd={juice.clearWaking}
              onEndSeason={handleEndSeason}
              onStartGoal={handleStartGoal}
              onCancelGoal={() => setPlacingGoal(null)}
              onFinishGoal={handleFinishGoal}
              onAbandonGoal={handleAbandonGoal}
            />
          </div>
        </>
      )}
    </main>
  );
}

export default App;
