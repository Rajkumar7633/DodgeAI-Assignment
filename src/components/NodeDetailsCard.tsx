import type { GraphNode } from "@/lib/types";

type Props = {
  node: GraphNode;
  connectionCount: number;
  onClose: () => void;
};

function nodeKind(node: GraphNode): string {
  if (node.journalEntry) return "Journal Entry";
  if (node.id.startsWith("bd:")) return "Billing Document";
  if (node.id.startsWith("cust:")) return "Business Partner";
  return "Graph Node";
}

export function NodeDetailsCard({ node, connectionCount, onClose }: Props) {
  const fields: [string, string | number][] = [
    ["Node ID", node.id],
    ["Type", nodeKind(node)],
    ["Label", node.label],
    ["Group", node.group],
    ["Granular", node.granular ? "Yes" : "No"],
    ["Connections", connectionCount],
  ];

  return (
    <div className="pointer-events-auto w-[min(92vw,340px)] rounded-lg border border-gray-200 bg-white p-4 shadow-lg">
      <div className="mb-2 flex items-start justify-between gap-2">
        <div>
          <p className="text-[11px] font-medium uppercase tracking-wide text-gray-400">
            Entity
          </p>
          <p className="text-sm font-semibold text-gray-900">{nodeKind(node)}</p>
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
    </div>
  );
}
