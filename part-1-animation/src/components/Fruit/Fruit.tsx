import type { CSSProperties } from 'react';

import { cx } from '@/lib/cx';
import styles from './Fruit.module.scss';

export type FruitKind =
  | 'orange'
  | 'lime'
  | 'citrus'
  | 'kiwi'
  | 'melon'
  | 'berry';

export const FRUIT_KINDS: readonly FruitKind[] = [
  'orange',
  'lime',
  'citrus',
  'kiwi',
  'melon',
  'berry',
];

interface FruitProps {
  kind: FruitKind;
  /** Rendered diameter in px. Everything inside scales from this. */
  size?: number;
  className?: string;
  style?: CSSProperties;
}

/**
 * A single piece of fruit, drawn entirely in CSS — gradients, border-radius
 * and pseudo-elements. No images, so there is nothing to download, nothing to
 * lazy-load, and no licensing to attribute.
 *
 * Purely decorative: `aria-hidden` throughout. If a fruit ever carries meaning,
 * label the thing around it rather than the shape.
 */
export function Fruit({ kind, size = 120, className, style }: FruitProps) {
  return (
    <span
      className={cx(styles.fruit, styles[kind], className)}
      style={{ '--size': `${size}px`, ...style } as CSSProperties}
      aria-hidden="true"
    />
  );
}
