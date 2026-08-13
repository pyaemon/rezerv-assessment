/**
 * A deliberately different row shape from `ClassSession` — different keys,
 * different value types, currency amounts, a lazily-fetched child collection.
 * Rendering both with the same `<DataTable>` is what proves the component
 * isn't quietly coupled to the timetable.
 */

export type InvoiceStatus = 'paid' | 'open' | 'overdue' | 'refunded';
export type PaymentMethod = 'Card' | 'Direct debit' | 'Bank transfer';

export interface InvoiceLine {
  id: string;
  description: string;
  quantity: number;
  unitAmount: number;
}

export interface Invoice {
  id: string;
  reference: string;
  customer: string;
  email: string;
  /** ISO date string — sorts correctly as plain text. */
  issuedOn: string;
  dueOn: string;
  amount: number;
  currency: string;
  status: InvoiceStatus;
  method: PaymentMethod;
}

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

const CUSTOMERS = [
  'Harriet Bloom', 'Idris Kaya', 'Jonah Feld', 'Keiko Tanaka', 'Lucía Ferrer',
  'Malik Osman', 'Nina Sørensen', 'Omar Haddad', 'Petra Nowak', 'Quentin Roy',
  'Rina Patel', 'Stefan Brandt', 'Talia Mizrahi', 'Uma Krishnan',
  'Viktor Ilic', 'Wren Halloway',
] as const;

const STATUSES: readonly InvoiceStatus[] = [
  'paid', 'paid', 'paid', 'open', 'open', 'overdue', 'refunded',
];

const METHODS: readonly PaymentMethod[] = ['Card', 'Direct debit', 'Bank transfer'];

const LINE_DESCRIPTIONS = [
  'Unlimited monthly membership',
  '10-class pack',
  'Personal training — 60 min',
  'Reformer Pilates drop-in',
  'Guest pass',
  'Towel service',
  'Workshop: Mobility basics',
] as const;

const toIsoDate = (dayOffset: number): string =>
  new Date(Date.UTC(2026, 4, 1 + dayOffset)).toISOString().slice(0, 10);

function buildInvoices(): Invoice[] {
  const random = mulberry32(778291);

  return Array.from({ length: 137 }, (_, index) => {
    const issuedOffset = Math.floor(random() * 100);
    const customer = pick(random, CUSTOMERS);

    return {
      id: `inv-${String(index + 1).padStart(4, '0')}`,
      reference: `REZ-2026-${String(index + 1).padStart(4, '0')}`,
      customer,
      // Decompose first so "Sørensen" becomes "sorensen", not "s.rensen".
      email: `${customer
        .normalize('NFD')
        .replace(/[\u0300-\u036f]/g, '')
        .replace(/ø/gi, 'o')
        .toLowerCase()
        .replace(/[^a-z]+/g, '.')}@example.com`,
      issuedOn: toIsoDate(issuedOffset),
      dueOn: toIsoDate(issuedOffset + 14),
      amount: Math.round((18 + random() * 340) * 100) / 100,
      currency: 'GBP',
      status: pick(random, STATUSES),
      method: pick(random, METHODS),
    };
  });
}

export const INVOICES: readonly Invoice[] = buildInvoices();

/** Line items are generated on request to mimic a separate endpoint. */
export function buildInvoiceLines(invoiceId: string): InvoiceLine[] {
  const seed = Array.from(invoiceId).reduce(
    (total, character) => total * 31 + character.charCodeAt(0),
    7,
  );
  const random = mulberry32(seed >>> 0);
  const count = 1 + Math.floor(random() * 4);

  return Array.from({ length: count }, (_, index) => ({
    id: `${invoiceId}-line-${index + 1}`,
    description: pick(random, LINE_DESCRIPTIONS),
    quantity: 1 + Math.floor(random() * 3),
    unitAmount: Math.round((12 + random() * 120) * 100) / 100,
  }));
}

/**
 * The invoice whose line-item fetch always fails, so the on-demand error
 * state is reproducible on demand.
 */
export const FAILING_INVOICE_ID = 'inv-0003';
