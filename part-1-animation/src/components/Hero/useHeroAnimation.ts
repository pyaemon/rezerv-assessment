'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import styles from './Hero.module.scss';

gsap.registerPlugin(ScrollTrigger);

/**
 * Every piece of hero motion, in one place.
 *
 * Four things happen, on three different DOM layers, so that none of them
 * fight over the `transform` property:
 *
 *   .floater  entrance (scale + fade) and scroll parallax
 *   .bob      idle drift — a slow looping bob and tilt
 *   the fruit mouse-follow
 *
 * `gsap.matchMedia` builds a different set of animations per breakpoint and
 * reverts the previous set automatically when the query stops matching. That
 * is what makes resizing behave: no stale tweens, no leftover inline styles.
 */
export function useHeroAnimation(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = <T extends HTMLElement>(selector: string) =>
      Array.from(root.querySelectorAll<T>(selector));

    // CSS Modules hash class names at build time, so the selector has to come
    // from the imported `styles` object rather than a hard-coded string.
    const floaters = q(`.${styles.floater}`);
    const bobs = q(`.${styles.bob}`);
    const fruits = bobs
      .map((bob) => bob.firstElementChild)
      .filter((el): el is HTMLElement => el instanceof HTMLElement);

    const lines = q(`.${styles.line} > span`);
    const copy = q(
      `.${styles.eyebrow}, .${styles.lede}, .${styles.actions}, .${styles.scrollCue}`,
    );

    // Centring is GSAP's job, not CSS's — see the note on `.floater`.
    // xPercent/yPercent are relative to each element's own size, and GSAP
    // recomputes them on refresh, so they survive the fruit changing size
    // across breakpoints.
    gsap.set(floaters, { xPercent: -50, yPercent: -50 });

    const mm = gsap.matchMedia(root);

    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop, reduce } = context.conditions as {
          isDesktop: boolean;
          reduce: boolean;
        };

        /* ---------------------------------------------------------- *
         * Reduced motion — show the finished state, animate nothing.
         * ---------------------------------------------------------- */
        if (reduce) {
          gsap.set([...floaters, ...lines, ...copy], {
            opacity: 1,
            clearProps: 'transform',
          });
          return;
        }

        /* ---------------------------------------------------------- *
         * 1. Entrance
         *
         * Runs once on mount. When the preloader exists, gate this on
         * its completion instead.
         * ---------------------------------------------------------- */
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          // The headline masks live in `.line`, which has overflow: hidden.
          // Starting the inner span at yPercent 100 hides it behind that edge.
          .from(lines, {
            yPercent: 110,
            duration: 1,
            stagger: 0.09,
          })
          .from(
            copy,
            { y: 18, opacity: 0, duration: 0.7, stagger: 0.08 },
            '-=0.6',
          )
          .from(
            floaters,
            {
              // `scale` here composes with the responsive `scale` set in CSS
              // (they multiply), so the fruit lands at its correct size.
              scale: 0.55,
              opacity: 0,
              duration: 0.9,
              ease: 'back.out(1.5)',
              stagger: { each: 0.07, from: 'random' },
            },
            '-=0.9',
          );

        /* ---------------------------------------------------------- *
         * 2. Idle drift
         *
         * Randomised per fruit so they never move in lockstep, which is
         * what stops it reading as a mechanical loop.
         * ---------------------------------------------------------- */
        bobs.forEach((bob) => {
          gsap.to(bob, {
            y: gsap.utils.random(-14, -6),
            rotation: gsap.utils.random(-7, 7),
            duration: gsap.utils.random(2.6, 4.4),
            ease: 'sine.inOut',
            yoyo: true,
            repeat: -1,
            delay: gsap.utils.random(0, 1.5),
          });
        });

        /* ---------------------------------------------------------- *
         * 3. Scroll parallax
         *
         * Each fruit moves at its own rate, so they separate in depth as
         * the page scrolls. Function-based values are re-evaluated on
         * ScrollTrigger.refresh(), which is what keeps resize correct.
         * ---------------------------------------------------------- */
        floaters.forEach((floater) => {
          const speed = Number(floater.dataset.speed ?? 0.5);

          gsap.to(floater, {
            y: () => -window.innerHeight * speed * 0.45,
            ease: 'none',
            scrollTrigger: {
              trigger: root,
              start: 'top top',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        });

        /* ---------------------------------------------------------- *
         * 4. Mouse follow — desktop only (no pointer to follow on touch)
         * ---------------------------------------------------------- */
        if (!isDesktop) return;

        // quickTo reuses one tween per property instead of allocating a new
        // one on every mousemove.
        const movers = fruits.map((fruit, index) => {
          const speed = Number(floaters[index]?.dataset.speed ?? 0.5);
          return {
            depth: speed * 26,
            x: gsap.quickTo(fruit, 'x', { duration: 0.8, ease: 'power3' }),
            y: gsap.quickTo(fruit, 'y', { duration: 0.8, ease: 'power3' }),
          };
        });

        // Measured once, not per event — reading layout inside a mousemove
        // handler forces a reflow on every pointer move.
        let bounds = root.getBoundingClientRect();
        const remeasure = () => {
          bounds = root.getBoundingClientRect();
        };

        const onMove = (event: PointerEvent) => {
          // -1 .. 1 relative to the centre of the hero.
          const nx = (event.clientX - bounds.left) / bounds.width - 0.5;
          const ny = (event.clientY - bounds.top) / bounds.height - 0.5;

          for (const mover of movers) {
            mover.x(nx * mover.depth);
            mover.y(ny * mover.depth);
          }
        };

        root.addEventListener('pointermove', onMove);
        window.addEventListener('resize', remeasure);
        ScrollTrigger.addEventListener('refresh', remeasure);

        return () => {
          root.removeEventListener('pointermove', onMove);
          window.removeEventListener('resize', remeasure);
          ScrollTrigger.removeEventListener('refresh', remeasure);
        };
      },
    );

    return () => mm.revert();
  }, [rootRef]);
}
