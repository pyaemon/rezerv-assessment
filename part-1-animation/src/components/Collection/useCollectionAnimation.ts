'use client';

import { useEffect, type RefObject } from 'react';
import gsap from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

import styles from './Collection.module.scss';

gsap.registerPlugin(ScrollTrigger);

/**
 * Scroll-triggered reveals for the collection.
 *
 * Deliberately NOT scrubbed. A scrub ties an animation's playhead to scroll
 * position, which is right for parallax but wrong for a reveal — scrubbing a
 * fade means the card is half-visible whenever the user stops mid-scroll.
 * These play once at their own pace and reverse on the way back up, which is
 * both cheaper and the behaviour people expect.
 *
 * The section is not pinned. A pinned horizontal rail competes with native
 * touch scrolling on phones, and the hero parallax already covers the brief's
 * scroll-driven requirement — so the complexity wasn't worth it here.
 */
export function useCollectionAnimation(rootRef: RefObject<HTMLElement | null>) {
  useEffect(() => {
    const root = rootRef.current;
    if (!root) return;

    const q = <T extends HTMLElement>(selector: string) =>
      Array.from(root.querySelectorAll<T>(selector));

    // Class names are hashed by CSS Modules, so selectors come from `styles`.
    const heading = q(`.${styles.eyebrow}, .${styles.title}`);
    const cards = q(`.${styles.card}`);

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

        if (reduce) {
          gsap.set([...heading, ...cards], { opacity: 1, y: 0, scale: 1 });
          return;
        }

        gsap.fromTo(
          heading,
          { y: 24, opacity: 0 },
          {
            y: 0,
            opacity: 1,
            duration: 0.8,
            ease: 'power3.out',
            stagger: 0.1,
            scrollTrigger: {
              trigger: root,
              start: 'top 80%',
              toggleActions: 'play none none reverse',
            },
          },
        );

        /**
         * On desktop the cards sit side by side, so one trigger on the rail
         * staggers them as a group. Below that they're in a horizontally
         * scrollable strip — a shared trigger would fire for cards still off
         * to the right, so each card gets its own.
         */
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
          return;
        }

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
      },
    );

    return () => mm.revert();
  }, [rootRef]);
}
