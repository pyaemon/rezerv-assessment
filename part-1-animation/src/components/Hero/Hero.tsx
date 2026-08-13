'use client';

import { useRef, type CSSProperties } from 'react';

import { Fruit, type FruitKind } from '@/components/Fruit/Fruit';
import styles from './Hero.module.scss';
import { useHeroAnimation } from './useHeroAnimation';

/**
 * SECTION 2 — Hero.  ← LAYOUT ONLY. All animation is yours to write.
 *
 * The markup below is shaped to make the animation easy. Two structural
 * decisions worth understanding, because a reviewer may ask:
 *
 * 1. NESTED TRANSFORM LAYERS.
 *    Each fruit is wrapped in `.floater` (positioned, carries `data-speed`)
 *    which wraps `.bob` which wraps the fruit itself. Three layers because
 *    three different animations want the `transform` property at once:
 *      .floater → scroll parallax   (scrubbed)
 *      .bob     → idle drift        (looping)
 *      .fruit   → mouse follow      (quickTo)
 *    If they all shared one element, each would overwrite the others.
 *
 * 2. MASKED LINE REVEAL.
 *    The headline is `.line > span` pairs. `.line` has `overflow: hidden`,
 *    so animating the inner span from `yPercent: 100` slides the text up
 *    from behind its own edge. That's the reveal you see on sites like the
 *    reference. Don't flatten this structure.
 *
 * ── YOUR TODO LIST ─────────────────────────────────────────────────────
 * □ Entrance timeline (runs after the preloader finishes):
 *     .from('.line > span', { yPercent: 100, stagger: 0.08 })
 *     .from(fruits, { scale: 0.7, opacity: 0, stagger: 0.05 }, '<0.2')
 * □ Parallax: read `data-speed` off each .floater, move y on scroll with
 *   `scrub: true`. Use function-based values so resize re-measures.
 * □ Idle drift on `.bob`: a repeating yoyo tween, random delay per fruit so
 *   they don't move in lockstep.
 * □ Mouse follow with `gsap.quickTo` — listen on the section, not window.
 * □ Wrap the whole thing in `gsap.matchMedia()` so tablet/mobile get a
 *   simpler timeline and reduced-motion gets none. Return `mm.revert()`.
 *
 * Note: `.scrollCue` already animates in CSS — that one doesn't need GSAP.
 */

interface Floater {
  id: string;
  kind: FruitKind;
  size: number;
  /** Percentage position within the hero, tablet and up. */
  top: number;
  left: number;
  /**
   * Percentage position below tablet. On phones the copy fills the width, so
   * fruit has to move into the bands above and below it rather than beside it.
   * Falls back to the desktop position when omitted.
   */
  mobileTop?: number;
  mobileLeft?: number;
  /** Parallax multiplier — read this in your ScrollTrigger. */
  speed: number;
  /** Hidden below desktop to keep smaller screens uncluttered. */
  desktopOnly?: boolean;
}

/**
 * Positions are kept outside the ~25–75% centre band, because that's where the
 * copy lives. Keeping fruit clear of the text is a layout constraint, not a
 * stylistic one — a floater over the headline reads as a bug.
 */
const FLOATERS: readonly Floater[] = [
  {
    id: 'citrus',
    kind: 'citrus',
    size: 132,
    top: 17,
    left: 8,
    mobileTop: 13,
    mobileLeft: 18,
    speed: 0.35,
  },
  {
    id: 'kiwi',
    kind: 'kiwi',
    size: 96,
    top: 70,
    left: 12,
    mobileTop: 90,
    mobileLeft: 20,
    speed: 0.6,
  },
  {
    id: 'berry',
    kind: 'berry',
    size: 54,
    top: 42,
    left: 18,
    mobileTop: 8,
    mobileLeft: 52,
    speed: 0.85,
  },
  {
    id: 'melon',
    kind: 'melon',
    size: 150,
    top: 64,
    left: 88,
    mobileTop: 90,
    mobileLeft: 78,
    speed: 0.4,
  },
  {
    id: 'orange',
    kind: 'orange',
    size: 108,
    top: 15,
    left: 86,
    mobileTop: 15,
    mobileLeft: 82,
    speed: 0.7,
  },
  {
    id: 'lime',
    kind: 'lime',
    size: 72,
    top: 86,
    left: 79,
    speed: 0.9,
    desktopOnly: true,
  },
  {
    id: 'berry-2',
    kind: 'berry',
    size: 40,
    top: 31,
    left: 93,
    speed: 1.1,
    desktopOnly: true,
  },
];

const HEADLINE = ['Eat clean.', 'Train hard.', 'Feel unstoppable.'];

export function Hero() {
  const rootRef = useRef<HTMLElement>(null);
  useHeroAnimation(rootRef);

  return (
    <section ref={rootRef} className={styles.hero}>
      <div className={styles.orbit} aria-hidden="true">
        {FLOATERS.map((floater) => (
          <span
            key={floater.id}
            className={styles.floater}
            data-speed={floater.speed}
            data-desktop-only={floater.desktopOnly ? 'true' : undefined}
            style={
              {
                '--top': `${floater.top}%`,
                '--left': `${floater.left}%`,
                '--top-sm': `${floater.mobileTop ?? floater.top}%`,
                '--left-sm': `${floater.mobileLeft ?? floater.left}%`,
              } as CSSProperties
            }
          >
            <span className={styles.bob}>
              <Fruit kind={floater.kind} size={floater.size} />
            </span>
          </span>
        ))}
      </div>

      <div className={styles.inner}>
        <p className={styles.eyebrow}>Meal plans &amp; cold-pressed drinks</p>

        <h1 className={styles.title}>
          {HEADLINE.map((line) => (
            <span key={line} className={styles.line}>
              <span>{line}</span>
            </span>
          ))}
        </h1>

        <p className={styles.lede}>
          Chef-built bowls and cold-pressed juices, portioned around your
          training week. Delivered the morning you need them.
        </p>

        <div className={styles.actions}>
          <button type="button" className={styles.cta}>
            Build my plan
          </button>
          <button type="button" className={styles.ghost}>
            See this week&apos;s menu
          </button>
        </div>
      </div>

      <div className={styles.scrollCue} aria-hidden="true">
        <span>Scroll</span>
        <span className={styles.scrollLine} />
      </div>
    </section>
  );
}
