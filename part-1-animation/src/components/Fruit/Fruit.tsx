import type { CSSProperties } from 'react';

import { cx } from '@/lib/cx';
import styles from './Fruit.module.scss';

export type FruitKind =
  'orange' | 'lime' | 'citrus' | 'kiwi' | 'melon' | 'berry';

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
  size?: number;
  className?: string;
  style?: CSSProperties;
}

export function Fruit({ kind, size = 120, className, style }: FruitProps) {
  return (
    <span
      className={cx(styles.fruit, styles[kind], className)}
      style={{ '--size': `${size}px`, ...style } as CSSProperties}
      aria-hidden="true"
    />
  );
}
