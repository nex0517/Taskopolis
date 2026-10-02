import { describe, expect, it } from 'vitest';

import { SAVE_VERSION } from './config';
import {
  earliestCreatedAt,
  migrate,
  type SaveV1,
  type SaveV2,
} from './migrate';
import { parseSave, serializeSave } from './save';

const now = new Date('2026-10-02T12:00:00.000Z');

/** A version-1 export, exactly as the app wrote it before Milestone 7. */
const V1_EXPORT = `{
  "saveVersion": 1,
  "tasks": [
    {
      "id": "7d2c1c7e-2b7a-4f1e-9b3e-0f5c1a2b3c4d",
      "title": "Read chapter 3",
      "category": "Study",
      "size": "M",
      "dueDate": "2026-09-20",
      "createdAt": "2026-09-18T08:30:00.000Z",
      "completedAt": "2026-09-19T17:05:00.000Z"
    },
    {
      "id": "3a9f0e11-6c2d-4e8b-8a7f-9d1e2f3a4b5c",
      "title": "Morning run",
      "category": "Health",
      "size": "S",
      "dueDate": null,
      "createdAt": "2026-09-15T06:00:00.000Z",
      "completedAt": "2026-09-15T06:40:00.000Z"
    },
    {
      "id": "c4d5e6f7-1a2b-4c3d-9e8f-7a6b5c4d3e2f",
      "title": "Pay electricity bill",
      "category": "Money/Admin",
      "size": "S",
      "dueDate": "2026-10-05",
      "createdAt": "2026-09-30T19:12:00.000Z",
      "completedAt": null
    }
  ],
  "wallet": {
    "Study": 0,
    "Health": 1,
    "Chores": 0,
    "Money/Admin": 0,
    "Social": 0,
    "Projects": 0
  },
  "city": {
    "buildings": [
      { "type": "school", "row": 5, "col": 5 }
    ]
  }
}`;

function v1(): SaveV1 {
  return JSON.parse(V1_EXPORT) as SaveV1;
}

describe('migrate v1 -> v2 -> v3', () => {
  it('keeps every task, coin and building exactly as they were', () => {
    const before = v1();
    const after = migrate(before, now);
    expect(after).not.toBeNull();
    expect(after?.saveVersion).toBe(SAVE_VERSION);
    // The only change to a task is the new "no goal" link.
    expect(after?.tasks).toEqual(
      before.tasks.map((task) => ({ ...task, goalId: null })),
    );
    expect(after?.wallet).toEqual(before.wallet);
    expect(after?.city).toEqual(before.city);
  });

  it('makes the existing city season 1, started at the earliest task', () => {
    const after = migrate(v1(), now);
    // The earliest task is the second one in the file, not the first.
    expect(after?.seasons).toEqual({
      current: { number: 1, startedAt: '2026-09-15T06:00:00.000Z' },
      archive: [],
    });
    expect(after?.goals).toEqual([]);
    expect(after?.keepsake).toBeNull();
  });

  it('starts season 1 now when there are no tasks', () => {
    const after = migrate({ ...v1(), tasks: [] }, now);
    expect(after?.seasons.current.startedAt).toBe(now.toISOString());
  });

  it('does nothing extra when run twice', () => {
    const once = migrate(v1(), now);
    expect(once).not.toBeNull();
    const twice = migrate(once as NonNullable<typeof once>, new Date(0));
    expect(twice).toEqual(once);
  });

  it('refuses a version it does not know', () => {
    expect(migrate({ ...v1(), saveVersion: 99 }, now)).toBeNull();
    expect(migrate({ ...v1(), saveVersion: 0 }, now)).toBeNull();
  });

  it('is current after migrating', () => {
    expect(migrate(v1(), now)?.saveVersion).toBe(SAVE_VERSION);
  });
});

describe('migrate v2 -> v3', () => {
  /** A version-2 save as Milestone 8 wrote it: one archived season, no goal links. */
  function v2(): SaveV2 {
    const base = v1();
    return {
      ...base,
      saveVersion: 2,
      seasons: {
        current: { number: 2, startedAt: '2026-09-30T00:00:00.000Z' },
        archive: [
          {
            number: 1,
            name: 'First try',
            startedAt: '2026-09-15T06:00:00.000Z',
            endedAt: '2026-09-30T00:00:00.000Z',
            city: { buildings: [{ type: 'park', row: 1, col: 1 }] },
            stats: {
              tasksCompleted: {
                Study: 1,
                Health: 0,
                Chores: 0,
                'Money/Admin': 0,
                Social: 0,
                Projects: 0,
              },
              population: 0,
            },
          },
        ],
      },
      goals: [],
      keepsake: { type: 'park', row: 1, col: 1, fromSeason: 1 },
    };
  }

  it('adds an empty goal link to every task and an empty goal list to every archived season', () => {
    const before = v2();
    const after = migrate(before, now);
    expect(after?.saveVersion).toBe(SAVE_VERSION);
    expect(after?.tasks).toEqual(
      before.tasks.map((task) => ({ ...task, goalId: null })),
    );
    expect(after?.seasons.archive).toEqual([
      { ...before.seasons.archive[0], goals: [] },
    ]);
    // Nothing else moves.
    expect(after?.seasons.current).toEqual(before.seasons.current);
    expect(after?.wallet).toEqual(before.wallet);
    expect(after?.city).toEqual(before.city);
    expect(after?.keepsake).toEqual(before.keepsake);
    expect(after?.goals).toEqual([]);
  });

  it('loads through parseSave and round-trips afterwards', () => {
    const parsed = parseSave(JSON.stringify(v2()), now);
    expect(parsed?.migrated).toBe(true);
    const again = parseSave(serializeSave(parsed!.save), new Date(0));
    expect(again?.migrated).toBe(false);
    expect(again?.save).toEqual(parsed?.save);
  });
});

describe('parseSave with a v1 file', () => {
  it('upgrades it and says so', () => {
    const parsed = parseSave(V1_EXPORT, now);
    expect(parsed?.migrated).toBe(true);
    expect(parsed?.save).toEqual(migrate(v1(), now));
  });

  it('exports and re-imports the upgraded save unchanged', () => {
    const upgraded = parseSave(V1_EXPORT, now)?.save;
    expect(upgraded).toBeDefined();
    const again = parseSave(serializeSave(upgraded!), new Date(0));
    expect(again?.migrated).toBe(false);
    expect(again?.save).toEqual(upgraded);
  });
});

describe('earliestCreatedAt', () => {
  it('returns null with no tasks', () => {
    expect(earliestCreatedAt([])).toBeNull();
  });

  it('skips dates it cannot read', () => {
    const tasks = v1().tasks;
    tasks[1] = { ...tasks[1], createdAt: 'last Tuesday' };
    expect(earliestCreatedAt(tasks)).toBe('2026-09-18T08:30:00.000Z');
    expect(earliestCreatedAt([tasks[1]])).toBeNull();
  });
});
