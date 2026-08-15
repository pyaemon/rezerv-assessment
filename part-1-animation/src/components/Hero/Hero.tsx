'use client';

import { useRef, type CSSProperties } from 'react';

import { Fruit, type FruitKind } from '@/components/Fruit/Fruit';
import styles from './Hero.module.scss';
import { useHeroAnimation } from './useHeroAnimation';

interface Floater {
  id: string;
  kind: FruitKind;
  size: number;
  top: number;
  left: number;
  mobileTop?: number;
  mobileLeft?: number;
  speed: number;
  desktopOnly?: boolean;
}

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

export function Hero({ introReady }: { introReady: boolean }) {
  const rootRef = useRef<HTMLElement>(null);
  useHeroAnimation(rootRef, introReady);

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
