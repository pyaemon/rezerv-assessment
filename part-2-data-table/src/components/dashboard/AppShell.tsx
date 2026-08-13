'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import type { ReactNode } from 'react';

import { cx } from '@/lib/cx';
import styles from './AppShell.module.scss';

const NAV = [
  { href: '/', label: 'Class timetable' },
  { href: '/demo', label: 'Component demo' },
] as const;

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname();

  return (
    <div className={styles.shell}>
      <a className={styles.skipLink} href="#main">
        Skip to content
      </a>

      <aside className={styles.sidebar}>
        <div className={styles.brand}>
          <span className={styles.brandMark} aria-hidden>
            R
          </span>
          <span className={styles.brandText}>
            Rezerv
            <span className={styles.brandSub}>Studio admin</span>
          </span>
        </div>

        <nav className={styles.nav} aria-label="Main">
          {NAV.map((item) => (
            <Link
              key={item.href}
              href={item.href}
              className={cx(
                styles.navLink,
                pathname === item.href && styles.navLinkActive,
              )}
              aria-current={pathname === item.href ? 'page' : undefined}
            >
              {item.label}
            </Link>
          ))}
        </nav>

        <p className={styles.sidebarNote}>
          Frontend assessment — Part 2. All data is mocked in the browser.
        </p>
      </aside>

      <main id="main" className={styles.main}>
        {children}
      </main>
    </div>
  );
}

export function PageHeader({
  title,
  description,
  actions,
}: {
  title: string;
  description?: string;
  actions?: ReactNode;
}) {
  return (
    <header className={styles.pageHeader}>
      <div>
        <h1 className={styles.pageTitle}>{title}</h1>
        {description && <p className={styles.pageDescription}>{description}</p>}
      </div>
      {actions && <div className={styles.pageActions}>{actions}</div>}
    </header>
  );
}

export function StatTile({
  label,
  value,
  hint,
}: {
  label: string;
  value: string;
  hint?: string;
}) {
  return (
    <div className={styles.stat}>
      <p className={styles.statLabel}>{label}</p>
      <p className={styles.statValue}>{value}</p>
      {hint && <p className={styles.statHint}>{hint}</p>}
    </div>
  );
}

export function StatRow({ children }: { children: ReactNode }) {
  return <div className={styles.statRow}>{children}</div>;
}

export function Toolbar({ children }: { children: ReactNode }) {
  return <div className={styles.toolbar}>{children}</div>;
}

export function Section({
  title,
  description,
  children,
}: {
  title: string;
  description?: string;
  children: ReactNode;
}) {
  return (
    <section className={styles.section}>
      <div className={styles.sectionHead}>
        <h2 className={styles.sectionTitle}>{title}</h2>
        {description && <p className={styles.sectionDescription}>{description}</p>}
      </div>
      {children}
    </section>
  );
}
