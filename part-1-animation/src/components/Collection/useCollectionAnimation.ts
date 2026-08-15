'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import styles from './Collection.module.scss';

gsap.registerPlugin(ScrollTrigger);

const TILT_DEGREES = 9;

const HOVER_LIFT = 8;

// Collection reveal animations.
// Keep inside matchMedia so they clean up correctly on resize.
export function useCollectionAnimation(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = <T extends HTMLElement>(selector: string) =>
      Array.from(root.querySelectorAll<T>(selector));

    const eyebrow = q(`.${styles.eyebrow}`);
    const titleLines = q(`.${styles.title} .${styles.line} > span`);
    const cards = q(`.${styles.card}`);
    const fruits = q(`.${styles.cardFruit}`);

    const mm = gsap.matchMedia(root);

    mm.add(
      {
        isDesktop: '(min-width: 1024px)',
        // Without a below-1024 branch nothing matches on phones, and GSAP
        // never runs this callback at all.
        isMobile: '(max-width: 1023.98px)',
        reduce: '(prefers-reduced-motion: reduce)',
      },
      (context) => {
        const { isDesktop, reduce } = context.conditions as {
          isDesktop: boolean;
          isMobile: boolean;
          reduce: boolean;
        };

        if (reduce) {
          gsap.set([...eyebrow, ...cards, ...fruits], {
            opacity: 1,
            y: 0,
            scale: 1,
            rotation: 0,
          });
          gsap.set(titleLines, { yPercent: 0 });
          return;
        }

        // 1. Heading — same masked line reveal as the hero.
        const headingIn = gsap.timeline({
          scrollTrigger: {
            trigger: root,
            start: 'top 78%',
            toggleActions: 'play none none reverse',
          },
        });

        headingIn
          .fromTo(
            eyebrow,
            { y: 16, opacity: 0 },
            { y: 0, opacity: 1, duration: 0.6, ease: 'power3.out' },
          )
          .fromTo(
            titleLines,
            { yPercent: 110 },
            { yPercent: 0, duration: 0.9, ease: 'power3.out', stagger: 0.09 },
            '-=0.4',
          );

        // 2. Card reveals. One grouped trigger on desktop; per-card below,
        // where a shared trigger would fire for cards still off-screen right.
        if (isDesktop) {
          gsap.fromTo(
            cards,
            { y: 48, opacity: 0, scale: 0.96 },
            {
              y: 0,
              opacity: 1,
              scale: 1,
              duration: 0.75,
              ease: 'power3.out',
              stagger: 0.08,
              scrollTrigger: {
                trigger: `.${styles.viewport}`,
                start: 'top 78%',
                toggleActions: 'play none none reverse',
              },
            },
          );
        } else {
          cards.forEach((card) => {
            gsap.fromTo(
              card,
              { y: 36, opacity: 0 },
              {
                y: 0,
                opacity: 1,
                duration: 0.65,
                ease: 'power3.out',
                scrollTrigger: {
                  trigger: card,
                  start: 'top 88%',
                  toggleActions: 'play none none reverse',
                },
              },
            );
          });
        }

        // 3. Fruit turns as its card crosses the viewport. Rotation only, so
        // it stays put. `ease: none` — easing a scrub makes it lag the scroll.
        fruits.forEach((fruit, index) => {
          gsap.to(fruit, {
            rotation: index % 2 === 0 ? 24 : -24,
            ease: 'none',
            scrollTrigger: {
              trigger: fruit.closest(`.${styles.card}`),
              start: 'top bottom',
              end: 'bottom top',
              scrub: true,
              invalidateOnRefresh: true,
            },
          });
        });

        // 4. 3D tilt on hover. Desktop only — no cursor to lean toward on
        // touch, where CSS :hover handles the lift instead.
        if (!isDesktop) return;

        // Per-card perspective: a shared one skews cards at the row's edges.
        gsap.set(cards, {
          transformPerspective: 900,
          transformOrigin: 'center center',
        });

        const teardowns = cards.map((card) => {
          // quickTo reuses one tween per property, not one per pointer move.
          const rotX = gsap.quickTo(card, 'rotationX', {
            duration: 0.5,
            ease: 'power3',
          });
          const rotY = gsap.quickTo(card, 'rotationY', {
            duration: 0.5,
            ease: 'power3',
          });
          const lift = gsap.quickTo(card, 'y', {
            duration: 0.5,
            ease: 'power3',
          });

          // Measured on enter: getBoundingClientRect per move forces reflow.
          let bounds = card.getBoundingClientRect();

          const onEnter = () => {
            bounds = card.getBoundingClientRect();
            lift(-HOVER_LIFT);
          };

          const onMove = (event: PointerEvent) => {
            // -0.5 .. 0.5 relative to the centre of the card.
            const nx = (event.clientX - bounds.left) / bounds.width - 0.5;
            const ny = (event.clientY - bounds.top) / bounds.height - 0.5;
            rotY(nx * TILT_DEGREES * 2);
            // Negated so the card tips away from the cursor, not toward it.
            rotX(-ny * TILT_DEGREES * 2);
          };

          const onLeave = () => {
            rotX(0);
            rotY(0);
            lift(0);
          };

          card.addEventListener('pointerenter', onEnter);
          card.addEventListener('pointermove', onMove);
          card.addEventListener('pointerleave', onLeave);

          return () => {
            card.removeEventListener('pointerenter', onEnter);
            card.removeEventListener('pointermove', onMove);
            card.removeEventListener('pointerleave', onLeave);
          };
        });

        // Runs when the query stops matching, alongside reverting the tweens.
        return () => teardowns.forEach((teardown) => teardown());
      },
    );

    return () => mm.revert();
  }, [rootRef]);
}
