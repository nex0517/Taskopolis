# Taskopolis — Build Plan

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

## Milestone 3 — The city (not started)

## Milestone 4 — Neglect (not started)

## Milestone 5 — Juice (not started)
