import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { ClassStatus } from "@/lib/data/classes";
import type { InvoiceStatus } from "@/lib/data/invoices";
import { formatNumber, humanize } from "@/lib/format";
import styles from "./cells.module.scss";

export function StackedCell({
  primary,
  secondary,
}: {
  primary: string;
  secondary?: string;
}) {
  return (
    <div className={styles.stacked}>
      <span className={styles.primary}>{primary}</span>
      {secondary && <span className={styles.secondary}>{secondary}</span>}
    </div>
  );
}

export function AttendanceCell({
  booked,
  capacity,
  waitlist,
}: {
  booked: number;
  capacity: number;
  waitlist: number;
}) {
  const ratio = capacity === 0 ? 0 : Math.min(1, booked / capacity);
  const isFull = booked >= capacity && capacity > 0;

  return (
    <div className={styles.attendance}>
      <span className={styles.attendanceValue}>
        {formatNumber(booked)} / {formatNumber(capacity)}
      </span>
      <span
        className={styles.meter}
        data-full={isFull}
        role="img"
        aria-label={`${booked} of ${capacity} places booked`}
      >
        <span
          className={styles.meterFill}
          style={{ transform: `scaleX(${ratio})` }}
        />
      </span>
      {waitlist > 0 && (
        <span className={styles.waitlist}>+{waitlist} waiting</span>
      )}
    </div>
  );
}

const CLASS_STATUS_TONE: Record<ClassStatus, BadgeTone> = {
  scheduled: "info",
  full: "success",
  cancelled: "danger",
};

export function ClassStatusBadge({ status }: { status: ClassStatus }) {
  return <Badge tone={CLASS_STATUS_TONE[status]}>{humanize(status)}</Badge>;
}

const INVOICE_STATUS_TONE: Record<InvoiceStatus, BadgeTone> = {
  paid: "success",
  open: "info",
  overdue: "danger",
  refunded: "neutral",
};

export function InvoiceStatusBadge({ status }: { status: InvoiceStatus }) {
  return <Badge tone={INVOICE_STATUS_TONE[status]}>{humanize(status)}</Badge>;
}

export function MonoCell({ children }: { children: string }) {
  return <span className={styles.mono}>{children}</span>;
}
