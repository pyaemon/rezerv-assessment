import type { Invoice, InvoiceLine } from '@/lib/data/invoices';
import { formatCurrency } from '@/lib/format';
import { MiniTable } from './MiniTable';
import styles from './AttendeePanel.module.scss';

const COLUMNS = [
  { label: 'Description' },
  { label: 'Qty', align: 'right' as const },
  { label: 'Unit', align: 'right' as const },
  { label: 'Total', align: 'right' as const },
];

export function LineItemsPanel({
  lines,
  invoice,
}: {
  lines: readonly InvoiceLine[];
  invoice: Invoice;
}) {
  const total = lines.reduce(
    (sum, line) => sum + line.quantity * line.unitAmount,
    0,
  );

  return (
    <div className={styles.panel}>
      <p className={styles.summary}>
        <strong>{lines.length}</strong> line{lines.length === 1 ? '' : 's'} ·
        billed to {invoice.email}
      </p>

      <MiniTable caption={`Line items for ${invoice.reference}`} columns={COLUMNS}>
        {lines.map((line) => (
          <tr key={line.id}>
            <td>{line.description}</td>
            <td data-align="right">{line.quantity}</td>
            <td data-align="right">
              {formatCurrency(line.unitAmount, invoice.currency)}
            </td>
            <td data-align="right">
              {formatCurrency(line.quantity * line.unitAmount, invoice.currency)}
            </td>
          </tr>
        ))}
        <tr>
          <td colSpan={3} data-align="right" className={styles.name}>
            Line total
          </td>
          <td data-align="right" className={styles.name}>
            {formatCurrency(total, invoice.currency)}
          </td>
        </tr>
      </MiniTable>
    </div>
  );
}
