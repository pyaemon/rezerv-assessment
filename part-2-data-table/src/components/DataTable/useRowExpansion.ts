'use client';

import { useCallback, useEffect, useMemo, useRef, useState } from 'react';
import type { ReactNode } from 'react';

import { useControllableState } from './useControllableState';

/* ------------------------------------------------------------------ *
 * Types
 * ------------------------------------------------------------------ */

export type ChildState<TChild> =
  | { status: 'idle' }
  | { status: 'loading' }
  | { status: 'success'; children: readonly TChild[] }
  | { status: 'error'; error: Error };

export interface ExpansionConfig<TRow, TChild> {
  /** Renders the resolved children inside the expanded panel. */
  renderChildren: (context: {
    children: readonly TChild[];
    row: TRow;
  }) => ReactNode;

  /**
   * Inline mode: children already travel with the parent row.
   * Used when `fetchChildren` is not supplied.
   */
  getChildren?: (row: TRow) => readonly TChild[] | undefined;

  /**
   * On-demand mode: children are fetched the first time a row is expanded.
   * Takes precedence over `getChildren` when both are given.
   */
  fetchChildren?: (
    row: TRow,
    signal: AbortSignal,
  ) => Promise<readonly TChild[]>;

  /** Rows that cannot be expanded render no chevron. Defaults to all rows. */
  isExpandable?: (row: TRow) => boolean;

  /* Controlled / uncontrolled expansion. */
  expandedRowIds?: readonly string[];
  defaultExpandedRowIds?: readonly string[];
  onExpandedChange?: (expandedRowIds: string[]) => void;
  /** `false` collapses siblings — accordion behaviour. Defaults to `true`. */
  allowMultiple?: boolean;

  /* Optional overrides for the on-demand panel states. */
  renderLoading?: () => ReactNode;
  renderError?: (context: { error: Error; retry: () => void }) => ReactNode;
  renderEmpty?: () => ReactNode;
}

export interface RowExpansion<TRow, TChild> {
  mode: 'inline' | 'on-demand';
  isExpanded: (rowId: string) => boolean;
  /** True once a row has been expanded — used to mount panels lazily. */
  hasOpened: (rowId: string) => boolean;
  toggle: (rowId: string, row: TRow) => void;
  retry: (rowId: string, row: TRow) => void;
  getState: (rowId: string, row: TRow) => ChildState<TChild>;
}

const toError = (value: unknown): Error =>
  value instanceof Error ? value : new Error(String(value));

/* ------------------------------------------------------------------ *
 * Hook
 * ------------------------------------------------------------------ */

/**
 * Owns expanded-row state for both supported modes.
 *
 * Fetches are kicked off from the toggle handler rather than an effect: the
 * fetch is a consequence of a user action, not of rendering, and doing it here
 * means no double-fetch under StrictMode and no effect dependency juggling.
 * Results are cached per row id, so collapsing and re-expanding is free, and
 * an in-flight request is aborted if the user collapses the row first.
 */
export function useRowExpansion<TRow, TChild>(
  config: ExpansionConfig<TRow, TChild>,
): RowExpansion<TRow, TChild> {
  const {
    getChildren,
    fetchChildren,
    expandedRowIds,
    defaultExpandedRowIds,
    onExpandedChange,
    allowMultiple = true,
  } = config;

  const mode: 'inline' | 'on-demand' = fetchChildren ? 'on-demand' : 'inline';

  const [expanded, setExpanded] = useControllableState<readonly string[]>(
    expandedRowIds,
    defaultExpandedRowIds ?? [],
    onExpandedChange as ((value: readonly string[]) => void) | undefined,
  );

  const expandedSet = useMemo(() => new Set(expanded), [expanded]);
  const expandedSetRef = useRef(expandedSet);
  expandedSetRef.current = expandedSet;

  const [openedOnce, setOpenedOnce] = useState<ReadonlySet<string>>(
    () => new Set(),
  );
  const [states, setStates] = useState<ReadonlyMap<string, ChildState<TChild>>>(
    () => new Map(),
  );
  const statesRef = useRef(states);
  statesRef.current = states;

  const controllersRef = useRef(new Map<string, AbortController>());
  const fetchRef = useRef(fetchChildren);
  fetchRef.current = fetchChildren;

  // Abort everything still in flight when the table unmounts.
  useEffect(() => {
    const controllers = controllersRef.current;
    return () => {
      for (const controller of controllers.values()) controller.abort();
      controllers.clear();
    };
  }, []);

  const load = useCallback(async (rowId: string, row: TRow, force = false) => {
    const fetcher = fetchRef.current;
    if (!fetcher) return;

    const existing = statesRef.current.get(rowId);
    // Cache hit, or a request is already running for this row. A retry says
    // "ignore the cache" and falls through.
    if (
      !force &&
      (existing?.status === 'success' || existing?.status === 'loading')
    ) {
      return;
    }

    controllersRef.current.get(rowId)?.abort();
    const controller = new AbortController();
    controllersRef.current.set(rowId, controller);

    setStates((previous) =>
      new Map(previous).set(rowId, { status: 'loading' }),
    );

    try {
      const children = await fetcher(row, controller.signal);
      if (controller.signal.aborted) return;
      setStates((previous) =>
        new Map(previous).set(rowId, { status: 'success', children }),
      );
    } catch (error) {
      if (controller.signal.aborted) return;
      setStates((previous) =>
        new Map(previous).set(rowId, { status: 'error', error: toError(error) }),
      );
    } finally {
      if (controllersRef.current.get(rowId) === controller) {
        controllersRef.current.delete(rowId);
      }
    }
  }, []);

  const toggle = useCallback(
    (rowId: string, row: TRow) => {
      const isOpen = expandedSetRef.current.has(rowId);

      if (isOpen) {
        setExpanded((previous) => previous.filter((id) => id !== rowId));

        // Collapsing mid-flight: drop the request and the loading state so a
        // later re-expand starts clean instead of resuming a stale spinner.
        const controller = controllersRef.current.get(rowId);
        if (controller) {
          controller.abort();
          controllersRef.current.delete(rowId);
          setStates((previous) => {
            if (previous.get(rowId)?.status !== 'loading') return previous;
            const next = new Map(previous);
            next.delete(rowId);
            return next;
          });
        }
        return;
      }

      setExpanded((previous) =>
        allowMultiple ? [...previous, rowId] : [rowId],
      );
      setOpenedOnce((previous) => {
        if (previous.has(rowId)) return previous;
        return new Set(previous).add(rowId);
      });
      void load(rowId, row);
    },
    [allowMultiple, load, setExpanded],
  );

  const retry = useCallback(
    (rowId: string, row: TRow) => {
      void load(rowId, row, true);
    },
    [load],
  );

  const getChildrenRef = useRef(getChildren);
  getChildrenRef.current = getChildren;

  const getState = useCallback(
    (rowId: string, row: TRow): ChildState<TChild> => {
      if (mode === 'inline') {
        return {
          status: 'success',
          children: getChildrenRef.current?.(row) ?? [],
        };
      }
      return states.get(rowId) ?? { status: 'idle' };
    },
    [mode, states],
  );

  const isExpanded = useCallback(
    (rowId: string) => expandedSet.has(rowId),
    [expandedSet],
  );
  const hasOpened = useCallback(
    (rowId: string) => openedOnce.has(rowId),
    [openedOnce],
  );

  return { mode, isExpanded, hasOpened, toggle, retry, getState };
}
