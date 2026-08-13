'use client';

import { useRef } from 'react';

import { Fruit, type FruitKind } from '@/components/Fruit/Fruit';
import styles from './Collection.module.scss';
import { useCollectionAnimation } from './useCollectionAnimation';

/**
 * SECTION 3 — Collection.
 *
 * `.viewport` is the window, `.rail` is the strip inside it. On desktop the
 * cards sit side by side; below that the viewport becomes a natively
 * swipeable, scroll-snapping strip, so touch scrolling is never intercepted.
 *
 * Motion is split by cost:
 *   • Scroll reveals — `useCollectionAnimation`
 *   • Hover (card lift, fruit zoom, button fill) — plain CSS transitions
 *
 * Hover doesn't need a JS animation library. Keeping it in CSS means those
 * interactions cost nothing at runtime and keep working if GSAP never loads.
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
  const rootRef = useRef<HTMLElement>(null);
  useCollectionAnimation(rootRef);

  return (
    <section ref={rootRef} className={styles.collection}>
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
