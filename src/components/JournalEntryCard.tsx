import type { JournalEntry } from "@/lib/types";

type Props = {
  entry: JournalEntry;
  onClose: () => void;
};

function formatPostingDate(iso: string): string {
  if (!iso) return "—";
  const d = new Date(iso);
  if (Number.isNaN(d.getTime())) return iso;
  return d.toISOString().slice(0, 10);
}

export function JournalEntryCard({ entry, onClose }: Props) {
  const fields: [string, string | number][] = [
    ["CompanyCode", entry.companyCode || "—"],
    ["FiscalYear", entry.fiscalYear],
    ["AccountingDocument", entry.accountingDocument],
    ["GLAccount", entry.glAccount],
    ["ReferenceDocument", entry.referenceDocument],
    ["CostCenter / ProfitCenter", entry.costCenterProfitCenter || "—"],
    ["TransactionCurrency", entry.transactionCurrency],
    ["AmountInTransactionCurrency", entry.amountInTransactionCurrency],
    ["CompanyCodeCurrency", entry.companyCodeCurrency],
    ["AmountInCompanyCodeCurrency", entry.amountInCompanyCodeCurrency],
    ["PostingDate / DocumentDate", formatPostingDate(entry.postingDocumentDate)],
    ["AccountingDocumentType", entry.accountingDocumentType],
    ["AccountingDocumentItem", entry.accountingDocumentItem],
  ];

  return (
    <div className="pointer-events-auto w-[min(92vw,340px)] rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Entity
          </p>
          <p className="text-sm font-semibold text-gray-900">{entry.entity}</p>
        </div>
        <button
          type="button"
          onClick={onClose}
          className="rounded px-2 py-0.5 text-xs text-gray-500 hover:bg-gray-100"
        >
          Close
        </button>
      </div>
      <dl className="space-y-1.5 border-t border-gray-100 pt-2">
        {fields.map(([k, v]) => (
          <div
            key={k}
            className="grid grid-cols-[minmax(0,1fr)_auto] gap-x-3 text-xs"
          >
            <dt className="text-gray-500">{k}</dt>
            <dd className="font-mono text-right text-gray-900">{v}</dd>
          </div>
        ))}
      </dl>
      <p className="mt-3 text-[11px] text-gray-400">
        Additional fields hidden for readability
      </p>
      <p className="mt-1 text-xs text-gray-600">
        Connections: {entry.connectionCount}
      </p>
    </div>
  );
}
