import { Badge, type BadgeTone } from "@/components/ui/Badge";
import type { Attendee, BookingStatus, ClassSession } from "@/lib/data/classes";
import { humanize } from "@/lib/format";
import { MiniTable } from "./MiniTable";
import styles from "./AttendeePanel.module.scss";

const BOOKING_TONE: Record<BookingStatus, BadgeTone> = {
  booked: "info",
  "checked-in": "success",
  cancelled: "neutral",
  "no-show": "danger",
};

const COLUMNS = [
  { label: "Customer" },
  { label: "Payment" },
  { label: "Plan" },
  { label: "Booking" },
] as const;

export function AttendeePanel({
  attendees,
  session,
}: {
  attendees: readonly Attendee[];
  session: ClassSession;
}) {
  const checkedIn = attendees.filter(
    (attendee) => attendee.bookingStatus === "checked-in"
  ).length;

  return (
    <div className={styles.panel}>
      <p className={styles.summary}>
        <strong>{attendees.length}</strong> booked ·{" "}
        <strong>{checkedIn}</strong> checked in
        {session.waitlist > 0 && (
          <>
            {" "}
            · <strong>{session.waitlist}</strong> on the waitlist
          </>
        )}
      </p>

      <MiniTable caption={`Attendees for ${session.name}`} columns={COLUMNS}>
        {attendees.map((attendee) => (
          <tr key={attendee.id}>
            <td className={styles.name}>{attendee.name}</td>
            <td>{humanize(attendee.paymentType)}</td>
            <td className={styles.plan}>{attendee.plan ?? "—"}</td>
            <td>
              <Badge tone={BOOKING_TONE[attendee.bookingStatus]}>
                {humanize(attendee.bookingStatus)}
              </Badge>
            </td>
          </tr>
        ))}
      </MiniTable>
    </div>
  );
}
