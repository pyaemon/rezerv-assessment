'use client';

import type { ReactNode } from 'react';

/**
 * Smooth scrolling, and the bridge between Lenis and GSAP's ScrollTrigger.
 *
 * ── WHY THIS FILE MATTERS ──────────────────────────────────────────────
 * Lenis takes over scrolling and moves content in JS. ScrollTrigger listens
 * to native scroll events. If you don't wire them together, ScrollTrigger
 * reads stale positions and every scroll animation lags behind the content.
 * This is the #1 source of jank in submissions like this one.
 *
 * ── WHAT TO DO ─────────────────────────────────────────────────────────
 * Inside a `useEffect` (client only, runs once):
 *
 *   1. Create the Lenis instance.
 *   2. Tell ScrollTrigger to update whenever Lenis scrolls:
 *        lenis.on('scroll', ScrollTrigger.update)
 *   3. Drive Lenis from GSAP's ticker instead of its own rAF loop, so both
 *      run on ONE animation frame rather than two competing ones:
 *        gsap.ticker.add((time) => lenis.raf(time * 1000))
 *        gsap.ticker.lagSmoothing(0)
 *   4. Clean up on unmount: remove the ticker callback, destroy Lenis.
 *
 * ── ALSO CONSIDER ──────────────────────────────────────────────────────
 * • If the user prefers reduced motion, skip Lenis entirely and let the
 *   browser scroll natively. Check:
 *     window.matchMedia('(prefers-reduced-motion: reduce)').matches
 * • Register the plugin once, at module scope, guarded for SSR:
 *     gsap.registerPlugin(ScrollTrigger)
 *
 * Docs: https://github.com/darkroomengineering/lenis#gsap-scrolltrigger
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  // TODO: implement (see notes above)
  return <>{children}</>;
}
