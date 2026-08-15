'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import styles from './Hero.module.scss';

gsap.registerPlugin(ScrollTrigger);

/**
 * Hero motion. Three DOM layers so nothing fights over `transform`:
 * `.floater` = entrance + parallax, `.bob` = idle drift, fruit = mouse follow.
 *
 * `matchMedia` rebuilds per breakpoint and reverts the old set on the way out.
 */
export function useHeroAnimation(
  rootRef: RefObject<HTMLElement | null>,
  /** Flipped by the preloader as it starts to leave. */
  introReady: boolean,
) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = <T extends HTMLElement>(selector: string) =>
      Array.from(root.querySelectorAll<T>(selector));

    // CSS Modules hash class names, so selectors come from `styles`.
    const floaters = q(`.${styles.floater}`);
    const bobs = q(`.${styles.bob}`);
    const fruits = bobs
      .map((bob) => bob.firstElementChild)
      .filter((el): el is HTMLElement => el instanceof HTMLElement);

    const lines = q(`.${styles.line} > span`);
    const copy = q(
      `.${styles.eyebrow}, .${styles.lede}, .${styles.actions}, .${styles.scrollCue}`,
    );

    // GSAP owns centring, not CSS. xPercent is size-relative and recomputed on
    // refresh, so it survives the fruit resizing across breakpoints.
    gsap.set(floaters, { xPercent: -50, yPercent: -50 });

    // Hide immediately, while the loader still covers the page.
    gsap.set(lines, { yPercent: 110 });
    gsap.set([...copy, ...floaters], { opacity: 0 });

    if (!introReady) return;

    const mm = gsap.matchMedia(root);

    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        isMobile: '(max-width: 1023.98px)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop, reduce } = context.conditions as {
          isDesktop: boolean;
          reduce: boolean;
        };

        // Reduced motion: jump to the finished state.
        if (reduce) {
          gsap.set([...lines, ...copy], { opacity: 1, yPercent: 0, y: 0 });
          gsap.set(floaters, { opacity: 1, scale: 1 });
          return;
        }

        // 1. Entrance. `fromTo` not `from` — the hidden state is already
        // applied above, so `from` would animate nowhere.
        gsap
          .timeline({ defaults: { ease: 'power3.out' } })
          // `.line` has overflow:hidden; 110% starts the text behind its edge.
          .fromTo(
            lines,
            { yPercent: 110 },
            { yPercent: 0, duration: 1, stagger: 0.09 },
          )
          .fromTo(
            copy,
            { y: 18, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.7, stagger: 0.08 },
            '-=0.6',
          )
          .fromTo(
            floaters,
            { scale: 0.55, opacity: 0 },
            {
              scale: 1,
              opacity: 1,
              duration: 0.9,
              ease: 'back.out(1.5)',
              stagger: { each: 0.07, from: 'random' },
            },
            '-=0.9',
          );

        // 2. Idle drift. Randomised per fruit so they never sync up.
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

        // 3. Parallax. Function values re-evaluate on refresh — that's what
        // makes resize correct.
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

        // 4. Mouse follow. Desktop only — nothing to follow on touch.
        if (!isDesktop) return;

        // quickTo reuses one tween per property instead of one per mousemove.
        const movers = fruits.map((fruit, index) => {
          const speed = Number(floaters[index]?.dataset.speed ?? 0.5);
          return {
            depth: speed * 26,
            x: gsap.quickTo(fruit, 'x', { duration: 0.8, ease: 'power3' }),
            y: gsap.quickTo(fruit, 'y', { duration: 0.8, ease: 'power3' }),
          };
        });

        // Measured once: getBoundingClientRect in a mousemove forces reflow.
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
  }, [rootRef, introReady]);
}
