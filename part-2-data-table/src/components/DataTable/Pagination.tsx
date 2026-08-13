'use client';

import { useId } from 'react';

import {
  ChevronFirstIcon,
  ChevronLastIcon,
  ChevronLeftIcon,
  ChevronRightIcon,
} from './icons';
import styles from './Pagination.module.scss';

export interface PaginationProps {
  page: number;
  pageCount: number;
  pageSize: number;
  rowCount: number;
  range: { from: number; to: number };
  pageSizeOptions: readonly number[];
  onPageChange: (page: number) => void;
  onPageSizeChange: (pageSize: number) => void;
  disabled?: boolean;
}

export function Pagination({
  page,
  pageCount,
  pageSize,
  rowCount,
  range,
  pageSizeOptions,
  onPageChange,
  onPageSizeChange,
  disabled = false,
}: PaginationProps) {
  const selectId = useId();

  const isFirst = page <= 1;
  const isLast = page >= pageCount;

  return (
    <div className={styles.pagination}>
      <div className={styles.left}>
        <label className={styles.pageSizeLabel} htmlFor={selectId}>
          Rows per page
        </label>
        <select
          id={selectId}
          className={styles.select}
          value={pageSize}
          disabled={disabled}
          onChange={(event) => onPageSizeChange(Number(event.target.value))}
        >
          {pageSizeOptions.map((option) => (
            <option key={option} value={option}>
              {option}
            </option>
          ))}
        </select>
      </div>

      <div className={styles.right}>
        <p className={styles.range}>
          {rowCount === 0
            ? 'No results'
            : `${range.from.toLocaleString()}–${range.to.toLocaleString()} of ${rowCount.toLocaleString()}`}
        </p>

        <div className={styles.controls}>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => onPageChange(1)}
            disabled={disabled || isFirst}
            aria-label="First page"
          >
            <ChevronFirstIcon />
          </button>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => onPageChange(page - 1)}
            disabled={disabled || isFirst}
            aria-label="Previous page"
          >
            <ChevronLeftIcon />
          </button>

          <span className={styles.pageIndicator}>
            Page {page.toLocaleString()} of {pageCount.toLocaleString()}
          </span>

          <button
            type="button"
            className={styles.pageButton}
            onClick={() => onPageChange(page + 1)}
            disabled={disabled || isLast}
            aria-label="Next page"
          >
            <ChevronRightIcon />
          </button>
          <button
            type="button"
            className={styles.pageButton}
            onClick={() => onPageChange(pageCount)}
            disabled={disabled || isLast}
            aria-label="Last page"
          >
            <ChevronLastIcon />
          </button>
        </div>
      </div>
    </div>
  );
}
