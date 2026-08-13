import type { ReactNode } from 'react';

import { cx } from '@/lib/cx';
import styles from './Badge.module.scss';

export type BadgeTone = 'neutral' | 'success' | 'warning' | 'danger' | 'info';

export function Badge({
  tone = 'neutral',
  children,
  className,
}: {
  tone?: BadgeTone;
  children: ReactNode;
  className?: string;
}) {
  return (
    <span className={cx(styles.badge, styles[tone], className)}>
      <span className={styles.dot} aria-hidden />
      {children}
    </span>
  );
}
