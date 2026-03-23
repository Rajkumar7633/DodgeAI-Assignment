import { NextResponse } from "next/server";
import { isO2CDatasetPresent, loadO2CGraph } from "@/lib/o2c-graph";

export async function GET() {
  const { nodes, links } = loadO2CGraph();
  const present = isO2CDatasetPresent();
  const journalNodes = nodes.filter((n) => n.journalEntry).length;
  return NextResponse.json({
    nodes,
    links,
    datasetPresent: present,
    stats: {
      nodeCount: nodes.length,
      linkCount: links.length,
      journalEntryNodes: journalNodes,
    },
  });
}
