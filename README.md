# Rezerv Frontend Engineering Assessment

Two independent parts, one repository.

| Part | What it is | Code | Live |
| --- | --- | --- | --- |
| **Part 1** | UI Animation Challenge — animated landing page | [`part-1-animation/`](./part-1-animation) | _add URL_ |
| **Part 2** | Component Engineering Challenge — reusable data table | [`part-2-data-table/`](./part-2-data-table) | _add URL_ |

Each part is a standalone app with its own README, dependencies and deployment.

## Part 1 — UI Animation Challenge

React 19 · Next.js 16 · TypeScript · SCSS Modules · GSAP + ScrollTrigger · Lenis

A single scroll-driven landing page: loading screen, hero, and a collection
section. Every fruit is drawn in CSS, so the page ships no images. Measured at
a 16.6 ms median frame time with zero dropped frames while scrolling.

```bash
cd part-1-animation
npm install
npm run dev
```

Full write-up — the three sections, library choices, animation and smooth-scroll
approach, responsiveness, performance measurements, assumptions and tradeoffs —
in [`part-1-animation/README.md`](./part-1-animation/README.md).

## Part 2 — Reusable Data Table

React 19 · Next.js 16 · TypeScript · SCSS Modules · no table/grid library.

A generic, fully typed `<DataTable>` built from scratch, rendering a fitness
studio's class timetable, plus a demo page proving the same component works
against a differently shaped dataset in server-driven mode.

```bash
cd part-2-data-table
npm install
npm run dev
```

Full write-up — component API, controlled vs uncontrolled strategy, both
expansion modes, sticky-column approach, state management, tradeoffs — in
[`part-2-data-table/README.md`](./part-2-data-table/README.md).
