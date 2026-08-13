# Part 2 — Reusable Data Table

A generic, fully typed data table built from scratch (no TanStack Table, AG Grid,
MUI DataGrid or similar), used to render a fitness studio's class timetable.

**Live demo:** _add your deployed URL here_

- `/` — **Class timetable.** Real usage: expandable classes, attendees as child
  rows, client-side sort and pagination.
- `/demo` — **Component demo.** The same component against a second, differently
  shaped dataset (invoices) in server-driven mode, plus a 10,000-row table to
  show behaviour at scale.

---

## Setup

```bash
npm install
npm run dev        # http://localhost:3000
```

```bash
npm run build      # production build
npm run typecheck  # tsc --noEmit
```

Node 20+. No environment variables, no backend — all data is mocked in the
browser (`src/lib/mockApi.ts`).

---

## What to look at

| Path                                               | What it is                                           |
| -------------------------------------------------- | ---------------------------------------------------- |
| `src/components/DataTable/useDataTable.ts`         | Headless logic: sorting, pagination, column layout   |
| `src/components/DataTable/useRowExpansion.ts`      | Expanded-row state for both child-row modes          |
| `src/components/DataTable/useControllableState.ts` | The controlled/uncontrolled primitive                |
| `src/components/DataTable/DataTable.tsx`           | Presentation: markup, states, ARIA                   |
| `src/components/DataTable/types.ts`                | `ColumnDef`, `createColumnHelper`                    |
| `src/lib/mockApi.ts`                               | Latency, aborts, failures, server-side sort/paginate |

---

## Component API

### Column definitions

Columns are data, not markup. A `ColumnDef<TRow, TValue>` carries:

```ts
interface ColumnDef<TRow, TValue> {
  id: string; // identity, and the sort key
  header: ReactNode;
  accessor: (row: TRow) => TValue; // the sortable/renderable value
  cell?: (ctx: CellContext<TRow, TValue>) => ReactNode;
  sortable?: boolean;
  sortFn?: (a: TValue, b: TValue) => number;
  width?: number; // px — required for pinned columns
  minWidth?: number;
  align?: "left" | "center" | "right";
  pinned?: "left";
  headerLabel?: string; // a11y name when `header` isn't plain text
}
```

`createColumnHelper<TRow>()` gives per-column inference, so `value` inside
`cell` is typed from the accessor rather than widened to `unknown`:

```ts
const column = createColumnHelper<ClassSession>();

column.accessor((row) => row.booked, {
  id: "attendance",
  header: "Attendance",
  sortable: true,
  width: 148,
  align: "right",
  cell: ({ value, row }) => `${value} / ${row.capacity}`,
});
```

The table itself is generic over both the row and the child type:
`<DataTable<ClassSession, Attendee> … />`. Nothing in `DataTable` knows what a
class or an invoice is.

### Headless layer

`useDataTable` returns prepared rows, prepared columns (with resolved pinned
offsets and sort direction), and the pagination controls. It renders nothing, so
the same logic could drive a card list or a virtualised body. `DataTable` is one
consumer of it.

---

## Client-side vs server-side

The same component covers both, through one primitive —
`useControllableState`. Omitting a prop keeps that piece of state internal;
passing it (including `null`) hands ownership to the parent:

```tsx
<DataTable data={sessions} defaultSort={{ columnId: 'time', direction: 'asc' }} />

<DataTable
  data={pageRows}
  sort={sort} onSortChange={setSort} manualSorting
  page={page} onPageChange={setPage}
  pageSize={pageSize} onPageSizeChange={setPageSize} manualPagination
  rowCount={total}
/>
```

`manualSorting` / `manualPagination` are separate from controlled-ness on
purpose: a parent may want to _observe_ sort state while still letting the table
do the sorting. `rowCount` is what drives the page count in manual mode, since
`data.length` is then only one page.

Sorting cycles **asc → desc → unsorted**, and re-sorting resets to page 1.

**Performance detail:** the comparator uses decorate-sort-undecorate, so each
row's accessor runs once (O(n)) rather than on every comparison (O(n log n)).
Measured in Chrome on the demo page: sorting 10,000 rows and committing a
100-row page takes **~55 ms**, and only the current page is ever mounted.

---

## Expandable rows

Both modes are supported behind one config object, and the mode is inferred from
which resolver you supply.

**Inline** — children already travel with the parent:

```ts
{ getChildren: (row) => row.attendees, renderChildren: ({ children, row }) => … }
```

**On-demand** — children are fetched the first time a row is expanded:

```ts
{
  fetchChildren: (row, signal) => api.getAttendees(row.id, { signal }),
  renderChildren: ({ children, row }) => …,
}
```

On-demand behaviour:

- Per-row state machine — `idle → loading → success | error` — kept in a `Map`
  keyed by row id.
- **Fetches are kicked off from the toggle handler, not an effect.** The fetch
  is a consequence of a user action, not of rendering; this means no double-fetch
  under StrictMode and no effect dependency choreography.
- **Results are cached.** Collapsing and re-expanding a row is instant; verified
  in the browser (re-expand renders from cache with no second request).
- **In-flight requests are aborted** if the user collapses the row first, and on
  unmount. The loading state is discarded so a later re-expand starts clean.
- **Errors are per row**, with a retry that bypasses the cache. `cls-004`
  (Aerial Yoga) and `REZ-2026-0003` always fail, so the error path is reachable
  deterministically rather than by getting unlucky with a random failure rate.
- Empty child lists get their own message, distinct from "still loading".

The panel renders in a sibling `<tr>` spanning the full width. It animates with
`grid-template-rows: 0fr → 1fr`, which reaches the panel's natural height
**without measuring anything in JavaScript** — so expanding never forces a
reflow. Panel contents mount lazily on first expand, and collapsed panels are
marked `inert` so their controls stay out of the tab order.

---

## Sticky column

- Pinned cells are `position: sticky; left: <accumulated offset>`, with the
  offset summed across preceding pinned columns in `useDataTable`.
- The table uses `table-layout: fixed`, so a column's rendered width always
  equals its declared width and those offsets can't drift. This is why pinned
  columns **must** declare a `width` (a dev-only warning fires if one doesn't).
- Pinned cells use `background: inherit`, picking up whatever the row is
  currently painted with — default, hover, or expanded — so a single rule keeps
  them opaque in every row state. Header cells state the surface colour outright,
  because `inherit` on a `<th>` resolves to a transparent `<tr>`.
- The shadow lives on a `::after` pseudo-element toggled by a `data-scrolled`
  attribute, so appearing and disappearing animates **opacity only**.
- `useHorizontalScroll` tracks the boundaries with a passive, rAF-throttled
  scroll listener plus a `ResizeObserver`. The state setter bails out unless a
  boundary is actually crossed, so a full horizontal scroll causes at most two
  React renders rather than one per frame.
- On narrow viewports the table scrolls inside its own region; the page body
  never scrolls sideways. The scroll region is focusable with a label, so
  keyboard users can reach and arrow-scroll it.

---

## State management

**Local `useState` inside two hooks. No Redux, Zustand, or context.**

The reasoning: this is a reusable component, and the state in question — sort,
page, expansion — belongs to a table instance, not to an application. Reaching
for a global store would force every consumer to adopt it and would make two
tables on one page (exactly what `/demo` does) collide. Anything a parent needs
to own is already liftable through the controlled props, which is the React
answer to this problem and costs no dependency.

Within that:

- `useDataTable` — sort and pagination.
- `useRowExpansion` — expanded ids, plus the per-row child cache and its
  `AbortController`s in refs (mutable, non-rendering data).
- Derived values are computed in `useMemo`, never mirrored into state, so there
  is no synchronisation to get wrong.

---

## Accessibility

- Real `<table>` semantics with `scope="col"` headers.
- `aria-sort` on sortable headers, sort toggled by a real `<button>`.
- `aria-expanded` + `aria-controls` on expanders; collapsed panels are `inert`.
- A visually hidden `role="status"` region announces the current row range.
- Visible focus rings throughout; a skip link to main content.
- `prefers-reduced-motion` is honoured globally.

---

## Edge cases covered

| Case                 | Behaviour                                                                |
| -------------------- | ------------------------------------------------------------------------ |
| Empty dataset        | Dedicated empty state with title + description                           |
| Empty child list     | "Nothing to show here yet" inside the panel                              |
| Failed initial fetch | Error row with a retry; toggle it on the timetable page                  |
| Failed child fetch   | Per-row error + retry, cache bypassed on retry                           |
| Slow fetch           | Skeleton rows matching the column layout; refetches dim instead          |
| Out-of-range page    | Clamped at read time — no effect loop, no fight with a controlled parent |
| Invalid sort key     | Ignored with a dev warning; the mock API ignores it too                  |
| Cancelled class      | Not expandable — no chevron rendered                                     |
| Narrow viewport      | Table scrolls horizontally with the pinned column held                   |

---

## Tradeoffs and assumptions

**Assumptions**

- The table renders one page at a time, so **pagination is the answer to large
  datasets** rather than virtualisation. 10,000 rows sort fine; only `pageSize`
  rows are mounted. Virtualisation would be the next step for an unpaginated
  view, and would replace the `<tbody>` renderer without touching the headless
  layer.
- Pinned columns declare a fixed pixel width. Auto-measuring them would mean
  reading layout on every resize; a declared width is both faster and more
  predictable.
- Only left pinning is implemented. Right pinning is the same mechanism with a
  reversed accumulator and was left out as unused here.
- One sort column at a time. Multi-sort would extend `SortState` to an array
  without changing the public shape of anything else.

**Tradeoffs**

- **Expansion `<tr>`s are always rendered** for expandable rows, with contents
  mounted lazily on first expand. This buys a free enter _and_ exit animation
  with no mount/unmount choreography, at the cost of one empty row element per
  visible row — negligible at page sizes, and bounded by pagination.
- **Child rows are a render prop, not a nested `DataTable`.** Child rows here
  need no sorting, pagination or pinning; recursing the full component would
  cost more than it returns. `MiniTable` is the shared presentation instead.
- **The expanded panel scrolls with the table** on narrow viewports. Pinning the
  panel content to the left edge is possible but needs the scroller's width
  threaded into CSS; it wasn't worth the complexity here.
- **No test suite.** Within the time budget I put the effort into the component
  API and the states. Behaviour was verified manually in Chrome — sort, both
  expansion modes, cache-on-re-expand, abort-on-collapse, retry, the sticky
  shadow, and the 10k-row sort timing quoted above. The headless hooks are
  deliberately pure and would be the natural first thing to unit test.
