import type { ReactNode } from 'react';

import styles from './MiniTable.module.scss';

export interface MiniTableColumn {
  label: string;
  align?: 'left' | 'right';
}

/** Compact table for expanded rows. Deliberately not `DataTable` — child rows
 *  need no sorting, pagination or pinning. */
export function MiniTable({
  caption,
  columns,
  children,
}: {
  caption: string;
  columns: readonly MiniTableColumn[];
  children: ReactNode;
}) {
  return (
    <table className={styles.table}>
      <caption className={styles.caption}>{caption}</caption>
      <thead>
        <tr>
          {columns.map((column) => (
            <th key={column.label} scope="col" data-align={column.align ?? 'left'}>
              {column.label}
            </th>
          ))}
        </tr>
      </thead>
      <tbody>{children}</tbody>
    </table>
  );
}
