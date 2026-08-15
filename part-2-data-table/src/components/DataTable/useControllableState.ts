'use client';

import { useCallback, useRef, useState } from 'react';

type Updater<T> = T | ((previous: T) => T);

/**
 * Works in both controlled and uncontrolled mode: `undefined` keeps state
 * internal, any other value (including `null`) hands ownership to the parent.
 * One `<DataTable>` then drives client- and server-side without a second path.
 */
export function useControllableState<T>(
  controlled: T | undefined,
  defaultValue: T,
  onChange?: (value: T) => void,
): [T, (next: Updater<T>) => void] {
  const [internal, setInternal] = useState<T>(defaultValue);

  const isControlled = controlled !== undefined;
  const value = isControlled ? (controlled as T) : internal;

  // Refs keep `setValue` stable without going stale.
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
