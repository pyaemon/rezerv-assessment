'use client';

import { useCallback, useRef, useState } from 'react';

type Updater<T> = T | ((previous: T) => T);

/**
 * One state hook that works in both controlled and uncontrolled mode.
 *
 * Passing `undefined` for `controlled` keeps the state internal; passing any
 * other value (including `null`) hands ownership to the parent. This is what
 * lets a single `<DataTable>` drive both a client-side table and a
 * server-driven one without a second code path.
 *
 * The setter is referentially stable, so it can be depended on freely.
 */
export function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (next: Updater<T>) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);

  const isControlled = controlled !== undefined;
  const value = isControlled ? (controlled as T) : internal;

  // Refs keep `setValue` stable without going stale between renders.
  const latest = useRef({ value, isControlled, onChange });
  latest.current = { value, isControlled, onChange };

  const setValue = useCallback((next: Updater<T>) => {
    const current = latest.current.value;
    const resolved =
      typeof next === 'function' ? (next as (previous: T) => T)(current) : next;

    if (Object.is(resolved, current)) return;

    if (!latest.current.isControlled) setInternal(resolved);
    latest.current.onChange?.(resolved);
  }, []);

  return [value, setValue];
}
