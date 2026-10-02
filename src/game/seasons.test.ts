import { describe, expect, it } from 'vitest';

import { newGame, parseSave, serializeSave } from './save';
import {
  defaultSeasonName,
  endSeason,
  renameSeason,
  seasonStats,
} from './seasons';
import type { SaveData, Task } from './types';
import { CATEGORIES } from './types';

const started = new Date('2026-09-01T00:00:00.000Z');
const ended = new Date('2026-10-01T00:00:00.000Z');

function task(
  id: string,
  category: Task['category'],
  completedAt: string | null,
): Task {
  return {
    id,
    title: id,
    category,
    size: 'S',
    dueDate: null,
    createdAt: '2026-08-01T00:00:00.000Z',
    completedAt,
  };
}

/** A lived-in season 1: some tasks, coins and a small city. */
function livedInSave(): SaveData {
  const save = newGame(started);
  save.tasks.push(
    task('before', 'Study', '2026-08-20T00:00:00.000Z'), // last season
    task('s1', 'Study', '2026-09-05T00:00:00.000Z'),
    task('s2', 'Study', '2026-09-20T00:00:00.000Z'),
    task('h1', 'Health', '2026-09-10T00:00:00.000Z'),
    task('open', 'Chores', null),
    task('later', 'Social', '2026-10-02T00:00:00.000Z'), // after the end
  );
  save.wallet.Study = 5;
  save.wallet.Health = 2;
  save.city.buildings.push(
    { type: 'home', row: 0, col: 0 },
    { type: 'home', row: 0, col: 1 },
    { type: 'school', row: 3, col: 3 },
    { type: 'park', row: 4, col: 4 },
  );
  return save;
}

describe('seasonStats', () => {
  it('counts only tasks completed inside the season, per category', () => {
    const save = livedInSave();
    const stats = seasonStats(
      save.tasks,
      save.city,
      started.toISOString(),
      ended.toISOString(),
    );
    expect(stats.tasksCompleted).toEqual({
      Study: 2,
      Health: 1,
      Chores: 0,
      'Money/Admin': 0,
      Social: 0,
      Projects: 0,
    });
  });

  it('gives a task completed exactly at the end to the next season', () => {
    const tasks = [task('edge', 'Study', ended.toISOString())];
    const city = { buildings: [] };
    const first = seasonStats(
      tasks,
      city,
      started.toISOString(),
      ended.toISOString(),
    );
    const next = seasonStats(
      tasks,
      city,
      ended.toISOString(),
      '2026-11-01T00:00:00.000Z',
    );
    expect(first.tasksCompleted.Study).toBe(0);
    expect(next.tasksCompleted.Study).toBe(1);
  });

  it('records the population at the end', () => {
    const save = livedInSave();
    const stats = seasonStats(
      save.tasks,
      save.city,
      started.toISOString(),
      ended.toISOString(),
    );
    // 2 homes house 8, 2 service buildings support 16 -> 8 people.
    expect(stats.population).toBe(8);
  });

  it('is all zeros for an empty season', () => {
    const stats = seasonStats(
      [],
      { buildings: [] },
      started.toISOString(),
      ended.toISOString(),
    );
    for (const category of CATEGORIES) {
      expect(stats.tasksCompleted[category]).toBe(0);
    }
    expect(stats.population).toBe(0);
  });
});

describe('endSeason', () => {
  it('archives an exact copy of the city, not the same array', () => {
    const save = livedInSave();
    const after = endSeason(save, null, ended);
    expect(after.seasons.archive).toHaveLength(1);
    const archived = after.seasons.archive[0];
    expect(archived.city).toEqual(save.city);
    expect(archived.city.buildings).not.toBe(save.city.buildings);
    expect(archived.number).toBe(1);
    expect(archived.name).toBe(defaultSeasonName(1));
    expect(archived.startedAt).toBe(started.toISOString());
    expect(archived.endedAt).toBe(ended.toISOString());
    expect(archived.stats.population).toBe(8);
    expect(archived.stats.tasksCompleted.Study).toBe(2);
  });

  it('starts the next season with an empty city except the keepsake', () => {
    const save = livedInSave();
    const after = endSeason(save, { type: 'school', row: 3, col: 3 }, ended);
    expect(after.city).toEqual({
      buildings: [{ type: 'school', row: 3, col: 3 }],
    });
    expect(after.keepsake).toEqual({
      type: 'school',
      row: 3,
      col: 3,
      fromSeason: 1,
    });
    expect(after.seasons.current).toEqual({
      number: 2,
      startedAt: ended.toISOString(),
    });
  });

  it('leaves coins and tasks exactly as they were', () => {
    const save = livedInSave();
    const after = endSeason(save, { type: 'park', row: 4, col: 4 }, ended);
    expect(after.wallet).toEqual(save.wallet);
    expect(after.tasks).toEqual(save.tasks);
    expect(after.goals).toEqual(save.goals);
  });

  it('works with an empty city and nothing to keep', () => {
    const save = newGame(started);
    const after = endSeason(save, null, ended);
    expect(after.city).toEqual({ buildings: [] });
    expect(after.keepsake).toBeNull();
    expect(after.seasons.archive[0].city).toEqual({ buildings: [] });
    expect(after.seasons.archive[0].stats.population).toBe(0);
    expect(after.seasons.current.number).toBe(2);
  });

  it('ignores a keepsake that is not actually in the city', () => {
    const save = livedInSave();
    const wrongTile = endSeason(
      save,
      { type: 'school', row: 9, col: 9 },
      ended,
    );
    expect(wrongTile.city.buildings).toEqual([]);
    expect(wrongTile.keepsake).toBeNull();
    const wrongType = endSeason(save, { type: 'park', row: 3, col: 3 }, ended);
    expect(wrongType.city.buildings).toEqual([]);
  });

  it('numbers seasons in order when ended again', () => {
    const later = new Date('2026-11-01T00:00:00.000Z');
    const twice = endSeason(endSeason(livedInSave(), null, ended), null, later);
    expect(twice.seasons.archive.map((season) => season.number)).toEqual([
      1, 2,
    ]);
    expect(twice.seasons.current).toEqual({
      number: 3,
      startedAt: later.toISOString(),
    });
    expect(twice.seasons.archive[1].startedAt).toBe(ended.toISOString());
  });

  it('still saves and loads after a season ends', () => {
    const after = endSeason(
      livedInSave(),
      { type: 'home', row: 0, col: 0 },
      ended,
    );
    expect(parseSave(serializeSave(after))?.save).toEqual(after);
  });
});

describe('renameSeason', () => {
  function twoSeasons() {
    const later = new Date('2026-11-01T00:00:00.000Z');
    return endSeason(endSeason(livedInSave(), null, ended), null, later)
      .seasons;
  }

  it('renames only the chosen season and trims the name', () => {
    const renamed = renameSeason(twoSeasons(), 2, '  The Big Move  ');
    expect(renamed.archive.map((season) => season.name)).toEqual([
      'Season 1',
      'The Big Move',
    ]);
  });

  it('ignores a blank name', () => {
    const seasons = twoSeasons();
    expect(renameSeason(seasons, 1, '   ')).toEqual(seasons);
  });

  it('does nothing for a season number that does not exist', () => {
    const seasons = twoSeasons();
    expect(renameSeason(seasons, 7, 'Ghost')).toEqual(seasons);
  });
});
