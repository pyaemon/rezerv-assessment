'use client';

import { Fruit, type FruitKind } from '@/components/Fruit/Fruit';
import styles from './Collection.module.scss';

/**
 * SECTION 3 — Collection.  ← LAYOUT ONLY. All animation is yours to write.
 *
 * Structure is `.viewport` (the window) wrapping `.rail` (the strip that
 * slides). That split matters: you pin the SECTION, and translate the RAIL.
 * Trying to do both on one element fights ScrollTrigger's pin spacer.
 *
 * ── YOUR TODO LIST ─────────────────────────────────────────────────────
 * □ Pinned horizontal scroll (desktop only):
 *     gsap.to(rail, {
 *       x: () => -(rail.scrollWidth - viewport.clientWidth),
 *       ease: 'none',
 *       scrollTrigger: {
 *         trigger: section, pin: true, scrub: 1,
 *         end: () => '+=' + rail.scrollWidth,
 *         invalidateOnRefresh: true,
 *       },
 *     });
 *   Function values + `invalidateOnRefresh` are what make resize work.
 *
 * □ Card reveals as each enters view. These do NOT need scrub — a one-shot
 *   `toggleActions: 'play none none reverse'` is cheaper and looks better.
 *
 * □ MOBILE: do not pin. A pinned horizontal rail fights native touch
 *   scrolling. `.rail` already falls back to a swipeable overflow-x strip
 *   below the desktop breakpoint — just skip building the timeline there
 *   via `gsap.matchMedia()`, and write that decision up in your README.
 *
 * Card hover is already handled in CSS. You don't need GSAP for everything,
 * and saying that out loud in the README reads as judgement, not laziness.
 */

interface Item {
  id: string;
  name: string;
  kind: FruitKind;
  category: 'Drink' | 'Meal';
  kcal: number;
  note: string;
  /** Drives the card's background tint. */
  tone: 'citrus' | 'green' | 'berry' | 'melon';
}

const ITEMS: readonly Item[] = [
  {
    id: 'citrus-reset',
    name: 'Citrus Reset',
    kind: 'citrus',
    category: 'Drink',
    kcal: 120,
    note: 'Blood orange, ginger, turmeric',
    tone: 'citrus',
  },
  {
    id: 'green-machine',
    name: 'Green Machine',
    kind: 'lime',
    category: 'Drink',
    kcal: 95,
    note: 'Cucumber, lime, spinach, mint',
    tone: 'green',
  },
  {
    id: 'berry-recovery',
    name: 'Berry Recovery',
    kind: 'berry',
    category: 'Drink',
    kcal: 180,
    note: 'Blueberry, whey isolate, oat',
    tone: 'berry',
  },
  {
    id: 'kiwi-kickstart',
    name: 'Kiwi Kickstart',
    kind: 'kiwi',
    category: 'Meal',
    kcal: 410,
    note: 'Greek yoghurt, kiwi, toasted seeds',
    tone: 'green',
  },
  {
    id: 'melon-hydrate',
    name: 'Melon Hydrate',
    kind: 'melon',
    category: 'Drink',
    kcal: 90,
    note: 'Watermelon, sea salt, basil',
    tone: 'melon',
  },
  {
    id: 'sunrise-bowl',
    name: 'Sunrise Bowl',
    kind: 'orange',
    category: 'Meal',
    kcal: 480,
    note: 'Quinoa, citrus salmon, avocado',
    tone: 'citrus',
  },
];

export function Collection() {
  return (
    <section className={styles.collection}>
      <div className={styles.head}>
        <p className={styles.eyebrow}>This week&apos;s line-up</p>
        <h2 className={styles.title}>Six ways to fuel a training week</h2>
      </div>

      <div className={styles.viewport}>
        <div className={styles.rail}>
          {ITEMS.map((item) => (
            <article key={item.id} className={styles.card} data-tone={item.tone}>
              <div className={styles.cardArt}>
                <Fruit kind={item.kind} size={150} className={styles.cardFruit} />
              </div>

              <div className={styles.cardBody}>
                <span className={styles.tag}>{item.category}</span>
                <h3 className={styles.cardName}>{item.name}</h3>
                <p className={styles.cardNote}>{item.note}</p>
                <p className={styles.kcal}>{item.kcal} kcal</p>
              </div>

              <button type="button" className={styles.cardCta}>
                Add to plan
              </button>
            </article>
          ))}
        </div>
      </div>
    </section>
  );
}
