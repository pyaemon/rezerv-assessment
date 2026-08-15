'use client';

import { useEffect, useRef, useState } from 'react';
import gsap from 'gsap';

import styles from './Preloader.module.scss';

const RADIUS = 54;
const CIRCUMFERENCE = 2 * Math.PI * RADIUS;

const MIN_VISIBLE_MS = 1000;

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

    const prefersReducedMotion = window.matchMedia(
      '(prefers-reduced-motion: reduce)',
    ).matches;

    if (prefersReducedMotion) {
      setIsGone(true);
      onCompleteRef.current();
      return;
    }

    document.documentElement.classList.add(styles.locked as string);

    const state = { value: 0 };

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
                  yPercent: -100,
                  duration: 0.9,
                  ease: 'power3.inOut',
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
