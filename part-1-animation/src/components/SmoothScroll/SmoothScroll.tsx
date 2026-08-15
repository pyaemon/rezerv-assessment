'use client';

import { useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Bridges Lenis and ScrollTrigger. Lenis animates scroll itself, so
 * ScrollTrigger must be told when, and both must share one animation frame —
 * otherwise scroll-linked animation trails the content it's attached to.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    // Reduced motion gets native scrolling, not a hijacked one.
    if (prefersReducedMotion) return;

    const lenis = new Lenis({ duration: 1.1 });

    // Lenis fires `scroll` every frame it moves. Without this, ScrollTrigger
    // reads a stale position and scrubbed animations lag.
    lenis.on('scroll', ScrollTrigger.update);

    // One rAF loop, not two — two can run in either order and desync.
    // GSAP's ticker gives seconds; Lenis wants milliseconds.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);

    // GSAP normally fudges its clock after a lag spike. That clock drives
    // Lenis while ScrollTrigger reads real scroll — an adjustment desyncs them.
    gsap.ticker.lagSmoothing(0);

    // Late fonts change layout height, so re-measure when they land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
