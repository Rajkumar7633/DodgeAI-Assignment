import fs from "node:fs";
import path from "node:path";
import type {
  GraphLink,
  GraphNode,
  GraphPayload,
  JournalEntry,
} from "./types";

const DATA_ROOT = path.join(process.cwd(), "data", "sap-o2c-data");

type JsonlRow = Record<string, unknown>;

function readJsonlFiles(subdir: string): JsonlRow[] {
  const dir = path.join(DATA_ROOT, subdir);
  const out: JsonlRow[] = [];
  if (!fs.existsSync(dir)) return out;
  for (const name of fs.readdirSync(dir)) {
    if (!name.endsWith(".jsonl")) continue;
    const text = fs.readFileSync(path.join(dir, name), "utf8");
    for (const line of text.split("\n")) {
      const t = line.trim();
      if (!t) continue;
      try {
        out.push(JSON.parse(t) as JsonlRow);
      } catch {
        /* skip bad line */
      }
    }
  }
  return out;
}

function num(v: unknown): number {
  if (typeof v === "number" && !Number.isNaN(v)) return v;
  if (typeof v === "string") {
    const n = parseFloat(v.replace(/,/g, ""));
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function int(v: unknown): number {
  if (typeof v === "number") return Math.trunc(v);
  if (typeof v === "string") {
    const n = parseInt(v, 10);
    return Number.isNaN(n) ? 0 : n;
  }
  return 0;
}

function jeNodeId(row: JsonlRow): string {
  const cc = String(row.companyCode ?? "");
  const fy = String(row.fiscalYear ?? "");
  const doc = String(row.accountingDocument ?? "");
  const item = String(row.accountingDocumentItem ?? "");
  return `je:${cc}:${fy}:${doc}:${item}`;
}

function rowToJournalEntry(row: JsonlRow, connectionCount: number): JournalEntry {
  const cc = String(row.costCenter ?? "").trim();
  const pc = String(row.profitCenter ?? "").trim();
  const ccpc =
    cc && pc ? `${cc} / ${pc}` : cc || pc || undefined;
  const posting = String(row.postingDate ?? row.documentDate ?? "");
  return {
    entity: "Journal Entry",
    companyCode: String(row.companyCode ?? "") || undefined,
    fiscalYear: int(row.fiscalYear),
    accountingDocument: String(row.accountingDocument ?? ""),
    glAccount: String(row.glAccount ?? ""),
    referenceDocument: String(row.referenceDocument ?? ""),
    costCenterProfitCenter: ccpc,
    transactionCurrency: String(row.transactionCurrency ?? ""),
    amountInTransactionCurrency: num(row.amountInTransactionCurrency),
    companyCodeCurrency: String(row.companyCodeCurrency ?? ""),
    amountInCompanyCodeCurrency: num(row.amountInCompanyCodeCurrency),
    postingDocumentDate: posting,
    accountingDocumentType: String(row.accountingDocumentType ?? ""),
    accountingDocumentItem: int(row.accountingDocumentItem),
    connectionCount,
  };
}

export function getO2CDataRoot(): string {
  return DATA_ROOT;
}

export function isO2CDatasetPresent(): boolean {
  return fs.existsSync(path.join(DATA_ROOT, "journal_entry_items_accounts_receivable"));
}

/**
 * Builds a force-graph from SAP O2C JSONL under `data/sap-o2c-data/`.
 * Nodes: journal entry lines, billing documents, customers (granular overlay).
 */
export function loadO2CGraph(): GraphPayload {
  if (!isO2CDatasetPresent()) {
    return { nodes: [], links: [] };
  }

  const journalRows = readJsonlFiles("journal_entry_items_accounts_receivable");
  const billingRows = readJsonlFiles("billing_document_headers");

  const billingByDoc = new Map<string, JsonlRow>();
  for (const b of billingRows) {
    const id = String(b.billingDocument ?? "");
    if (id) billingByDoc.set(id, b);
  }

  const nodes: GraphNode[] = [];
  const links: GraphLink[] = [];
  const nodeIds = new Set<string>();

  const addNode = (n: GraphNode) => {
    if (nodeIds.has(n.id)) return;
    nodeIds.add(n.id);
    nodes.push(n);
  };

  for (const row of journalRows) {
    const id = jeNodeId(row);
    addNode({
      id,
      group: 1,
      label: "JE",
      granular: false,
      journalEntry: rowToJournalEntry(row, 0),
    });
  }

  const bdIdsNeeded = new Set<string>();
  for (const row of journalRows) {
    const ref = String(row.referenceDocument ?? "");
    if (ref) bdIdsNeeded.add(ref);
  }
  for (const b of billingRows) {
    const id = String(b.billingDocument ?? "");
    if (id) bdIdsNeeded.add(id);
  }

  for (const bd of bdIdsNeeded) {
    const header = billingByDoc.get(bd);
    addNode({
      id: `bd:${bd}`,
      group: 0,
      label: "BD",
      granular: false,
    });
    if (header) {
      const party = String(header.soldToParty ?? "");
      if (party) {
        addNode({
          id: `cust:${party}`,
          group: 1,
          label: "BP",
          granular: true,
        });
        links.push({ source: `bd:${bd}`, target: `cust:${party}` });
      }
    }
  }

  for (const row of journalRows) {
    const jeId = jeNodeId(row);
    const ref = String(row.referenceDocument ?? "");
    if (ref && nodeIds.has(`bd:${ref}`)) {
      links.push({ source: jeId, target: `bd:${ref}` });
    }
  }

  const degree = new Map<string, number>();
  for (const l of links) {
    degree.set(l.source, (degree.get(l.source) ?? 0) + 1);
    degree.set(l.target, (degree.get(l.target) ?? 0) + 1);
  }

  for (const n of nodes) {
    if (!n.journalEntry) continue;
    const d = degree.get(n.id) ?? 0;
    n.journalEntry = {
      ...n.journalEntry,
      connectionCount: d,
    };
  }

  return { nodes, links };
}
