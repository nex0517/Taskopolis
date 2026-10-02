# Taskopolis — Game Spec

This file describes the game rules. The numbers live in `src/game/config.ts`;
this file explains what they mean. (The original sprint-1 brief was given in
chat; the sprint-1 section below records the rules as they were built.)

## Sprint 1 design

### Tasks
- A task has a title, a category, a size (S, M or L) and an optional due date.
- Categories: Study, Health, Chores, Money/Admin, Social, Projects.
- Tasks can be added, edited, completed, un-completed and deleted.
- Everything is saved in the browser's localStorage. No backend, no accounts.

### Economy
- Completing a task pays coins of its own category: S = 1, M = 3, L = 8.
- Un-completing a task takes the reward back, but a balance never goes below
  zero (the coins may already have been spent).
- A completed task's category and size are locked, so the refund always
  matches what was paid.

### City
- The city is a 12×12 grid.
- Each category funds one district: Study → Education, Health → Parks,
  Chores → Utilities, Money/Admin → Commerce, Social → Culture,
  Projects → Industry.
- District buildings cost 3, 6, 10 or 15 coins of their category (by tier).
- A home costs 1 coin from each of 3 different categories.
- Population = min(homes × 4, district buildings × 8): homes house people,
  district buildings are the services that let them live there.

### Neglect (Milestone 4) — REPLACED in Sprint 2
> These rules were removed in Milestone 6. See "Dormant & wake" below.

- A category was neglected if it had an unfinished task whose due date was
  before today.
- Its district's buildings were greyed out with a ⚠️ badge and a named
  problem (flickering lights, weeds, potholes, unpaid bills, graffiti,
  broken machines), and pulsed gently.
- Completing, deleting or re-dating the overdue task fixed it immediately.

## Sprint 2 design

### Dormant & wake (Milestone 6)
Districts no longer react to overdue tasks. They react to inactivity. Coming
back should feel like a reward, not a guilt pile.

- A category is **dormant** if its most recent completed task is older than
  `DORMANT_AFTER_DAYS` (7). A task completed exactly 7 days ago counts as
  dormant; 6 days ago does not.
- A category with no completed tasks ever is **not** dormant. Its district
  is just empty.
- Homes are never dormant.
- Dormancy is derived from the tasks' `completedAt` times. Nothing new is
  stored in the save.
- Completing one task in a dormant category wakes it immediately.
  Un-completing that task can make the category dormant again.
- Look: dormant buildings are dimmed and quiet (lower saturation). No warning
  icons and nothing that looks broken.
- Waking: when a category wakes, a short "lights coming back on" animation
  plays across that district, and a friendly one-line message appears, for
  example "The library is open again." Under `prefers-reduced-motion` the
  animation is switched off, but the message still shows.
- Due dates stay on tasks, but they no longer affect the city.

### Save format v2 (Milestone 7)
No visible features. The save gains room for Seasons and Wonders.

- `saveVersion` is 2. New fields:
  - `seasons.current`: `{ number, startedAt }` — the season being played.
  - `seasons.archive`: a list of finished seasons, each with `number`, `name`,
    `startedAt`, `endedAt`, a copy of the `city` as it was, and `stats`
    (`tasksCompleted` per category and the `population` at the end).
  - `goals`: an empty list until Wonders (Milestone 9).
  - `keepsake`: `null` until a later milestone defines it.
- Upgrading a version-1 save: the existing city becomes season 1, started at
  the earliest task's `createdAt` (or now, if there are no tasks). No task,
  coin or building changes. Upgrading an already-current save changes nothing.
- A save whose version the app has never heard of is treated like a corrupted
  one: backed up under the second localStorage key and a fresh game started.

### Seasons (Milestone 8)
A season is a chapter of the city. Ending one is a celebration, not a reset.

- The current season has a number and a start time. A fresh game is season 1;
  a migrated v1 save's existing city is season 1 too.
- **End season** (with a confirm step) does, in order: archive the city as it
  is, with stats (tasks completed per category *during* the season, and the
  population at the end); let the player keep ONE building as a keepsake; then
  start season N+1 with an empty city where only the keepsake stands, on its
  old tile, for free. Coins and tasks are unchanged. If the city is empty there
  is nothing to keep and the season still ends.
- An archived season gets the default name "Season N" and can be renamed in
  the gallery. Blank names are ignored.
- The gallery shows every past season as a card: name, dates, population, a
  small read-only view of the city, and tasks completed per category.
- `keepsake` in the save records the most recent kept building and which
  season it came from.
