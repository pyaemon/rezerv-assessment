'use client';

import { useEffect, useState, type RefObject } from 'react';

export interface HorizontalScrollState {
  atStart: boolean;
  atEnd: boolean;
}

/**
 * Tracks whether a scroller is at its start / end, so the pinned column casts
 * a shadow only when content slides under it.
 *
 * Passive and rAF-throttled, and the setter bails unless a boundary is
 * crossed — so a full scroll costs two renders, not one per frame.
 */
export function useHorizontalScroll(
  ref: RefObject<HTMLElement | null>,
): HorizontalScrollState {
  const [state, setState] = useState<HorizontalScrollState>({
    atStart: true,
    atEnd: true,
  });

  useEffect(() => {
    const element = ref.current;
    if (!element) return;

    let frame = 0;

    const measure = () => {
      frame = 0;
      const maxScroll = element.scrollWidth - element.clientWidth;
      // 1px tolerance absorbs sub-pixel layout and zoom rounding.
      const atStart = element.scrollLeft <= 1;
      const atEnd = maxScroll <= 1 || element.scrollLeft >= maxScroll - 1;

      setState((previous) =>
        previous.atStart === atStart && previous.atEnd === atEnd
          ? previous
          : { atStart, atEnd },
      );
    };

    const schedule = () => {
      if (frame === 0) frame = requestAnimationFrame(measure);
    };

    measure();
    element.addEventListener('scroll', schedule, { passive: true });

    // Catches both viewport resizes and the table growing/shrinking as rows
    // expand, page size changes, or skeletons swap for real content.
    const observer = new ResizeObserver(schedule);
    observer.observe(element);
    const content = element.firstElementChild;
    if (content) observer.observe(content);

    return () => {
      element.removeEventListener('scroll', schedule);
      observer.disconnect();
      if (frame !== 0) cancelAnimationFrame(frame);
    };
  }, [ref]);

  return state;
}
