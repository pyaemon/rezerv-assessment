"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";

import { PageHeader, Section, Toolbar } from "@/components/dashboard/AppShell";
import { LineItemsPanel } from "@/components/dashboard/LineItemsPanel";
import {
  InvoiceStatusBadge,
  MonoCell,
  StackedCell,
} from "@/components/dashboard/cells";
import {
  DataTable,
  createColumnHelper,
  type ExpansionConfig,
  type SortState,
} from "@/components/DataTable";
import { Badge } from "@/components/ui/Badge";
import { Toggle } from "@/components/ui/Controls";
import type { Invoice, InvoiceLine } from "@/lib/data/invoices";
import { getMemberRows, type MemberRow } from "@/lib/data/members";
import { formatCurrency, formatDate, formatNumber } from "@/lib/format";
import { fetchInvoiceLines, fetchInvoicePage } from "@/lib/mockApi";

const getInvoiceId = (invoice: Invoice) => invoice.id;
const getMemberId = (member: MemberRow) => member.id;

const STRESS_ROW_COUNT = 10_000;

export default function ComponentDemoPage() {
  return (
    <>
      <PageHeader
        title="Component demo"
        description="The same DataTable, a different row shape, and the modes the timetable doesn't exercise."
      />
      <ServerDrivenInvoices />
      <LargeDataset />
    </>
  );
}

function ServerDrivenInvoices() {
  const [sort, setSort] = useState<SortState | null>({
    columnId: "issuedOn",
    direction: "desc",
  });
  const [page, setPage] = useState(1);
  const [pageSize, setPageSize] = useState(10);

  const [rows, setRows] = useState<readonly Invoice[]>([]);
  const [total, setTotal] = useState(0);
  const [isLoading, setIsLoading] = useState(true);
  const [isFetching, setIsFetching] = useState(false);
  const [error, setError] = useState<Error | null>(null);
  const [reloadToken, setReloadToken] = useState(0);
  const [failLineFetch, setFailLineFetch] = useState(false);

  const hasLoadedOnce = useRef(false);

  useEffect(() => {
    const controller = new AbortController();
    if (hasLoadedOnce.current) setIsFetching(true);
    else setIsLoading(true);
    setError(null);

    fetchInvoicePage({ page, pageSize, sort }, { signal: controller.signal })
      .then((result) => {
        if (controller.signal.aborted) return;
        setRows(result.rows);
        setTotal(result.total);
        hasLoadedOnce.current = true;
        setIsLoading(false);
        setIsFetching(false);
      })
      .catch((cause: unknown) => {
        if (controller.signal.aborted) return;
        setError(cause instanceof Error ? cause : new Error(String(cause)));
        setIsLoading(false);
        setIsFetching(false);
      });

    return () => controller.abort();
  }, [page, pageSize, sort, reloadToken]);

  const reload = useCallback(() => setReloadToken((token) => token + 1), []);

  const columns = useMemo(() => {
    const column = createColumnHelper<Invoice>();

    return [
      column.accessor((row) => row.reference, {
        id: "reference",
        header: "Invoice",
        sortable: true,
        pinned: "left",
        width: 176,
        cell: ({ value }) => <MonoCell>{value}</MonoCell>,
      }),
      column.accessor((row) => row.customer, {
        id: "customer",
        header: "Customer",
        sortable: true,
        width: 220,
        cell: ({ value, row }) => (
          <StackedCell primary={value} secondary={row.email} />
        ),
      }),
      column.accessor((row) => row.issuedOn, {
        id: "issuedOn",
        header: "Issued",
        sortable: true,
        width: 150,
        cell: ({ value, row }) => (
          <StackedCell
            primary={formatDate(value)}
            secondary={`Due ${formatDate(row.dueOn)}`}
          />
        ),
      }),
      column.accessor((row) => row.amount, {
        id: "amount",
        header: "Amount",
        sortable: true,
        width: 132,
        align: "right",
        cell: ({ value, row }) => formatCurrency(value, row.currency),
      }),
      column.accessor((row) => row.method, {
        id: "method",
        header: "Method",
        sortable: true,
        width: 150,
      }),
      column.accessor((row) => row.status, {
        id: "status",
        header: "Status",
        sortable: true,
        width: 132,
        cell: ({ value }) => <InvoiceStatusBadge status={value} />,
      }),
    ];
  }, []);

  const expansion = useMemo<ExpansionConfig<Invoice, InvoiceLine>>(
    () => ({
      fetchChildren: (row, signal) =>
        fetchInvoiceLines(row.id, { signal, forceError: failLineFetch }),
      renderChildren: ({ children, row }) => (
        <LineItemsPanel lines={children} invoice={row} />
      ),
    }),
    [failLineFetch]
  );

  return (
    <Section
      title="Invoices — server-driven"
      description="Sort and pagination are controlled: the table emits a change, the mock API does the work, and the parent hands back one page plus a total. Line items load the first time a row is expanded and are cached afterwards. Invoice REZ-2026-0003 always fails."
    >
      <Toolbar>
        <p style={{ fontSize: "0.8125rem", color: "var(--text-muted)" }}>
          Current query:{" "}
          <code>
            page={page}, pageSize={pageSize}, sort=
            {sort ? `${sort.columnId}:${sort.direction}` : "none"}
          </code>
        </p>
        <Toggle
          label="Simulate line-item fetch failure"
          description="Every expand rejects"
          checked={failLineFetch}
          onChange={setFailLineFetch}
        />
      </Toolbar>

      <DataTable<Invoice, InvoiceLine>
        ariaLabel="Invoices"
        data={rows}
        columns={columns}
        getRowId={getInvoiceId}
        sort={sort}
        onSortChange={setSort}
        manualSorting
        page={page}
        onPageChange={setPage}
        pageSize={pageSize}
        onPageSizeChange={setPageSize}
        manualPagination
        rowCount={total}
        expansion={expansion}
        isLoading={isLoading}
        isFetching={isFetching}
        error={error}
        onRetry={reload}
        emptyState={{ title: "No invoices found" }}
        footnote={`Server-side: ${formatNumber(rows.length)} of ${formatNumber(
          total
        )} rows transferred for this page.`}
      />
    </Section>
  );
}

function LargeDataset() {
  const [rows, setRows] = useState<readonly MemberRow[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const id = setTimeout(() => {
      setRows(getMemberRows(STRESS_ROW_COUNT));
      setIsLoading(false);
    }, 400);
    return () => clearTimeout(id);
  }, []);

  const columns = useMemo(() => {
    const column = createColumnHelper<MemberRow>();

    return [
      column.accessor((row) => row.name, {
        id: "name",
        header: "Member",
        sortable: true,
        pinned: "left",
        width: 200,
      }),
      column.accessor((row) => row.tier, {
        id: "tier",
        header: "Tier",
        sortable: true,
        width: 160,
        cell: ({ value }) => (
          <Badge tone={value === "Unlimited" ? "success" : "neutral"}>
            {value}
          </Badge>
        ),
      }),
      column.accessor((row) => row.visits, {
        id: "visits",
        header: "Visits",
        sortable: true,
        width: 120,
        align: "right",
        cell: ({ value }) => formatNumber(value),
      }),
      column.accessor((row) => row.lifetimeSpend, {
        id: "spend",
        header: "Lifetime spend",
        sortable: true,
        width: 160,
        align: "right",
        cell: ({ value }) => formatCurrency(value, "GBP"),
      }),
      column.accessor((row) => row.joinedOn, {
        id: "joinedOn",
        header: "Joined",
        sortable: true,
        width: 140,
        cell: ({ value }) => formatDate(value),
      }),
    ];
  }, []);

  return (
    <Section
      title="Members — 10,000 rows, client-side"
      description="No expansion, no server. Sorting runs over the whole dataset in the browser while pagination keeps the DOM at one page of rows."
    >
      <DataTable<MemberRow>
        ariaLabel="Members"
        data={rows}
        columns={columns}
        getRowId={getMemberId}
        defaultPageSize={25}
        pageSizeOptions={[25, 50, 100]}
        isLoading={isLoading}
        emptyState={{ title: "No members" }}
        footnote={`${formatNumber(
          rows.length
        )} rows sorted in memory; only the current page is mounted.`}
      />
    </Section>
  );
}
