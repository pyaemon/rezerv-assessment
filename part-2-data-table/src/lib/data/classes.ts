/**
 * Seeded fixtures. Fixed seed, and timezone-free primitives (ISO date +
 * minutes-from-midnight), so server and client renders always agree.
 */

export type ClassStatus = 'scheduled' | 'full' | 'cancelled';
export type PaymentType = 'one-time' | 'package' | 'membership';
export type BookingStatus = 'booked' | 'checked-in' | 'cancelled' | 'no-show';

export interface Attendee {
  id: string;
  name: string;
  paymentType: PaymentType;
  bookingStatus: BookingStatus;
  /** Membership tier or package name, when applicable. */
  plan: string | null;
}

export interface ClassSession {
  id: string;
  name: string;
  instructor: string;
  room: string;
  /** ISO date, e.g. "2026-08-17". */
  date: string;
  /** Minutes past midnight — sorts numerically, formats without a timezone. */
  startMinutes: number;
  durationMinutes: number;
  capacity: number;
  booked: number;
  waitlist: number;
  status: ClassStatus;
  /** Inline children. The on-demand mode ignores this and fetches instead. */
  attendees: Attendee[];
}

/* Deterministic pseudo-random source */

function mulberry32(seed: number): () => number {
  let state = seed;
  return () => {
    state |= 0;
    state = (state + 0x6d2b79f5) | 0;
    let t = Math.imul(state ^ (state >>> 15), 1 | state);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

const pick = <T,>(random: () => number, items: readonly T[]): T =>
  items[Math.floor(random() * items.length)] as T;

/* Source vocabulary */

const CLASS_NAMES = [
  'Vinyasa Flow',
  'Reformer Pilates',
  'HIIT Circuit',
  'Sunrise Yoga',
  'Spin Endurance',
  'Barre Sculpt',
  'Strength Foundations',
  'Mobility & Recovery',
  'Boxing Fundamentals',
  'Aerial Yoga',
  'Kettlebell Power',
  'Deep Stretch',
  'Functional Athletics',
  'Prenatal Pilates',
] as const;

const INSTRUCTORS = [
  'Amara Osei',
  'Ben Whitaker',
  'Chloé Marchand',
  'Daniyal Rahman',
  'Elena Petrova',
  'Farrah Nasser',
  'Grace Lim',
  'Hugo Alvarez',
] as const;

const ROOMS = ['Studio 1', 'Studio 2', 'Studio 10', 'Mat Room', 'Reformer Bay'] as const;

const FIRST_NAMES = [
  'Aisha', 'Marcus', 'Priya', 'Tom', 'Nadia', 'Leo', 'Ingrid', 'Samuel',
  'Yuki', 'Rosa', 'Callum', 'Mei', 'Oscar', 'Fatima', 'Jonas', 'Delphine',
  'Rafael', 'Nour', 'Erik', 'Ana',
] as const;

const LAST_NAMES = [
  'Ahmed', 'Brennan', 'Costa', 'Duarte', 'Evans', 'Fischer', 'Gallagher',
  'Haddad', 'Ito', 'Jensen', 'Kovač', 'Laurent', 'Moreau', 'Novak',
] as const;

const PAYMENT_TYPES: readonly PaymentType[] = ['one-time', 'package', 'membership'];
const BOOKING_STATUSES: readonly BookingStatus[] = [
  'booked', 'checked-in', 'checked-in', 'cancelled', 'no-show',
];

const PLANS = ['Unlimited', 'Off-peak', '10-class pack', '5-class pack'] as const;

/** Monday of the fixture week. */
const WEEK_START = '2026-08-17';

const addDays = (isoDate: string, days: number): string => {
  const [year, month, day] = isoDate.split('-').map(Number) as [number, number, number];
  const date = new Date(Date.UTC(year, month - 1, day + days));
  return date.toISOString().slice(0, 10);
};

function buildAttendees(
  random: () => number,
  classId: string,
  count: number,
): Attendee[] {
  return Array.from({ length: count }, (_, index) => {
    const paymentType = pick(random, PAYMENT_TYPES);
    return {
      id: `${classId}-att-${index + 1}`,
      name: `${pick(random, FIRST_NAMES)} ${pick(random, LAST_NAMES)}`,
      paymentType,
      bookingStatus: pick(random, BOOKING_STATUSES),
      plan: paymentType === 'one-time' ? null : pick(random, PLANS),
    };
  });
}

function buildClasses(): ClassSession[] {
  const random = mulberry32(20260817);
  const sessions: ClassSession[] = [];

  for (let index = 0; index < 34; index += 1) {
    const id = `cls-${String(index + 1).padStart(3, '0')}`;
    const capacity = 8 + Math.floor(random() * 16);

    // A handful of deliberate outliers so the empty/edge states are reachable
    // from the UI without editing code.
    const isCancelled = index % 11 === 5;
    const isEmpty = index % 17 === 9;
    const isFull = !isCancelled && !isEmpty && index % 7 === 3;

    const booked = isCancelled
      ? 0
      : isEmpty
        ? 0
        : isFull
          ? capacity
          : 1 + Math.floor(random() * (capacity - 1));

    const status: ClassStatus = isCancelled
      ? 'cancelled'
      : booked >= capacity
        ? 'full'
        : 'scheduled';

    sessions.push({
      id,
      name: pick(random, CLASS_NAMES),
      instructor: pick(random, INSTRUCTORS),
      room: pick(random, ROOMS),
      date: addDays(WEEK_START, index % 7),
      startMinutes: 360 + Math.floor(random() * 26) * 30, // 06:00 – 18:30
      durationMinutes: pick(random, [45, 50, 60, 75, 90] as const),
      capacity,
      booked,
      waitlist: isFull ? Math.floor(random() * 6) : 0,
      status,
      attendees: buildAttendees(random, id, booked),
    });
  }

  return sessions;
}

/** Built once at module load — the fixtures never change at runtime. */
export const CLASS_SESSIONS: readonly ClassSession[] = buildClasses();

/**
 * The class whose attendee fetch always fails, so the on-demand error state is
 * reachable deterministically rather than by getting unlucky.
 */
export const FAILING_CLASS_ID = 'cls-004';
