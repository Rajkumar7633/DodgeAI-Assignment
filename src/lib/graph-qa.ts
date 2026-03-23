import { loadO2CGraph } from "./o2c-graph";

/**
 * Deterministic answers from loaded graph data (no LLM).
 * Used when no API key is configured or as fallback on LLM errors.
 */
export function answerFromDataset(userMessage: string): string | null {
  const q = userMessage.trim();
  if (!q) return null;

  const { nodes } = loadO2CGraph();
  const jes = nodes
    .map((n) => n.journalEntry)
    .filter((j): j is NonNullable<typeof j> => Boolean(j));

  if (jes.length === 0) {
    return null;
  }

  const nums = q.match(/\d{6,}/g) ?? [];
  const lowered = q.toLowerCase();

  for (const num of nums) {
    const byRef = jes.find((j) => j.referenceDocument === num);
    if (byRef) {
      return `From the loaded data: accounting document (journal entry number) for reference document ${num} is ${byRef.accountingDocument}.`;
    }
    const byAcct = jes.find((j) => j.accountingDocument === num);
    if (byAcct) {
      return `From the loaded data: reference document linked to accounting document ${num} is ${byAcct.referenceDocument}.`;
    }
  }

  if (
    lowered.includes("journal") &&
    (lowered.includes("how many") || lowered.includes("count"))
  ) {
    return `From the loaded data: there are ${jes.length} journal entry line(s) in the graph.`;
  }

  if (
    lowered.includes("billing") &&
    (lowered.includes("how many") || lowered.includes("count"))
  ) {
    const bd = new Set(
      nodes.filter((n) => n.id.startsWith("bd:")).map((n) => n.id.slice(3))
    );
    return `From the loaded data: there are ${bd.size} billing document node(s) in the graph.`;
  }

  return null;
}

export function noLlmConfiguredMessage(): string {
  return (
    "No LLM API key is configured for the selected provider. Add keys in .env. " +
    "You can still explore the graph by clicking nodes, or ask about a specific document number (6+ digits) for a lookup from the dataset."
  );
}
