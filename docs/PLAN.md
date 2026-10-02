# Taskopolis — Build Plan

## Milestone P1 — Online + installable (PWA)

- Platform track, built alongside Milestone 6: nothing in `src/game/` changes and `App.tsx` is left alone, so the two branches merge cleanly.
- Deploy with a GitHub Actions workflow (`.github/workflows/deploy.yml`) that runs `npm ci`, `npm test` and `npm run build` on every push to `main`, then publishes `dist/` to GitHub Pages at `https://nex0517.github.io/Taskopolis/`.
- Set Vite's `base` to `/Taskopolis/` so every asset URL works under that sub-path (the dev server moves to `http://localhost:5173/Taskopolis/` too, so dev and live behave the same).
- Add `vite-plugin-pwa` (the one allowed package) to generate the web manifest and a service worker that caches the built files, so the app opens offline after the first visit.
- Icons are plain PNGs drawn from the existing skyline favicon (192, 512, maskable and Apple touch icon) in `public/`, no emoji fonts needed.
- Updates: the service worker waits instead of taking over silently; a tiny `UpdateBanner` component (rendered from `main.tsx`, not `App.tsx`) shows "Update available — reload" when a new version is deployed.
- Ask the browser for persistent storage once at start-up (`navigator.storage.persist()` in `src/persist.ts`) so the save is less likely to be evicted.
- Phone layout (~380px): one shared `src/phone.css` holds all small-screen rules, so no component CSS file is touched. Task rows wrap onto two lines, and the city grid keeps tiles finger-sized and scrolls sideways inside its own box.
- README: a plain-English "Using it on your phone" section (install on Android and iPhone, one save per device, export/import to move a city).
- Run `npm test`, `npm run build` and `npm run lint`; commit as `Milestone P1: online + PWA`, open a PR, then report and stop.

## Milestone 0 — Setup

- Scaffold a Vite + React + TypeScript project in the repo root (strict mode on via the template's tsconfig).
- Add Vitest as a dev dependency (part of the fixed stack); add an `npm test` script.
- Create `src/game/` (plain TypeScript, no React) with `config.ts` holding `GRID_SIZE = 12` — the first real balance number from the design.
- Write one sample Vitest test (`config.test.ts`) to prove the test runner works.
- Replace the starter page with a minimal screen titled "Taskopolis"; plain CSS only.
- Write README.md: how to install and run, a plain-English "How the code is organised" section, and the folder layout.
- Verify: `npm test` and `npm run build` pass; `npm run dev` serves a page titled Taskopolis.
- Commit as "Milestone 0: project setup" and open a PR.

## Milestone 1 — The to-do list (no game yet)

- `src/game/types.ts`: `Task` (id, title, category, size S/M/L, optional dueDate, createdAt, completedAt), the six categories, `SaveData` = { saveVersion, tasks, wallet, city }.
- `src/game/tasks.ts`: pure functions — `addTask`, `updateTask`, `setTaskCompleted`, `removeTask`. Data in, new data out.
- `src/game/save.ts`: `newGame()` (fresh save, wallet zeros, empty city), `serializeSave`, `parseSave` (returns null for bad/missing/wrong-shaped data).
- `src/game/migrate.ts`: `migrate()` — no-op stub for future save versions.
- `src/storage.ts` (app layer, the only file that touches localStorage): `loadSave()` handles no save / corrupted (backup written under a second key, fresh save returned) / other versions via `migrate()`; `writeSave()`. Storage object is injectable so tests don't need a DOM.
- React UI: `TaskForm` (add + edit), `TaskList` (checkbox to complete/un-complete, edit, delete), `FilterBar` (category + done/not-done), `SaveControls` (export downloads JSON, import loads one), all wired in `App.tsx` which owns the save state and writes it back on every change.
- Tests: task add/complete/un-complete/edit/delete, `loadSave` edge cases via a fake storage, export→import gives identical data.
- Verify `npm test` and `npm run build`, update README layout, commit, open PR.

## Milestone 2 — Economy

- Add the task reward numbers to `src/game/config.ts`: S=1, M=3, L=8, each with a one-line comment.
- Add `src/game/economy.ts` with pure functions for reward calculation, adding a reward, checking affordability, spending coins, and refunding on un-complete without going below zero.
- Keep all wallet changes as data-in/data-out functions; no React, DOM, or localStorage in the game folder.
- Add Vitest coverage for every economy function, including spending and the un-complete edge case where coins were already spent.
- Update task completion handling in `App.tsx` so completing a task pays its category and un-completing takes the reward back.
- Show all six category balances in a small wallet panel at the top of the page.
- Keep the save shape unchanged: the wallet already exists in the version-1 save object and will now contain real balances.
- Run `npm test`, `npm run build`, and `npm run lint`; fix any failures.
- Commit as `Milestone 2: economy`, open a PR, browser-test the wallet display and completion flow, then report and stop.

## Milestone 3 — The city

- Add typed city data in `src/game/types.ts`: a list of building types and a `PlacedBuilding` (`type`, `row`, `col`); the city is `{ buildings: PlacedBuilding[] }`, so the version-1 save shape stays compatible.
- Add all new numbers to `src/game/config.ts`: four building cost tiers, the home cost (1 coin from 3 different categories), 4 people per home, and 8 people supported per district building.
- Add `src/game/buildings.ts`: the building catalogue (name, emoji, category, tier) for all six districts plus homes, and a cost lookup.
- Extend `src/game/economy.ts` with affordability and payment for buildings, including homes (paid from the three richest categories).
- Add `src/game/city.ts` with pure functions: find the building on a tile, place a building (refusing out-of-bounds, occupied, or unaffordable tiles), and compute population = min(homes × 4, district buildings × 8).
- Tighten save validation so imported/loaded saves must contain valid placed buildings.
- UI: a shop panel showing each building's cost and whether you can afford it, a 12×12 CSS-grid city, and the population at the top of the page. React only calls the game functions.
- Fix a Milestone 2 review finding: a completed task's category and size are locked, so un-completing always refunds what was actually paid.
- Tests for placement on an empty tile, occupied tile, unaffordable, population cap, home payments, the catalogue, and save validation; then run `npm test`, `npm run build`, and `npm run lint`.
- Commit as `Milestone 3: city`, open a PR, check it in the browser, then report and stop.

## Milestone 4 — Neglect

- Add `src/game/neglect.ts` with pure functions: today's date as a `YYYY-MM-DD` key, "is this task overdue?", and "which categories have an overdue task?".
- A task is overdue only if it is not completed, has a due date, and that date is before today. Tasks with no due date never cause neglect, and tasks due today are not overdue yet.
- "Today" uses the local calendar date (not UTC), because due dates come from the browser's date picker in local time.
- Each district gets a named problem (flickering lights, weeds, potholes, unpaid bills, graffiti, broken machines) so the city shows what kind of trouble it is.
- Nothing is stored for neglect: it is recalculated from the task list on every render, so completing, deleting, or re-dating the overdue task fixes the district immediately and the save format does not change.
- UI: buildings in a neglected district are greyed out with a small ⚠️ badge and a tooltip; homes are never affected. A short line above the grid names the districts that need attention, and overdue tasks are labelled "overdue" in the list.
- No penalties: coins, buildings, and population are unchanged by neglect, so no new balance numbers are needed in `config.ts`.
- Tests for overdue detection (no due date, due today, due yesterday, due tomorrow, completed), neglected categories (order, duplicates, fixed by completing/deleting), and the local-date key; then run `npm test`, `npm run build`, and `npm run lint`.
- Commit as `Milestone 4: neglect`, open a PR, check it in the browser, then report and stop.

## Milestone 5 — Juice

- Animations are plain CSS keyframes. React only decides *which* element gets an animation class, and nothing in `src/game/` changes, because animations are presentation, not game rules.
- Coins flying up: when a task is completed, a small "+3 Study" label (amount from the existing `rewardForTask`) floats up from that task row and fades out, then removes itself.
- Construction: the building that was just placed pops in (grows from small, overshoots slightly, then settles), so buying something feels like an event.
- Problem pulse: buildings in a neglected district slowly pulse their opacity, which draws the eye without being alarming.
- A small `useJuice` hook remembers the last coin reward and the last placed building, with a counter key, so the same animation can replay on a second click.
- Reduced motion: under `prefers-reduced-motion: reduce`, nothing moves. The coin label only fades in place, and the construction and pulse animations are switched off. The problem look itself (grey and ⚠️) stays.
- No new numbers in `config.ts`: animation timings are visual, not game balance, so they live in the CSS files.
- Run `npm test`, `npm run build`, and `npm run lint`; all existing tests must still pass.
- Commit as `Milestone 5: juice`, open a PR, check the animations in the browser, then report and stop.

## Milestone 6 — Dormant & wake the city

- Design change (see `docs/SPEC.md`, "Sprint 2 design"): districts react to inactivity, not overdue tasks. The Milestone 4 neglect rules and visuals are removed.
- Add `DORMANT_AFTER_DAYS = 7` to `src/game/config.ts`.
- Add `src/game/dormant.ts` with pure functions: when a category last had a task completed, whether a category is dormant, the list of dormant categories, whether a building is dormant (homes never are), and a friendly wake-up message for each district.
- A category is dormant when its latest completed task is 7 or more days old. A category with no completed tasks is not dormant. Nothing new goes in the save: it is all worked out from `completedAt`.
- Remove `src/game/neglect.ts`, the "overdue" label in the task list, and the ⚠️ badge, grey dashed look and pulse on buildings.
- Look: dormant buildings are dimmed and desaturated, with a calm tooltip. A short line above the grid lists the quiet districts.
- Waking: completing a task in a dormant category plays a short "lights coming back on" glow across that district and shows a message like "The library is open again." Under reduced motion the glow is off; the message stays.
- `useNow` replaces `useToday`: it refreshes the current time once a minute, so a district can fall asleep while the app is open.
- Tests: exactly 7 vs 6 days, a never-used category, homes, waking on completion, un-completing the only recent task; then `npm test`, `npm run build`, `npm run lint`.
- Commit as `Milestone 6: dormant and wake`, open a PR, check it in the browser, then report and stop.

## Milestone 7 — Save format v2 (no new UI)

- Nothing visible changes. The goal is to give Seasons (M8) and Wonders (M9) a place in the save before they exist, and to prove that upgrading never loses data.
- `SAVE_VERSION` becomes 2 in `src/game/config.ts`. The new fields in `src/game/types.ts`: `seasons` (`current: { number, startedAt }` plus an `archive` list of finished seasons, each with number, name, startedAt, endedAt, a copy of the city and stats: tasks completed per category, population at the end), `goals: []` (filled in by M9) and `keepsake: null`.
- `newGame()` takes an injectable `now` so season 1 of a fresh game starts at a known time in tests.
- `src/game/migrate.ts` grows a real v1 → v2 step: the existing city becomes season 1, started at the earliest task's `createdAt` (or `now` if there are no tasks). A version we have never heard of returns `null`, which `parseSave` treats like a corrupted file, so a newer app's save can't be half-read by an older app.
- `parseSave` checks the fields every version shares, runs `migrate()`, then checks the version-2 fields. It now returns `{ save, migrated }` so `storage.ts` can report "migrated" without re-reading the version itself.
- Tests are the point of this milestone: a real v1 export migrates with every task, coin and building identical; season 1 starts at the earliest task (deliberately not the first in the file); migrating twice changes nothing; export → import of a v2 save round-trips; damaged v2 saves (missing seasons, bad season number, bad archive entry, bad stats) and unknown versions all go through the backup path in `loadSave`.
- Also in this branch, as a separate first commit: the three small review findings from Milestone 6 (wake glow not armed when the district has no buildings, unreadable `completedAt` skipped, glow replays on a fast second wake).
- `docs/SPEC.md` gets a "Save format v2" section under Sprint 2; the README's folder layout no longer calls `migrate.ts` a stub.
- Run `npm test`, `npm run build` and `npm run lint`; commit as `Milestone 7: save format v2`, open a PR, then report (with the steps to test the migration on a real save) and stop.

## Milestone 8 — Seasons

- A season is a chapter of the city. Ending one archives the city with its stats, lets the player keep ONE building as a keepsake, and starts a fresh empty city. Coins and tasks are untouched, so nothing earned is ever lost.
- Rules in `src/game/seasons.ts`, all pure: `seasonStats` (tasks completed per category between the season's start and end, plus final population), `endSeason(save, keepsake, now)` (archive + new empty city with the keepsake placed for free at its old spot), `renameSeason`, `defaultSeasonName`. No new balance numbers are needed, so `config.ts` is unchanged.
- `Keepsake` stops being a placeholder: it records the kept building (`type`, `row`, `col`) and `fromSeason`, so the save knows which tile is the memento. `save.ts` validates it.
- UI, City view: a season line ("Season 1 · since 15 Sept 2026") with an **End season** button. Clicking it opens an inline confirm step: what will happen, a dropdown to pick the keepsake (or "Keep nothing"; hidden when the city is empty), then "Yes, end season" / Cancel.
- UI, Gallery view: a City / Gallery toggle in the header. Each past season is a card: name (with a Rename button → inline input), dates, population, a small read-only `MiniCity`, and tasks completed per category. Newest first.
- `App.tsx` stays around 200 lines by moving the header into `AppHeader.tsx` and the export download into `src/saveFile.ts`; the confirm step lives inside `CityPanel`, so App only gains two handlers.
- Tests: archiving copies the city exactly (equal but not the same array), the new city is empty except the keepsake, stats count only tasks completed inside the season window, ending with an empty city works, a keepsake that isn't in the city is ignored, renaming trims and ignores blank names, and an ended save still round-trips through `parseSave`.
- Phone: gallery cards go single-column in `src/phone.css`.
- Run `npm test`, `npm run build`, `npm run lint`; commit as `Milestone 8: seasons`, open a PR, check it in the browser, then report and stop.
