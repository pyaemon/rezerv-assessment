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
        // Without a branch that matches below 1024px, GSAP would call this
        // callback for nobody on phones and tablets — and no animation would
        // be built at all.
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

        /* ---------------------------------------------------------- *
         * 1. Heading — masked line reveal, same technique as the hero
         * ---------------------------------------------------------- */
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

        /* ---------------------------------------------------------- *
         * 2. Card reveals
         *
         * Desktop cards sit side by side, so one trigger staggers them as a
         * group. Below that they're in a horizontally scrollable strip, where
         * a shared trigger would fire for cards still off to the right — so
         * each gets its own.
         * ---------------------------------------------------------- */
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

        /* ---------------------------------------------------------- *
         * 3. Fruit turns slowly in its plate as the card crosses the
         *    viewport.
         *
         * Rotation only — no translation. The plate is a circle, so a fruit
         * that also moved would drift against its edge and get clipped.
         * Spinning in place stays contained at any scroll position.
         *
         * `ease: 'none'` because it's scrub-linked: any easing here would
         * make the fruit appear to lag the scroll.
         * ---------------------------------------------------------- */
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

        /* ---------------------------------------------------------- *
         * 4. 3D tilt on hover — desktop only
         *
         * There is no cursor to lean toward on a touch device, and the CSS
         * `:hover` lift already covers those sizes.
         * ---------------------------------------------------------- */
        if (!isDesktop) return;

        // Per-card perspective rather than a shared one on the container, so
        // each card has its own vanishing point instead of the row sharing a
        // single one (which looks skewed at the edges of a grid).
        gsap.set(cards, {
          transformPerspective: 900,
          transformOrigin: 'center center',
        });

        const teardowns = cards.map((card) => {
          // quickTo reuses one tween per property instead of allocating a new
          // one on every pointer move.
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

          // Measured on enter, not on every move — calling
          // getBoundingClientRect inside a pointermove handler forces a
          // layout recalculation on every frame.
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

        // matchMedia runs this when the query stops matching, alongside
        // reverting every tween created above.
        return () => teardowns.forEach((teardown) => teardown());
      },
    );

    return () => mm.revert();
  }, [rootRef]);
}
