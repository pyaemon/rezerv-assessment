'use client';

import { memo, type ReactNode } from 'react';

import { cx } from '@/lib/cx';
import styles from './DataTable.module.scss';
import { AlertIcon, ChevronRightIcon } from './icons';
import type { PreparedColumn, PreparedRow } from './types';
import type { ChildState, ExpansionConfig } from './useRowExpansion';

/** Width of the table-owned expander column. */
export const EXPANDER_WIDTH = 44;

function defaultRenderValue(value: unknown): ReactNode {
  if (value === null || value === undefined || value === '') {
    return <span className={styles.muted}>—</span>;
  }
  if (typeof value === 'boolean') return value ? 'Yes' : 'No';
  if (value instanceof Date) return value.toLocaleDateString();
  return String(value);
}

export interface DataTableRowProps<TRow, TChild> {
  prepared: PreparedRow<TRow>;
  columns: readonly PreparedColumn<TRow>[];
  colSpan: number;
  expansion: ExpansionConfig<TRow, TChild> | undefined;
  expanderIsLastPinned: boolean;
  expandable: boolean;
  expanded: boolean;
  /** Panel contents mount only after the first expand. */
  mounted: boolean;
  childState: ChildState<TChild> | undefined;
  onToggle: ((rowId: string, row: TRow) => void) | undefined;
  onRetry: ((rowId: string, row: TRow) => void) | undefined;
  onRowClick: ((row: TRow) => void) | undefined;
}

function DataTableRowInner<TRow, TChild>({
  prepared,
  columns,
  colSpan,
  expansion,
  expanderIsLastPinned,
  expandable,
  expanded,
  mounted,
  childState,
  onToggle,
  onRetry,
  onRowClick,
}: DataTableRowProps<TRow, TChild>) {
  const { id, row, index } = prepared;
  const panelId = `${id}__panel`;
  const pinnedBase = expansion ? EXPANDER_WIDTH : 0;

  const renderPanel = (): ReactNode => {
    if (!expansion) return null;
    const state: ChildState<TChild> = childState ?? { status: 'idle' };

    if (state.status === 'idle' || state.status === 'loading') {
      return (
        expansion.renderLoading?.() ?? (
          <div className={styles.panelState} role="status">
            <span className={styles.spinner} aria-hidden />
            Loading…
          </div>
        )
      );
    }

    if (state.status === 'error') {
      const retry = () => onRetry?.(id, row);
      return (
        expansion.renderError?.({ error: state.error, retry }) ?? (
          <div className={cx(styles.panelState, styles.panelError)} role="alert">
            <AlertIcon />
            <span>{state.error.message || 'Something went wrong.'}</span>
            <button type="button" className={styles.retryButton} onClick={retry}>
              Try again
            </button>
          </div>
        )
      );
    }

    if (state.children.length === 0) {
      return (
        expansion.renderEmpty?.() ?? (
          <div className={styles.panelState}>Nothing to show here yet.</div>
        )
      );
    }

    return expansion.renderChildren({ children: state.children, row });
  };

  return (
    <>
      <tr
        className={cx(styles.row, onRowClick && styles.clickable)}
        data-expanded={expanded}
        onClick={onRowClick ? () => onRowClick(row) : undefined}
      >
        {expansion && (
          <td
            className={cx(
              styles.cell,
              styles.pinned,
              styles.expanderCell,
              expanderIsLastPinned && styles.lastPinned,
            )}
            style={{ left: 0 }}
          >
            {expandable && (
              <button
                type="button"
                className={styles.expander}
                data-open={expanded}
                aria-expanded={expanded}
                aria-controls={panelId}
                aria-label={expanded ? 'Collapse row' : 'Expand row'}
                onClick={(event) => {
                  // Keeps an expand from also firing `onRowClick`.
                  event.stopPropagation();
                  onToggle?.(id, row);
                }}
              >
                <ChevronRightIcon />
              </button>
            )}
          </td>
        )}

        {columns.map((preparedColumn) => {
          const { column, pinnedOffset, isLastPinned } = preparedColumn;
          const value = column.accessor(row);
          const content = column.cell
            ? column.cell({ value, row, rowIndex: index, rowId: id })
            : defaultRenderValue(value);

          return (
            <td
              key={column.id}
              className={cx(
                styles.cell,
                pinnedOffset !== null && styles.pinned,
                pinnedOffset !== null && isLastPinned && styles.lastPinned,
              )}
              style={
                pinnedOffset !== null
                  ? { left: pinnedBase + pinnedOffset }
                  : undefined
              }
              data-align={column.align ?? 'left'}
            >
              {content}
            </td>
          );
        })}
      </tr>

      {expansion && expandable && (
        <tr className={styles.panelRow}>
          <td className={styles.panelCell} colSpan={colSpan}>
            {/*
              The 0fr -> 1fr grid transition animates to the panel's natural
              height without measuring it in JS, so expanding never reads
              layout and never triggers a forced reflow.
            */}
            <div className={styles.collapsible} data-open={expanded}>
              <div
                className={styles.collapsibleInner}
                id={panelId}
                inert={!expanded}
              >
                {mounted && <div className={styles.panelBody}>{renderPanel()}</div>}
              </div>
            </div>
          </td>
        </tr>
      )}
    </>
  );
}

/**
 * `memo` keeps untouched rows out of the render pass when a single row is
 * expanded or a sibling's children arrive. The cast preserves the generic
 * signature, which `memo` would otherwise erase.
 */
export const DataTableRow = memo(DataTableRowInner) as typeof DataTableRowInner;
