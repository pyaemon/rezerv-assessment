'use client';

import { useCallback, useMemo, useRef } from 'react';

import { useControllableState } from './useControllableState';
import type {
  AnyColumnDef,
  PreparedColumn,
  PreparedRow,
  SortState,
} from './types';

/* Comparators */

const collator = new Intl.Collator(undefined, {
  numeric: true,
  sensitivity: 'base',
});

const isNil = (value: unknown): boolean =>
  value === null || value === undefined;

/** Numbers, dates and booleans compare naturally; the rest use a
 *  numeric-aware collator, so "Studio 2" sorts before "Studio 10". */
export function defaultComparator(a: unknown, b: unknown): number {
  if (typeof a === 'number' && typeof b === 'number') return a - b;
  if (a instanceof Date && b instanceof Date) return a.getTime() - b.getTime();
  if (typeof a === 'boolean' && typeof b === 'boolean') {
    return Number(a) - Number(b);
  }
  return collator.compare(String(a), String(b));
}

/* Options / instance */

export interface UseDataTableOptions<TRow> {
  data: readonly TRow[];
  columns: readonly AnyColumnDef<TRow>[];
  /** Must be stable per row across renders — it keys React and expansion state. */
  getRowId: (row: TRow, index: number) => string;

  /* Sorting — omit the controlled prop to let the table own the state. */
  sort?: SortState | null;
  defaultSort?: SortState | null;
  onSortChange?: (sort: SortState | null) => void;
  /** `true` when the parent supplies already-sorted data (server-side). */
  manualSorting?: boolean;

  /* Pagination — same controlled/uncontrolled contract. */
  page?: number;
  defaultPage?: number;
  onPageChange?: (page: number) => void;
  pageSize?: number;
  defaultPageSize?: number;
  onPageSizeChange?: (pageSize: number) => void;
  /** `true` when `data` is already a single page (server-side). */
  manualPagination?: boolean;
  /** Total row count across all pages. Required when `manualPagination`. */
  rowCount?: number;
}

export interface DataTableInstance<TRow> {
  columns: PreparedColumn<TRow>[];
  rows: PreparedRow<TRow>[];
  /** Combined width of all left-pinned columns, in px. */
  pinnedWidth: number;

  sort: SortState | null;
  toggleSort: (columnId: string) => void;

  page: number;
  pageSize: number;
  pageCount: number;
  rowCount: number;
  setPage: (page: number) => void;
  setPageSize: (pageSize: number) => void;
  /** 1-based inclusive display range, e.g. "Showing 11–20 of 84". */
  range: { from: number; to: number };
}

const isDev = process.env.NODE_ENV !== 'production';

/** Headless: sorting, pagination, column layout. Renders nothing, so it can
 *  drive `<DataTable>` or any other presentation. */
export function useDataTable<TRow>(
  options: UseDataTableOptions<TRow>,
): DataTableInstance<TRow> {
  const {
    data,
    columns,
    getRowId,
    sort: sortProp,
    defaultSort = null,
    onSortChange,
    manualSorting = false,
    page: pageProp,
    defaultPage = 1,
    onPageChange,
    pageSize: pageSizeProp,
    defaultPageSize = 10,
    onPageSizeChange,
    manualPagination = false,
    rowCount: rowCountProp,
  } = options;

  const [sort, setSort] = useControllableState<SortState | null>(
    sortProp,
    defaultSort,
    onSortChange,
  );
  const [page, setPageState] = useControllableState<number>(
    pageProp,
    defaultPage,
    onPageChange,
  );
  const [pageSize, setPageSizeState] = useControllableState<number>(
    pageSizeProp,
    defaultPageSize,
    onPageSizeChange,
  );

  const columnsById = useMemo(() => {
    const map = new Map<string, AnyColumnDef<TRow>>();
    for (const column of columns) map.set(column.id, column);
    return map;
  }, [columns]);

  /** A sort pointing at a column that no longer exists is ignored, not fatal. */
  const activeSort = useMemo<SortState | null>(() => {
    if (!sort) return null;
    if (!columnsById.has(sort.columnId)) {
      if (isDev) {
        console.warn(
          `[DataTable] Ignoring sort on unknown column "${sort.columnId}".`,
        );
      }
      return null;
    }
    return sort;
  }, [sort, columnsById]);

  const sortedData = useMemo(() => {
    if (manualSorting || !activeSort) return data;

    const column = columnsById.get(activeSort.columnId);
    if (!column) return data;

    const direction = activeSort.direction === 'asc' ? 1 : -1;
    const compare = column.sortFn ?? defaultComparator;

    // Decorate-sort-undecorate: the accessor runs once per row rather than
    // O(n log n) times, which is what keeps 10k-row sorts off the main thread
    // long enough to matter.
    const decorated = data.map((row, index) => ({
      row,
      index,
      value: column.accessor(row),
    }));

    decorated.sort((a, b) => {
      const aNil = isNil(a.value);
      const bNil = isNil(b.value);
      // Empty values sink to the bottom in both directions.
      if (aNil || bNil) {
        if (aNil && bNil) return a.index - b.index;
        return aNil ? 1 : -1;
      }
      const result = compare(a.value, b.value);
      // Index tiebreak keeps the sort stable and predictable.
      return result !== 0 ? direction * result : a.index - b.index;
    });

    return decorated.map((entry) => entry.row);
  }, [data, activeSort, manualSorting, columnsById]);

  const rowCount = manualPagination
    ? rowCountProp ?? data.length
    : sortedData.length;

  const safePageSize = Math.max(1, Math.floor(pageSize) || 1);
  const pageCount = Math.max(1, Math.ceil(rowCount / safePageSize));

  const safePage = Math.min(Math.max(1, Math.floor(page) || 1), pageCount);

  const pageRows = useMemo(() => {
    if (manualPagination) return sortedData;
    const start = (safePage - 1) * safePageSize;
    return sortedData.slice(start, start + safePageSize);
  }, [sortedData, manualPagination, safePage, safePageSize]);

  // Held in a ref so an inline `getRowId` arrow doesn't bust the memo.
  const getRowIdRef = useRef(getRowId);
  getRowIdRef.current = getRowId;

  const rows = useMemo<PreparedRow<TRow>[]>(
    () =>
      pageRows.map((row, index) => ({
        id: getRowIdRef.current(row, index),
        row,
        index,
      })),
    [pageRows],
  );

  const { preparedColumns, pinnedWidth } = useMemo(() => {
    let offset = 0;
    let lastPinnedId: string | null = null;
    for (const column of columns) {
      if (column.pinned === 'left') lastPinnedId = column.id;
    }

    const prepared = columns.map<PreparedColumn<TRow>>((column) => {
      let pinnedOffset: number | null = null;
      if (column.pinned === 'left') {
        pinnedOffset = offset;
        if (isDev && column.width === undefined) {
          console.warn(
            `[DataTable] Pinned column "${column.id}" has no \`width\`; ` +
              'later pinned columns will overlap it.',
          );
        }
        offset += column.width ?? 0;
      }
      return {
        column,
        pinnedOffset,
        isLastPinned: column.id === lastPinnedId,
        sortDirection:
          activeSort?.columnId === column.id ? activeSort.direction : null,
      };
    });

    return { preparedColumns: prepared, pinnedWidth: offset };
  }, [columns, activeSort]);

  const pageCountRef = useRef(pageCount);
  pageCountRef.current = pageCount;

  const setPage = useCallback(
    (next: number) => {
      const clamped = Math.min(
        Math.max(1, Math.floor(next) || 1),
        pageCountRef.current,
      );
      setPageState(clamped);
    },
    [setPageState],
  );

  const setPageSize = useCallback(
    (next: number) => {
      setPageSizeState(Math.max(1, Math.floor(next) || 1));
      setPageState(1);
    },
    [setPageSizeState, setPageState],
  );

  /** asc -> desc -> unsorted. */
  const toggleSort = useCallback(
    (columnId: string) => {
      setSort((previous) => {
        if (!previous || previous.columnId !== columnId) {
          return { columnId, direction: 'asc' };
        }
        if (previous.direction === 'asc')
          return { columnId, direction: 'desc' };
        return null;
      });
      // A re-sort invalidates the current page offset.
      setPageState(1);
    },
    [setSort, setPageState],
  );

  const range = useMemo(() => {
    if (rowCount === 0) return { from: 0, to: 0 };
    const from = (safePage - 1) * safePageSize + 1;
    return { from, to: Math.min(from + rows.length - 1, rowCount) };
  }, [rowCount, safePage, safePageSize, rows.length]);

  return {
    columns: preparedColumns,
    rows,
    pinnedWidth,
    sort: activeSort,
    toggleSort,
    page: safePage,
    pageSize: safePageSize,
    pageCount,
    rowCount,
    setPage,
    setPageSize,
    range,
  };
}
