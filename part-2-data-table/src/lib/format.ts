/**
 * All formatters are locale-pinned. Next.js renders these components on the
 * server first, and an unpinned `toLocaleString()` can resolve differently
 * there than in the browser — which shows up as a hydration mismatch.
 */

const numberFormatter = new Intl.NumberFormat('en-US');

export const formatNumber = (value: number): string =>
  numberFormatter.format(value);

const currencyFormatters = new Map<string, Intl.NumberFormat>();

export function formatCurrency(amount: number, currency: string): string {
  let formatter = currencyFormatters.get(currency);
  if (!formatter) {
    formatter = new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency,
      minimumFractionDigits: 2,
    });
    currencyFormatters.set(currency, formatter);
  }
  return formatter.format(amount);
}

/** Minutes past midnight -> "10:00 AM". */
export function formatTime(minutesFromMidnight: number): string {
  const hours24 = Math.floor(minutesFromMidnight / 60) % 24;
  const minutes = minutesFromMidnight % 60;
  const meridiem = hours24 < 12 ? 'AM' : 'PM';
  const hours12 = hours24 % 12 === 0 ? 12 : hours24 % 12;
  return `${hours12}:${String(minutes).padStart(2, '0')} ${meridiem}`;
}

export function formatTimeRange(
  startMinutes: number,
  durationMinutes: number,
): string {
  return `${formatTime(startMinutes)} – ${formatTime(startMinutes + durationMinutes)}`;
}

const MONTHS = [
  'Jan',
  'Feb',
  'Mar',
  'Apr',
  'May',
  'Jun',
  'Jul',
  'Aug',
  'Sep',
  'Oct',
  'Nov',
  'Dec',
] as const;

/** "2026-08-17" -> "17 Aug 2026". Parsed by hand to stay timezone-free. */
export function formatDate(isoDate: string): string {
  const [year, month, day] = isoDate.split('-');
  if (!year || !month || !day) return isoDate;
  const monthName = MONTHS[Number(month) - 1] ?? month;
  return `${Number(day)} ${monthName} ${year}`;
}

/** "checked-in" -> "Checked in". */
export function humanize(value: string): string {
  const spaced = value.replace(/-/g, ' ');
  return spaced.charAt(0).toUpperCase() + spaced.slice(1);
}
