# Taskopolis

A personal to-do list where completing real tasks builds a city. Each task
category (Study, Health, Chores, Money/Admin, Social, Projects) earns its own
coins, and each coin type funds a different city district — so your city shows
how balanced your life is.

## Install and run

You need [Node.js](https://nodejs.org/) (v20 or newer) and npm.

```bash
npm install   # download dependencies (first time only)
npm run dev   # start the dev server — open the URL it prints (usually http://localhost:5173)
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
- Data is saved in the browser's `localStorage` — there is no backend and
  no accounts, so nothing ever leaves your machine.

Tests sit next to the file they test (`config.ts` → `config.test.ts`) and
run with Vitest. Before every milestone we run `npm test` and
`npm run build`; both must pass.

## Folder layout

```
Taskopolis/
├── docs/PLAN.md          # milestone-by-milestone build plan
├── index.html            # the single page Vite serves
├── public/               # static files served as-is (favicon)
├── src/
│   ├── game/             # ALL game rules — plain TS, no React/DOM
│   │   ├── config.ts     # every balance number, commented
│   │   └── config.test.ts
│   ├── App.tsx           # top-level page component
│   ├── App.css           # styles for App
│   ├── index.css         # global base styles
│   └── main.tsx          # entry point: mounts <App/> into index.html
├── package.json          # npm scripts and dependencies
├── tsconfig*.json        # TypeScript settings (strict mode on)
└── vite.config.ts        # Vite settings
```
