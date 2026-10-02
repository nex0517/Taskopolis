# Taskopolis

A personal to-do list where completing real tasks builds a city. Each task
category (Study, Health, Chores, Money/Admin, Social, Projects) earns its own
coins, and each coin type funds a different city district — so your city shows
how balanced your life is.

It runs online at **https://nex0517.github.io/Taskopolis/** and can be installed
on a phone or laptop like an app (see "Using it on your phone" below).

## Install and run

You need [Node.js](https://nodejs.org/) (v22.12 or newer — Vitest 5 and Vite 8 both require it) and npm.

```bash
npm install   # download dependencies (first time only)
npm run dev   # start the dev server — open the URL it prints (usually http://localhost:5173/Taskopolis/)
npm test      # run the tests once
npm run build # type-check and build the production bundle
npm run lint  # run the linter (oxlint, comes with the Vite template)
```

## How the code is organised

The golden rule: **the game rules live apart from the UI.**

- Everything in `src/game/` is plain TypeScript. It knows nothing about
  React, the browser, or localStorage. Each function takes data in and
  returns new data out, so the rules are easy to test and easy to reason
  about.
- React components (in `src/`, later in `src/components/`) only *call* those
  functions and display what they return. They never contain game rules.
- Every balance number (rewards, costs, caps) lives in one file,
  `src/game/config.ts`, with a comment on each one. If you want to tune the
  game, that's the only file to touch.
- The game rules are written out in plain English in `docs/SPEC.md`.
- Data is saved in the browser's `localStorage` — there is no backend and
  no accounts, so nothing ever leaves your machine.

Tests sit next to the file they test (`config.ts` → `config.test.ts`) and
run with Vitest. Before every milestone we run `npm test` and
`npm run build`; both must pass.

## Folder layout

```
Taskopolis/
├── .github/workflows/deploy.yml  # builds and publishes main to GitHub Pages
├── docs/PLAN.md          # milestone-by-milestone build plan
├── index.html            # the single page Vite serves
├── public/               # static files served as-is (favicon, app icons)
├── src/
│   ├── game/             # ALL game rules — plain TS, no React/DOM
│   │   ├── config.ts     # every balance number, commented
│   │   ├── types.ts      # Task, TaskCategory, SaveData, ...
│   │   ├── tasks.ts      # pure task operations (add/edit/complete/delete)
│   │   ├── economy.ts    # rewards, wallet updates, affordability, spending
│   │   ├── buildings.ts  # building catalogue and costs
│   │   ├── city.ts       # city placement and population rules
│   │   ├── dormant.ts    # quiet (dormant) districts and wake-up messages
│   │   ├── seasons.ts    # ending a season, season stats, renaming
│   │   ├── save.ts       # build/check/serialize the save object
│   │   ├── migrate.ts    # upgrades old saves (v1 → v2: adds seasons)
│   │   └── *.test.ts     # Vitest tests, next to the code they test
│   ├── components/       # React UI (each .tsx has a matching .css)
│   │   ├── UpdateBanner.tsx # "Update available" when a new version is online
│   │   ├── TaskForm.tsx  # add + edit form
│   │   ├── TaskList.tsx  # the task rows
│   │   ├── FilterBar.tsx # category + done/not-done filters
│   │   ├── SaveControls.tsx # export/import buttons
│   │   ├── WalletPanel.tsx  # category coin balances
│   │   ├── ShopPanel.tsx    # building catalogue and selection
│   │   ├── CityGrid.tsx     # interactive city tiles
│   │   ├── EndSeasonPanel.tsx # season line + the End season confirm step
│   │   ├── Gallery.tsx      # past seasons as cards, with rename
│   │   └── MiniCity.tsx     # small read-only city used by the gallery
│   ├── storage.ts        # the ONLY file that touches localStorage
│   ├── saveFile.ts       # downloads the save as a JSON file
│   ├── useNow.ts         # current time, refreshed once a minute
│   ├── useJuice.ts       # one-shot animation triggers
│   ├── App.tsx           # top-level page: owns the save, wires components
│   ├── App.css           # styles for App
│   ├── index.css         # global base styles
│   ├── phone.css         # small-screen layout rules, all in one place
│   ├── persist.ts        # asks the browser to keep our storage
│   └── main.tsx          # entry point: mounts <App/> into index.html
├── package.json          # npm scripts and dependencies
├── tsconfig*.json        # TypeScript settings (strict mode on)
└── vite.config.ts        # Vite settings: base path, PWA manifest, offline cache
```

## Using it on your phone

The live site is https://nex0517.github.io/Taskopolis/. You can use it in the
browser, or install it so it opens like a normal app with its own icon:

- **Android (Chrome):** open the site, tap the ⋮ menu, then **Add to Home
  screen** (or **Install app**), then **Install**.
- **iPhone / iPad (Safari):** open the site, tap the Share button (the square
  with an arrow), scroll down and tap **Add to Home Screen**, then **Add**.
- **Laptop (Chrome / Edge):** click the small install icon at the right end of
  the address bar, or use the browser menu → **Install Taskopolis**.

After the first visit the app also works offline, and when a new version is
published a small "Update available — Reload" banner appears.

**Each device keeps its own save.** There are no accounts and nothing is sent
anywhere, so your phone and your laptop each have their own city — there is
no sync yet. To move a city between devices, click **Export save** on one
device (it downloads a small `.json` file), get that file onto the other
device (email it to yourself, for example), and click **Import save** there.
