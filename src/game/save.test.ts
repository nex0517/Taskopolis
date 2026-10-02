import { describe, expect, it } from 'vitest';

import { SAVE_VERSION } from './config';
import { newGame, parseSave, serializeSave } from './save';
import type {
  ArchivedSeason,
  CurrentSeason,
  Goal,
  SaveData,
  SeasonStats,
  Task,
  TasksPerCategory,
} from './types';
import { CATEGORIES } from './types';

function saveWithDueDate(dueDate: string | null) {
  const save = newGame();
  save.tasks.push({
    id: 'task-1',
    title: 'Task with due date',
    category: 'Study',
    size: 'S',
    dueDate,
    createdAt: '2026-01-01T00:00:00.000Z',
    completedAt: null,
    goalId: null,
  });
  return save;
}

describe('newGame', () => {
  it('starts empty with a zeroed wallet for every category', () => {
    const save = newGame();
    expect(save.saveVersion).toBe(SAVE_VERSION);
    expect(save.tasks).toEqual([]);
    expect(save.city).toEqual({ buildings: [] });
    for (const category of CATEGORIES) {
      expect(save.wallet[category]).toBe(0);
    }
  });

  it('starts season 1 at the given time with nothing archived', () => {
    const now = new Date('2026-03-01T09:00:00.000Z');
    const save = newGame(now);
    expect(save.seasons).toEqual({
      current: { number: 1, startedAt: '2026-03-01T09:00:00.000Z' },
      archive: [],
    });
    expect(save.goals).toEqual([]);
    expect(save.keepsake).toBeNull();
  });
});

describe('parseSave', () => {
  it('returns null for missing input', () => {
    expect(parseSave(null)).toBeNull();
  });

  it('returns null for text that is not JSON', () => {
    expect(parseSave('not json at all')).toBeNull();
    expect(parseSave('{')).toBeNull();
  });

  it('returns null for JSON that is not a save object', () => {
    expect(parseSave('"hello"')).toBeNull();
    expect(parseSave('[1,2,3]')).toBeNull();
    expect(parseSave('{"saveVersion": 1}')).toBeNull(); // missing fields
  });

  it('returns null when a task is malformed', () => {
    const save = newGame();
    const bad = { ...save, tasks: [{ title: 'no id or fields' }] };
    expect(parseSave(JSON.stringify(bad))).toBeNull();
  });

  it.each(['', '2026-1-4'])(
    'rejects a noncanonical task due date: %s',
    (dueDate) => {
      const save = saveWithDueDate(dueDate);
      expect(parseSave(serializeSave(save))).toBeNull();
    },
  );

  it.each(['2026-01-04', null])(
    'parses a task with a valid due date: %s',
    (dueDate) => {
      const save = saveWithDueDate(dueDate);
      expect(parseSave(serializeSave(save))?.save).toEqual(save);
    },
  );

  it('round-trips: serialize then parse gives identical data', () => {
    const save = newGame();
    save.tasks.push({
      id: 't1',
      title: 'Task one',
      category: 'Chores',
      size: 'S',
      dueDate: null,
      createdAt: '2026-10-01T00:00:00.000Z',
      completedAt: '2026-10-01T01:00:00.000Z',
      goalId: null,
    });
    save.wallet.Chores = 7;
    save.city.buildings.push({ type: 'home', row: 0, col: 1 });
    expect(parseSave(serializeSave(save))?.save).toEqual(save);
  });

  it('rejects an unknown building type', () => {
    const save = {
      ...newGame(),
      city: { buildings: [{ type: 'castle', row: 0, col: 0 }] },
    };
    expect(parseSave(JSON.stringify(save))).toBeNull();
  });

  it.each([
    { type: 'home', row: -1, col: 0 },
    { type: 'home', row: 0, col: 12 },
    { type: 'home', row: 1.5, col: 0 },
    { type: 'home', row: 0, col: 1.5 },
  ])('rejects an invalid building position: %o', (building) => {
    const save = { ...newGame(), city: { buildings: [building] } };
    expect(parseSave(JSON.stringify(save))).toBeNull();
  });

  it('still parses an old save with an empty buildings array', () => {
    const save = newGame();
    expect(parseSave(serializeSave(save))?.save).toEqual(save);
  });

  it('rejects buildings that overlap the same tile', () => {
    const save = {
      ...newGame(),
      city: {
        buildings: [
          { type: 'home', row: 0, col: 0 },
          { type: 'school', row: 0, col: 0 },
        ],
      },
    };
    expect(parseSave(JSON.stringify(save))).toBeNull();
  });

  it('parses buildings on different tiles', () => {
    const save = newGame();
    save.city.buildings.push(
      { type: 'home', row: 0, col: 0 },
      { type: 'school', row: 0, col: 1 },
    );
    expect(parseSave(serializeSave(save))?.save).toEqual(save);
  });

  it('reports a current-version save as not migrated', () => {
    const save = newGame();
    expect(parseSave(serializeSave(save))?.migrated).toBe(false);
  });

  it('rejects a saveVersion it has never heard of', () => {
    const save = { ...newGame(), saveVersion: 99 };
    expect(parseSave(serializeSave(save))).toBeNull();
  });

  describe('version 2 and 3 fields', () => {
    function archivedSeason(): ArchivedSeason {
      const tasksCompleted = {} as TasksPerCategory;
      for (const category of CATEGORIES) tasksCompleted[category] = 0;
      tasksCompleted.Study = 4;
      return {
        number: 1,
        name: 'Spring',
        startedAt: '2026-01-01T00:00:00.000Z',
        endedAt: '2026-03-01T00:00:00.000Z',
        city: { buildings: [{ type: 'school', row: 2, col: 2 }] },
        stats: { tasksCompleted, population: 8 },
        goals: [],
      };
    }

    function sampleGoal(): Goal {
      return {
        id: 'g1',
        title: 'Run a marathon',
        category: 'Health',
        row: 4,
        col: 4,
        progress: 12,
        status: 'active',
        createdAt: '2026-02-01T00:00:00.000Z',
        closedAt: null,
      };
    }

    it('round-trips goals, a linked task and an archived season with goals', () => {
      const save = newGame();
      save.goals.push(sampleGoal(), {
        ...sampleGoal(),
        id: 'g2',
        row: 8,
        status: 'abandoned',
        closedAt: '2026-02-20T00:00:00.000Z',
      });
      save.tasks.push({ ...saveWithDueDate(null).tasks[0], goalId: 'g1' });
      save.seasons.archive.push({ ...archivedSeason(), goals: [sampleGoal()] });
      save.seasons.current = {
        number: 2,
        startedAt: '2026-03-01T00:00:00.000Z',
      };
      expect(parseSave(serializeSave(save))?.save).toEqual(save);
    });

    it('round-trips a keepsake', () => {
      const save = newGame();
      save.keepsake = { type: 'school', row: 1, col: 2, fromSeason: 1 };
      expect(parseSave(serializeSave(save))?.save).toEqual(save);
    });

    it('round-trips an archived season', () => {
      const save = newGame();
      save.seasons.archive.push(archivedSeason());
      save.seasons.current = {
        number: 2,
        startedAt: '2026-03-01T00:00:00.000Z',
      };
      expect(parseSave(serializeSave(save))?.save).toEqual(save);
    });

    it.each([
      [
        'seasons missing',
        (save: SaveData) => delete (save as Partial<SaveData>).seasons,
      ],
      [
        'current is null',
        (save: SaveData) =>
          ((save.seasons as { current: unknown }).current = null),
      ],
      [
        'season number is 0',
        (save: SaveData) => (save.seasons.current.number = 0),
      ],
      [
        'season number is a string',
        (save: SaveData) =>
          ((save.seasons.current as { number: unknown }).number = '1'),
      ],
      [
        'startedAt missing',
        (save: SaveData) =>
          delete (save.seasons.current as Partial<CurrentSeason>).startedAt,
      ],
      [
        'archive is not a list',
        (save: SaveData) =>
          ((save.seasons as { archive: unknown }).archive = {}),
      ],
      [
        'goals missing',
        (save: SaveData) => delete (save as Partial<SaveData>).goals,
      ],
      [
        'keepsake is a string',
        (save: SaveData) => ((save as { keepsake: unknown }).keepsake = 'ring'),
      ],
      [
        'keepsake has no season',
        (save: SaveData) =>
          ((save as { keepsake: unknown }).keepsake = {
            type: 'home',
            row: 0,
            col: 0,
          }),
      ],
      [
        'keepsake is off the grid',
        (save: SaveData) =>
          (save.keepsake = { type: 'home', row: 12, col: 0, fromSeason: 1 }),
      ],
      [
        'a goal has no title',
        (save: SaveData) =>
          save.goals.push({ ...sampleGoal(), title: 7 } as unknown as Goal),
      ],
      [
        'a goal has an unknown category',
        (save: SaveData) =>
          save.goals.push({
            ...sampleGoal(),
            category: 'Fun',
          } as unknown as Goal),
      ],
      [
        'a goal has an unknown status',
        (save: SaveData) =>
          save.goals.push({
            ...sampleGoal(),
            status: 'paused',
          } as unknown as Goal),
      ],
      [
        'a goal has negative progress',
        (save: SaveData) => save.goals.push({ ...sampleGoal(), progress: -1 }),
      ],
      [
        "a goal's Wonder hangs off the grid edge",
        (save: SaveData) => save.goals.push({ ...sampleGoal(), row: 11 }),
      ],
      [
        'a task has a numeric goalId',
        (save: SaveData) =>
          save.tasks.push({
            ...saveWithDueDate(null).tasks[0],
            goalId: 5,
          } as unknown as Task),
      ],
      [
        'an archived season has no goals list',
        (save: SaveData) =>
          save.seasons.archive.push({
            ...archivedSeason(),
            goals: undefined,
          } as unknown as ArchivedSeason),
      ],
    ])('rejects a current-version save where %s', (_label, damage) => {
      const save = newGame();
      damage(save);
      expect(parseSave(JSON.stringify(save))).toBeNull();
    });

    it.each([
      [
        'has no name',
        (season: ArchivedSeason) =>
          delete (season as Partial<ArchivedSeason>).name,
      ],
      [
        'has an invalid city',
        (season: ArchivedSeason) =>
          season.city.buildings.push({ type: 'school', row: 2, col: 2 }),
      ],
      [
        'has no population',
        (season: ArchivedSeason) =>
          delete (season.stats as Partial<SeasonStats>).population,
      ],
      [
        'misses a category count',
        (season: ArchivedSeason) =>
          delete (season.stats.tasksCompleted as Partial<TasksPerCategory>)
            .Social,
      ],
    ])('rejects an archived season that %s', (_label, damage) => {
      const save = newGame();
      const season = archivedSeason();
      damage(season);
      save.seasons.archive.push(season);
      expect(parseSave(JSON.stringify(save))).toBeNull();
    });
  });
});
