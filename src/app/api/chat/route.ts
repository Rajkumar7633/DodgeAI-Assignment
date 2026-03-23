import { NextResponse } from "next/server";
import { loadO2CGraph } from "@/lib/o2c-graph";
import { runGraphChat } from "@/lib/llm";

type Body = {
  messages?: { role: "user" | "assistant"; content: string }[];
};

function graphContextString() {
  const { nodes } = loadO2CGraph();
  const lines: string[] = [];
  for (const n of nodes) {
    if (!n.journalEntry) continue;
    const j = n.journalEntry;
    lines.push(
      [
        `Node ${n.id}`,
        `Entity: ${j.entity}`,
        `AccountingDocument (journal entry number): ${j.accountingDocument}`,
        `ReferenceDocument (e.g. billing doc): ${j.referenceDocument}`,
        `GLAccount: ${j.glAccount}`,
        `FiscalYear: ${j.fiscalYear}`,
        `AmountInTransactionCurrency: ${j.amountInTransactionCurrency} ${j.transactionCurrency}`,
        `PostingDate: ${j.postingDocumentDate}`,
        `AccountingDocumentType: ${j.accountingDocumentType}`,
        `Connections: ${j.connectionCount}`,
      ].join("\n")
    );
  }
  return lines.join("\n---\n");
}

export async function POST(req: Request) {
  try {
    const body = (await req.json()) as Body;
    const messages = body.messages?.filter((m) => m.content?.trim()) ?? [];
    if (!messages.length) {
      return NextResponse.json(
        { error: "messages required" },
        { status: 400 }
      );
    }
    const ctx = graphContextString();
    const reply = await runGraphChat(messages, ctx);
    return NextResponse.json({ role: "assistant" as const, content: reply });
  } catch (e) {
    const msg = e instanceof Error ? e.message : "Chat failed";
    return NextResponse.json({ error: msg }, { status: 500 });
  }
}
