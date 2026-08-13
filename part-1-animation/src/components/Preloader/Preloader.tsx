'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

import styles from './Preloader.module.scss';

/** Ring geometry. Circumference drives the dash maths below. */
const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

/**
 * Keeps the loader on screen long enough to be read. Without a floor it
 * flashes for ~80ms on a warm cache, which is worse than not having one.
 */
const MIN_VISIBLE_MS = 1000;

/**
 * SECTION 1 — Loading screen.
 *
 * The ring is an activity ring, echoing the fitness theme: one SVG circle
 * whose `stroke-dashoffset` is driven by progress. Dashoffset is a
 * compositor-friendly property, so filling the ring costs no layout.
 *
 * On progress honesty: this page ships no images — every fruit is drawn in
 * CSS — so there is no byte-weight to measure. Progress is therefore tied to
 * the two signals that do affect first paint (webfont loading and the window
 * `load` event) and eased toward 90% while they resolve, then driven to 100%
 * once they have. That's documented in the README rather than dressed up as
 * asset loading it isn't.
 */
export function Preloader({ onComplete }: { onComplete: () => void }) {
  const [progress, setProgress] = useState(0);
  const [isGone, setIsGone] = useState(false);
  const rootRef = useRef<HTMLDivElement>(null);
  const onCompleteRef = useRef(onComplete);
  onCompleteRef.current = onComplete;

  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const startedAt = performance.now();
    let cancelled = false;

    // Someone who asked for reduced motion doesn't want to sit through a
    // loading animation either — hand straight over to the hero.
    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setIsGone(true);
      onCompleteRef.current();
      return;
    }

    // Stop the page scrolling underneath the overlay.
    document.documentElement.classList.add(styles.locked as string);

    const state = { value: 0 };

    // Creep toward 90% while the real signals resolve. Decelerating easing
    // means it never looks stalled, and never claims to be finished.
    const creep = gsap.to(state, {
      value: 0.9,
      duration: 2.4,
      ease: 'power2.out',
      onUpdate: () => {
        if (!cancelled) setProgress(state.value);
      },
    });

    const fontsReady = document.fonts?.ready ?? Promise.resolve();
    const windowLoaded =
      document.readyState === 'complete'
        ? Promise.resolve()
        : new Promise<void>((resolve) =>
            window.addEventListener('load', () => resolve(), { once: true }),
          );

    void Promise.all([fontsReady, windowLoaded]).then(() => {
      if (cancelled) return;

      const remaining = Math.max(
        0,
        MIN_VISIBLE_MS - (performance.now() - startedAt),
      );

      gsap.delayedCall(remaining / 1000, () => {
        if (cancelled) return;
        creep.kill();

        gsap.to(state, {
          value: 1,
          duration: 0.4,
          ease: 'power2.inOut',
          onUpdate: () => setProgress(state.value),
          onComplete: () => {
            if (cancelled) return;
            document.documentElement.classList.remove(styles.locked as string);

            gsap
              .timeline({
                onComplete: () => {
                  if (!cancelled) setIsGone(true);
                },
              })
              .to(`.${styles.content}`, {
                y: -24,
                opacity: 0,
                duration: 0.4,
                ease: 'power2.in',
              })
              .to(
                root,
                {
                  // Wipe upward. `yPercent` is a transform, so the exit runs
                  // on the compositor rather than re-laying out the page.
                  yPercent: -100,
                  duration: 0.9,
                  ease: 'power3.inOut',
                  // Hand over before the wipe finishes so the hero entrance
                  // overlaps it — sequential handoff feels sluggish.
                  onStart: () => {
                    gsap.delayedCall(0.25, () => onCompleteRef.current());
                  },
                },
                '-=0.1',
              );
          },
        });
      });
    });

    return () => {
      cancelled = true;
      creep.kill();
      document.documentElement.classList.remove(styles.locked as string);
    };
  }, []);

  // Fully unmounted once gone, so it can never trap focus.
  if (isGone) return null;

  const percent = Math.round(progress * 100);

  return (
    <div ref={rootRef} className={styles.preloader}>
      <div className={styles.content}>
        <svg
          className={styles.ring}
          viewBox="0 0 128 128"
          aria-hidden="true"
          focusable="false"
        >
          <circle className={styles.track} cx="64" cy="64" r={RADIUS} />
          <circle
            className={styles.progress}
            cx="64"
            cy="64"
            r={RADIUS}
            strokeDasharray={CIRCUMFERENCE}
            strokeDashoffset={CIRCUMFERENCE * (1 - progress)}
          />
        </svg>

        <p className={styles.percent}>
          <span>{percent}</span>
          <span className={styles.percentSign}>%</span>
        </p>

        <p className={styles.label} role="status">
          Preparing this week&apos;s menu
        </p>
      </div>
    </div>
  );
}
