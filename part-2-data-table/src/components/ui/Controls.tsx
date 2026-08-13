'use client';

import { useId } from 'react';

import { cx } from '@/lib/cx';
import styles from './Controls.module.scss';

/** A labelled on/off switch backed by a real checkbox. */
export function Toggle({
  checked,
  onChange,
  label,
  description,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
  description?: string;
}) {
  const id = useId();

  return (
    <div className={styles.toggleRow}>
      <input
        id={id}
        type="checkbox"
        className={styles.toggleInput}
        checked={checked}
        onChange={(event) => onChange(event.target.checked)}
      />
      <label className={styles.toggle} htmlFor={id}>
        <span className={styles.track} aria-hidden>
          <span className={styles.thumb} />
        </span>
        <span className={styles.toggleText}>
          <span className={styles.toggleLabel}>{label}</span>
          {description && (
            <span className={styles.toggleDescription}>{description}</span>
          )}
        </span>
      </label>
    </div>
  );
}

export interface SegmentedOption<TValue extends string> {
  value: TValue;
  label: string;
}

/** Radio group styled as a segmented control — arrow keys work for free. */
export function SegmentedControl<TValue extends string>({
  value,
  options,
  onChange,
  label,
}: {
  value: TValue;
  options: readonly SegmentedOption<TValue>[];
  onChange: (value: TValue) => void;
  label: string;
}) {
  const name = useId();

  return (
    <div className={styles.segmented} role="radiogroup" aria-label={label}>
      {options.map((option) => {
        const id = `${name}-${option.value}`;
        const isActive = option.value === value;
        return (
          <span key={option.value} className={styles.segment}>
            <input
              id={id}
              type="radio"
              name={name}
              className={styles.segmentInput}
              value={option.value}
              checked={isActive}
              onChange={() => onChange(option.value)}
            />
            <label
              htmlFor={id}
              className={cx(styles.segmentLabel, isActive && styles.segmentActive)}
            >
              {option.label}
            </label>
          </span>
        );
      })}
    </div>
  );
}

export function Button({
  children,
  onClick,
  variant = 'secondary',
  type = 'button',
}: {
  children: React.ReactNode;
  onClick?: () => void;
  variant?: 'primary' | 'secondary';
  type?: 'button' | 'submit';
}) {
  return (
    <button
      type={type}
      className={cx(styles.button, styles[variant])}
      onClick={onClick}
    >
      {children}
    </button>
  );
}
