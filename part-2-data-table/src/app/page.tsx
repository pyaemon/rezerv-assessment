"use client";

import { useCallback, useEffect, useMemo, useState } from "react";

import { AttendeePanel } from "@/components/dashboard/AttendeePanel";
import {
  PageHeader,
  Section,
  StatRow,
  StatTile,
  Toolbar,
} from "@/components/dashboard/AppShell";
import {
  AttendanceCell,
  ClassStatusBadge,
  StackedCell,
} from "@/components/dashboard/cells";
import {
  DataTable,
  createColumnHelper,
  type ExpansionConfig,
} from "@/components/DataTable";
import { Button, SegmentedControl, Toggle } from "@/components/ui/Controls";
import type { Attendee, ClassSession } from "@/lib/data/classes";
import { formatDate, formatNumber, formatTimeRange } from "@/lib/format";
import { fetchAttendees, fetchClassSessions } from "@/lib/mockApi";

type AttendeeMode = "inline" | "on-demand";

const MODE_OPTIONS = [
  { value: "inline" as const, label: "Inline children" },
  { value: "on-demand" as const, label: "On-demand children" },
];

const getClassId = (session: ClassSession) => session.id;

export default function TimetablePage() {
  const [sessions, setSessions] = useState<readonly ClassSession[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);

  const [mode, setMode] = useState<AttendeeMode>("inline");
  const [simulateFailures, setSimulateFailures] = useState(false);
  const [failInitialLoad, setFailInitialLoad] = useState(false);

  useEffect(() => {
    const controller = new AbortController();
    setIsLoading(true);
    setError(null);

    fetchClassSessions({
      signal: controller.signal,
      forceError: failInitialLoad,
    })
      .then((rows) => {
        if (controller.signal.aborted) return;
        setSessions(rows);
        setIsLoading(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
        setIsLoading(false);
      });

    return () => controller.abort();
  }, [reloadToken, failInitialLoad]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const columns = useMemo(() => {
    const column = createColumnHelper<ClassSession>();

    return [
      column.accessor((row) => row.name, {
        id: "class",
        header: "Class",
        sortable: true,
        pinned: "left",
        width: 208,
        cell: ({ value, row }) => (
          <StackedCell primary={value} secondary={row.room} />
        ),
      }),
      column.accessor((row) => row.instructor, {
        id: "instructor",
        header: "Instructor",
        sortable: true,
        width: 168,
      }),
      column.accessor(
        (row) => `${row.date}#${String(row.startMinutes).padStart(4, "0")}`,
        {
          id: "time",
          header: "Time",
          headerLabel: "Time",
          sortable: true,
          width: 210,
          cell: ({ row }) => (
            <StackedCell
              primary={formatTimeRange(row.startMinutes, row.durationMinutes)}
              secondary={formatDate(row.date)}
            />
          ),
        }
      ),
      column.accessor((row) => row.booked, {
        id: "attendance",
        header: "Attendance",
        sortable: true,
        width: 148,
        align: "right",
        cell: ({ row }) => (
          <AttendanceCell
            booked={row.booked}
            capacity={row.capacity}
            waitlist={row.waitlist}
          />
        ),
      }),
      column.accessor((row) => row.status, {
        id: "status",
        header: "Status",
        sortable: true,
        width: 140,
        cell: ({ value }) => <ClassStatusBadge status={value} />,
      }),
    ];
  }, []);

  const expansion = useMemo<ExpansionConfig<ClassSession, Attendee>>(() => {
    const shared = {
      renderChildren: ({
        children,
        row,
      }: {
        children: readonly Attendee[];
        row: ClassSession;
      }) => <AttendeePanel attendees={children} session={row} />,
      isExpandable: (row: ClassSession) => row.status !== "cancelled",
    };

    if (mode === "inline") {
      return { ...shared, getChildren: (row: ClassSession) => row.attendees };
    }

    return {
      ...shared,
      fetchChildren: (row: ClassSession, signal: AbortSignal) =>
        fetchAttendees(row.id, { signal, forceError: simulateFailures }),
    };
  }, [mode, simulateFailures]);

  const stats = useMemo(() => {
    const active = sessions.filter((s) => s.status !== "cancelled");
    const booked = active.reduce((total, s) => total + s.booked, 0);
    const capacity = active.reduce((total, s) => total + s.capacity, 0);

    return {
      classes: sessions.length,
      booked,
      utilisation: capacity === 0 ? 0 : Math.round((booked / capacity) * 100),
      cancelled: sessions.filter((s) => s.status === "cancelled").length,
    };
  }, [sessions]);

  return (
    <>
      <PageHeader
        title="Class timetable"
        description="Week of 17 Aug 2026 · expand a class to manage its attendees"
        actions={<Button onClick={reload}>Reload</Button>}
      />

      <StatRow>
        <StatTile
          label="Classes"
          value={formatNumber(stats.classes)}
          hint="This week"
        />
        <StatTile
          label="Bookings"
          value={formatNumber(stats.booked)}
          hint="Across active classes"
        />
        <StatTile
          label="Utilisation"
          value={`${stats.utilisation}%`}
          hint="Booked vs capacity"
        />
        <StatTile
          label="Cancelled"
          value={formatNumber(stats.cancelled)}
          hint="Needs follow-up"
        />
      </StatRow>

      <Toolbar>
        <SegmentedControl
          label="Attendee loading strategy"
          value={mode}
          options={MODE_OPTIONS}
          onChange={setMode}
        />
        <div style={{ display: "flex", gap: "1.25rem", flexWrap: "wrap" }}>
          <Toggle
            label="Simulate child fetch failure"
            description="On-demand mode only"
            checked={simulateFailures}
            onChange={setSimulateFailures}
          />
          <Toggle
            label="Simulate initial load failure"
            description="Shows the table error state"
            checked={failInitialLoad}
            onChange={setFailInitialLoad}
          />
        </div>
      </Toolbar>

      <Section
        title="Classes"
        description={
          mode === "inline"
            ? "Attendees ship with each class row and appear instantly on expand."
            : "Attendees are fetched the first time a row is expanded, then cached. Aerial Yoga (cls-004) always fails, so the error and retry path is reachable on purpose."
        }
      >
        <DataTable<ClassSession, Attendee>
          ariaLabel="Class timetable"
          data={sessions}
          columns={columns}
          getRowId={getClassId}
          defaultSort={{ columnId: "time", direction: "asc" }}
          defaultPageSize={10}
          expansion={expansion}
          isLoading={isLoading}
          error={error}
          onRetry={reload}
          emptyState={{
            title: "No classes scheduled",
            description: "Classes added to this week will show up here.",
          }}
          footnote={`Sorting and pagination run in the browser over all ${formatNumber(
            sessions.length
          )} classes.`}
        />
      </Section>
    </>
  );
}
