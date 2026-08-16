import type { ReactNode } from 'react';

/* Sorting */

export type SortDirection = 'asc' | 'desc';

/** `null` is a first-class state: sorting cycles asc -> desc -> null. */
export interface SortState {
  columnId: string;
  direction: SortDirection;
}

/* Columns */

export interface CellContext<TRow, TValue> {
  /** Result of `column.accessor(row)`, computed once per cell render. */
  value: TValue;
  row: TRow;
  /** Index within the currently rendered page, not the full dataset. */
  rowIndex: number;
  rowId: string;
}

export interface ColumnDef<TRow, TValue = unknown> {
  /** Stable identity. Used as the React key and as `SortState.columnId`. */
  id: string;
  header: ReactNode;
  /** Pulls the sortable/renderable value out of a row. */
  accessor: (row: TRow) => TValue;
  /** Custom renderer. Defaults to `String(value)`. */
  cell?: (ctx: CellContext<TRow, TValue>) => ReactNode;
  sortable?: boolean;
  /** Overrides the built-in comparator. Ignored unless `sortable`. */
  sortFn?: (a: TValue, b: TValue) => number;
  /** Fixed width in px. Required for pinned columns (see README). */
  width?: number;
  minWidth?: number;
  align?: 'left' | 'center' | 'right';
  pinned?: 'left';
  /**
   * Accessible label for the sort button when `header` is not plain text.
   * Falls back to `id`.
   */
  headerLabel?: string;
}

// eslint-disable-next-line @typescript-eslint/no-explicit-any
export type AnyColumnDef<TRow> = ColumnDef<TRow, any>;

/** A column after the table has resolved layout concerns. */
export interface PreparedColumn<TRow> {
  column: AnyColumnDef<TRow>;
  /** `left` offset in px for pinned columns, accumulated from prior pins. */
  pinnedOffset: number | null;
  /** True for the right-most pinned column — the one that casts the shadow. */
  isLastPinned: boolean;
  sortDirection: SortDirection | null;
}

export interface PreparedRow<TRow> {
  id: string;
  row: TRow;
  /** Index within the currently rendered page. */
  index: number;
}

/**
 * Infers `TValue` from the accessor, so `cell({ value })` is typed rather than
 * widened to `unknown`:
 *
 *   col.accessor((r) => r.booked, { cell: ({ value }) => value + 1 })
 */
export function createColumnHelper<TRow>() {
  return {
    accessor<TValue>(
      accessor: (row: TRow) => TValue,
      def: Omit<ColumnDef<TRow, TValue>, 'accessor'>,
    ): ColumnDef<TRow, TValue> {
      return { ...def, accessor };
    },
    /** A column with no underlying value — actions, icons, row numbers. */
    display(
      def: Omit<ColumnDef<TRow, null>, 'accessor' | 'sortable' | 'sortFn'>,
    ): ColumnDef<TRow, null> {
      return { ...def, accessor: () => null, sortable: false };
    },
  };
}
