/**
 * Shaped like a real backend: async, takes an `AbortSignal`, has latency, can
 * fail. Server-side sort and pagination happen here, not in the component —
 * which is the point of the table's controlled mode.
 */

import type { SortState } from '@/components/DataTable';

import {
  CLASS_SESSIONS,
  FAILING_CLASS_ID,
  type Attendee,
  type ClassSession,
} from './data/classes';
import {
  INVOICES,
  FAILING_INVOICE_ID,
  buildInvoiceLines,
  type Invoice,
  type InvoiceLine,
} from './data/invoices';

export class MockApiError extends Error {
  constructor(message: string) {
    super(message);
    this.name = 'MockApiError';
  }
}

export interface RequestOptions {
  signal?: AbortSignal;
  /** Overrides the default simulated round-trip. */
  latencyMs?: number;
  /** Forces this call to reject — used by the "simulate failures" switch. */
  forceError?: boolean;
}

export interface PageQuery {
  page: number;
  pageSize: number;
  sort: SortState | null;
}

export interface PageResult<TRow> {
  rows: TRow[];
  total: number;
}

const abortError = () =>
  new DOMException('The operation was aborted.', 'AbortError');

/** Abort-aware sleep. Rejects rather than resolving late. */
export function delay(ms: number, signal?: AbortSignal): Promise<void> {
  return new Promise((resolve, reject) => {
    if (signal?.aborted) {
      reject(abortError());
      return;
    }

    const onAbort = () => {
      clearTimeout(timer);
      reject(abortError());
    };

    const timer = setTimeout(() => {
      signal?.removeEventListener('abort', onAbort);
      resolve();
    }, ms);

    signal?.addEventListener('abort', onAbort, { once: true });
  });
}

/* Timetable */

export async function fetchClassSessions(
  options: RequestOptions = {},
): Promise<ClassSession[]> {
  const { signal, latencyMs = 900, forceError = false } = options;
  await delay(latencyMs, signal);

  if (forceError) {
    throw new MockApiError('The timetable service is not responding.');
  }
  return CLASS_SESSIONS.map((session) => ({ ...session }));
}

export async function fetchAttendees(
  classId: string,
  options: RequestOptions = {},
): Promise<Attendee[]> {
  const { signal, latencyMs = 750, forceError = false } = options;
  await delay(latencyMs, signal);

  // One class always fails so the on-demand error path is reachable on
  // purpose rather than by chance.
  if (forceError || classId === FAILING_CLASS_ID) {
    throw new MockApiError(`Couldn't load attendees for this class.`);
  }

  const session = CLASS_SESSIONS.find((item) => item.id === classId);
  if (!session) throw new MockApiError('Class not found.');
  return session.attendees.map((attendee) => ({ ...attendee }));
}

/* Invoices — server-side sort + pagination */

const INVOICE_SORTERS: Record<string, (a: Invoice, b: Invoice) => number> = {
  reference: (a, b) => a.reference.localeCompare(b.reference),
  customer: (a, b) => a.customer.localeCompare(b.customer),
  issuedOn: (a, b) => a.issuedOn.localeCompare(b.issuedOn),
  amount: (a, b) => a.amount - b.amount,
  status: (a, b) => a.status.localeCompare(b.status),
  method: (a, b) => a.method.localeCompare(b.method),
};

export async function fetchInvoicePage(
  query: PageQuery,
  options: RequestOptions = {},
): Promise<PageResult<Invoice>> {
  const { signal, latencyMs = 600, forceError = false } = options;
  await delay(latencyMs, signal);

  if (forceError) {
    throw new MockApiError('The billing service is not responding.');
  }

  let rows = [...INVOICES];

  if (query.sort) {
    const sorter = INVOICE_SORTERS[query.sort.columnId];
    // An unknown sort key is ignored, exactly as a tolerant API would.
    if (sorter) {
      const direction = query.sort.direction === 'asc' ? 1 : -1;
      rows.sort((a, b) => direction * sorter(a, b));
    }
  }

  const total = rows.length;
  const pageCount = Math.max(1, Math.ceil(total / query.pageSize));
  const safePage = Math.min(Math.max(1, query.page), pageCount);
  const start = (safePage - 1) * query.pageSize;
  rows = rows.slice(start, start + query.pageSize);

  return { rows, total };
}

export async function fetchInvoiceLines(
  invoiceId: string,
  options: RequestOptions = {},
): Promise<InvoiceLine[]> {
  const { signal, latencyMs = 700, forceError = false } = options;
  await delay(latencyMs, signal);

  if (forceError || invoiceId === FAILING_INVOICE_ID) {
    throw new MockApiError(`Couldn't load line items for this invoice.`);
  }
  return buildInvoiceLines(invoiceId);
}
