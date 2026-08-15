import type { SortDirection } from './types';

const base = {
  width: 16,
  height: 16,
  viewBox: '0 0 16 16',
  fill: 'none',
  stroke: 'currentColor',
  strokeWidth: 1.6,
  strokeLinecap: 'round' as const,
  strokeLinejoin: 'round' as const,
  'aria-hidden': true,
  focusable: false,
};

export function ChevronRightIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M6 3.5 10.5 8 6 12.5" />
    </svg>
  );
}

export function ChevronLeftIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M10 3.5 5.5 8 10 12.5" />
    </svg>
  );
}

export function ChevronFirstIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M11 3.5 6.5 8 11 12.5M4.5 3.5v9" />
    </svg>
  );
}

export function ChevronLastIcon({ className }: { className?: string }) {
  return (
    <svg {...base} className={className}>
      <path d="M5 3.5 9.5 8 5 12.5M11.5 3.5v9" />
    </svg>
  );
}

/** Three-state sort icon. The inactive state stays visible but dimmed, so the
 *  header doesn't reflow when sorting turns on. */
export function SortIcon({
  direction,
  className,
}: {
  direction: SortDirection | null;
  className?: string;
}) {
  return (
    <svg {...base} className={className} data-direction={direction ?? 'none'}>
      <path d="M8 3v10" opacity={direction ? 1 : 0.45} />
      {direction === 'desc' ? (
        <path d="M4.5 9.5 8 13l3.5-3.5" />
      ) : (
        <path d="M4.5 6.5 8 3l3.5 3.5" opacity={direction ? 1 : 0.45} />
      )}
      {direction === null && <path d="M4.5 9.5 8 13l3.5-3.5" opacity={0.45} />}
    </svg>
  );
}

export function AlertIcon({ className }: { className?: string }) {
  return (
    <svg {...base} width={20} height={20} viewBox="0 0 20 20" className={className}>
      <circle cx="10" cy="10" r="7.25" />
      <path d="M10 6.5v4M10 13.4v.2" />
    </svg>
  );
}

export function InboxIcon({ className }: { className?: string }) {
  return (
    <svg {...base} width={20} height={20} viewBox="0 0 20 20" className={className}>
      <path d="M2.75 11.5h3.5l1.25 2h5l1.25-2h3.5" />
      <path d="M4.75 4.5h10.5l2 7v3a1 1 0 0 1-1 1H3.75a1 1 0 0 1-1-1v-3z" />
    </svg>
  );
}
