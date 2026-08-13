'use client';

import { useEffect, type ReactNode } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import Lenis from 'lenis';

gsap.registerPlugin(ScrollTrigger);

/**
 * Smooth scrolling, and the bridge between Lenis and GSAP's ScrollTrigger.
 *
 * Lenis animates the scroll position itself, so ScrollTrigger has to be told
 * when that happens and both have to share a single animation frame. Getting
 * this wrong is the usual cause of scroll-linked animation lagging behind the
 * content it's attached to.
 */
export function SmoothScroll({ children }: { children: ReactNode }) {
  useEffect(() => {
    // Hijacked scrolling is the opposite of what someone asking for reduced
    // motion wants. Native scrolling is the accessible fallback.
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) return;

    const lenis = new Lenis({ duration: 1.1 });

    // Lenis emits `scroll` on every frame it moves the page. Without this,
    // ScrollTrigger works off native scroll events, which arrive on a
    // different cadence — so scrubbed animations trail the content.
    lenis.on('scroll', ScrollTrigger.update);

    // One rAF loop instead of two. Two loops can run in either order, so
    // ScrollTrigger might read a position Lenis hasn't updated yet.
    // GSAP's ticker reports seconds; Lenis expects milliseconds.
    const raf = (time: number) => lenis.raf(time * 1000);
    gsap.ticker.add(raf);

    // GSAP normally adjusts its clock after a long frame so animations don't
    // jump. Here that clock drives Lenis while ScrollTrigger reads the real
    // scroll position — an adjustment would desync them.
    gsap.ticker.lagSmoothing(0);

    // Trigger positions are measured once. Late-loading fonts change layout
    // height, so re-measure when they land.
    document.fonts?.ready.then(() => ScrollTrigger.refresh());

    return () => {
      gsap.ticker.remove(raf);
      lenis.destroy();
    };
  }, []);

  return <>{children}</>;
}
