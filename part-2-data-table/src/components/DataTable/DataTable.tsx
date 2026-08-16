'use client';

import { useCallback, useMemo, useRef, type ReactNode } from 'react';

import { cx } from '@/lib/cx';
import styles from './DataTable.module.scss';
import { DataTableRow, EXPANDER_WIDTH } from './DataTableRow';
import { Pagination } from './Pagination';
import { AlertIcon, InboxIcon, SortIcon } from './icons';
import { useDataTable, type UseDataTableOptions } from './useDataTable';
import { useHorizontalScroll } from './useHorizontalScroll';
import { useRowExpansion, type ExpansionConfig } from './useRowExpansion';

export interface DataTableProps<TRow, TChild = unknown>
  extends UseDataTableOptions<TRow> {
  /** Accessible name for the table and its scroll region. */
  ariaLabel: string;
  /** Enables the expander column. Omit for a flat table. */
  expansion?: ExpansionConfig<TRow, TChild>;

  /* States */
  isLoading?: boolean;
  /** A background refetch — the table dims instead of dropping to skeletons. */
  isFetching?: boolean;
  error?: Error | null;
  onRetry?: () => void;
  emptyState?: { title: string; description?: string };

  /* Presentation */
  skeletonRowCount?: number;
  pageSizeOptions?: readonly number[];
  showPagination?: boolean;
  onRowClick?: (row: TRow) => void;
  className?: string;
  footnote?: ReactNode;
}

const SKELETON_WIDTHS = ['72%', '48%', '61%', '40%', '55%', '66%'] as const;

/** Fallback track size for columns that declare neither width nor minWidth. */
const DEFAULT_COLUMN_WIDTH = 160;

export function DataTable<TRow, TChild = unknown>({
  ariaLabel,
  expansion,
  isLoading = false,
  isFetching = false,
  error = null,
  onRetry,
  emptyState,
  skeletonRowCount = 6,
  pageSizeOptions = [10, 25, 50],
  showPagination = true,
  onRowClick,
  className,
  footnote,
  ...tableOptions
}: DataTableProps<TRow, TChild>) {
  const table = useDataTable(tableOptions);

  // Hooks can't be called conditionally, so a no-op config stands in when the
  // consumer hasn't asked for expandable rows.
  const noopExpansion = useRef<ExpansionConfig<TRow, TChild>>({
    renderChildren: () => null,
  });
  const rowExpansion = useRowExpansion<TRow, TChild>(
    expansion ?? noopExpansion.current,
  );

  const scrollerRef = useRef<HTMLDivElement>(null);
  const { atStart, atEnd } = useHorizontalScroll(scrollerRef);

  const colSpan = table.columns.length + (expansion ? 1 : 0);
  const hasPinnedColumn = table.columns.some((c) => c.pinnedOffset !== null);
  const expanderIsLastPinned = Boolean(expansion) && !hasPinnedColumn;

  const isExpandable = expansion?.isExpandable;
  const handleToggle = useCallback(
    (rowId: string, row: TRow) => rowExpansion.toggle(rowId, row),
    [rowExpansion],
  );
  const handleRetry = useCallback(
    (rowId: string, row: TRow) => rowExpansion.retry(rowId, row),
    [rowExpansion],
  );

  const columnWidths = useMemo(
    () => table.columns.map((c) => c.column.width),
    [table.columns],
  );

  const minTableWidth = useMemo(
    () =>
      (expansion ? EXPANDER_WIDTH : 0) +
      table.columns.reduce(
        (total, { column }) =>
          total + (column.width ?? column.minWidth ?? DEFAULT_COLUMN_WIDTH),
        0,
      ),
    [table.columns, expansion],
  );

  const showSkeletons = isLoading && !error;
  const showEmpty = !isLoading && !error && table.rows.length === 0;

  const statusMessage = error
    ? 'Failed to load data.'
    : isLoading
    ? 'Loading data.'
    : table.rowCount === 0
    ? 'No results.'
    : `Showing rows ${table.range.from} to ${table.range.to} of ${table.rowCount}.`;

  return (
    <div className={cx(styles.root, className)}>
      <div
        ref={scrollerRef}
        className={styles.scroller}
        role="region"
        aria-label={`${ariaLabel}, scrollable`}
        tabIndex={0}
      >
        <table
          className={styles.table}
          style={{ minWidth: minTableWidth }}
          data-scrolled={!atStart}
          data-fetching={isFetching}
          aria-label={ariaLabel}
          aria-busy={isLoading || isFetching}
        >
          <colgroup>
            {expansion && <col style={{ width: EXPANDER_WIDTH }} />}
            {columnWidths.map((width, index) => (
              <col
                // eslint-disable-next-line react/no-array-index-key
                key={table.columns[index]?.column.id ?? index}
                style={width ? { width } : undefined}
              />
            ))}
          </colgroup>

          <thead className={styles.thead}>
            <tr>
              {expansion && (
                <th
                  scope="col"
                  className={cx(
                    styles.th,
                    styles.pinned,
                    styles.expanderCell,
                    expanderIsLastPinned && styles.lastPinned,
                  )}
                  style={{ left: 0 }}
                >
                  <span className={styles.srOnly}>Expand row</span>
                </th>
              )}

              {table.columns.map(
                ({ column, pinnedOffset, isLastPinned, sortDirection }) => {
                  const sortable = column.sortable === true;
                  const label =
                    column.headerLabel ??
                    (typeof column.header === 'string'
                      ? column.header
                      : column.id);

                  return (
                    <th
                      key={column.id}
                      scope="col"
                      className={cx(
                        styles.th,
                        pinnedOffset !== null && styles.pinned,
                        pinnedOffset !== null &&
                          isLastPinned &&
                          styles.lastPinned,
                      )}
                      style={
                        pinnedOffset !== null
                          ? {
                              left:
                                (expansion ? EXPANDER_WIDTH : 0) + pinnedOffset,
                            }
                          : undefined
                      }
                      data-align={column.align ?? 'left'}
                      aria-sort={
                        sortDirection === 'asc'
                          ? 'ascending'
                          : sortDirection === 'desc'
                          ? 'descending'
                          : sortable
                          ? 'none'
                          : undefined
                      }
                    >
                      {sortable ? (
                        <button
                          type="button"
                          className={styles.sortButton}
                          onClick={() => table.toggleSort(column.id)}
                          title={`Sort by ${label}`}
                        >
                          <span>{column.header}</span>
                          <SortIcon
                            className={styles.sortIcon}
                            direction={sortDirection}
                          />
                        </button>
                      ) : (
                        <span className={styles.headerText}>
                          {column.header}
                        </span>
                      )}
                    </th>
                  );
                },
              )}
            </tr>
          </thead>

          <tbody>
            {error && (
              <tr>
                <td colSpan={colSpan} className={styles.stateCell}>
                  <div
                    className={cx(styles.state, styles.stateError)}
                    role="alert"
                  >
                    <AlertIcon className={styles.stateIcon} />
                    <div>
                      <p className={styles.stateTitle}>
                        Couldn&apos;t load data
                      </p>
                      <p className={styles.stateBody}>
                        {error.message || 'An unexpected error occurred.'}
                      </p>
                    </div>
                    {onRetry && (
                      <button
                        type="button"
                        className={styles.retryButton}
                        onClick={onRetry}
                      >
                        Try again
                      </button>
                    )}
                  </div>
                </td>
              </tr>
            )}

            {showSkeletons &&
              Array.from({ length: skeletonRowCount }, (_, rowIndex) => (
                <tr key={`skeleton-${rowIndex}`} className={styles.row}>
                  {expansion && (
                    <td
                      className={cx(
                        styles.cell,
                        styles.pinned,
                        styles.expanderCell,
                      )}
                      style={{ left: 0 }}
                    >
                      <span className={styles.skeletonCircle} />
                    </td>
                  )}
                  {table.columns.map(
                    ({ column, pinnedOffset }, columnIndex) => (
                      <td
                        key={column.id}
                        className={cx(
                          styles.cell,
                          pinnedOffset !== null && styles.pinned,
                        )}
                        style={
                          pinnedOffset !== null
                            ? {
                                left:
                                  (expansion ? EXPANDER_WIDTH : 0) +
                                  pinnedOffset,
                              }
                            : undefined
                        }
                      >
                        <span
                          className={styles.skeleton}
                          style={{
                            width:
                              SKELETON_WIDTHS[
                                (rowIndex + columnIndex) %
                                  SKELETON_WIDTHS.length
                              ],
                          }}
                        />
                      </td>
                    ),
                  )}
                </tr>
              ))}

            {showEmpty && (
              <tr>
                <td colSpan={colSpan} className={styles.stateCell}>
                  <div className={styles.state}>
                    <InboxIcon className={styles.stateIcon} />
                    <div>
                      <p className={styles.stateTitle}>
                        {emptyState?.title ?? 'Nothing here yet'}
                      </p>
                      {emptyState?.description && (
                        <p className={styles.stateBody}>
                          {emptyState.description}
                        </p>
                      )}
                    </div>
                  </div>
                </td>
              </tr>
            )}

            {!isLoading &&
              !error &&
              table.rows.map((prepared) => (
                <DataTableRow<TRow, TChild>
                  key={prepared.id}
                  prepared={prepared}
                  columns={table.columns}
                  colSpan={colSpan}
                  expansion={expansion}
                  expanderIsLastPinned={expanderIsLastPinned}
                  expandable={isExpandable ? isExpandable(prepared.row) : true}
                  expanded={rowExpansion.isExpanded(prepared.id)}
                  mounted={rowExpansion.hasOpened(prepared.id)}
                  childState={
                    expansion
                      ? rowExpansion.getState(prepared.id, prepared.row)
                      : undefined
                  }
                  onToggle={handleToggle}
                  onRetry={handleRetry}
                  onRowClick={onRowClick}
                />
              ))}
          </tbody>
        </table>
      </div>

      <div className={styles.edgeFade} data-visible={!atEnd} aria-hidden />

      {footnote && <div className={styles.footnote}>{footnote}</div>}

      {showPagination && (
        <Pagination
          page={table.page}
          pageCount={table.pageCount}
          pageSize={table.pageSize}
          rowCount={table.rowCount}
          range={table.range}
          pageSizeOptions={pageSizeOptions}
          onPageChange={table.setPage}
          onPageSizeChange={table.setPageSize}
          disabled={isLoading || Boolean(error)}
        />
      )}

      <p className={styles.srOnly} role="status" aria-live="polite">
        {statusMessage}
      </p>
    </div>
  );
}
