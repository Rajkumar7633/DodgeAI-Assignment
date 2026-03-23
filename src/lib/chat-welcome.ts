/** First assistant message — only uses live `/api/graph` response, no fixed business numbers. */
export function assistantWelcomeFromGraphApi(d: {
  datasetPresent?: boolean;
  stats?: {
    nodeCount: number;
    linkCount: number;
    journalEntryNodes: number;
  };
}): string {
  if (d.datasetPresent === false) {
    return "SAP O2C dataset not found. Extract the archive into data/sap-o2c-data at the project root.";
  }
  const s = d.stats;
  if (!s || s.nodeCount === 0) {
    return "No graph was built from the dataset. Check that data/sap-o2c-data contains journal and billing JSONL files.";
  }
  return `Order to Cash graph loaded from your dataset: ${s.nodeCount} nodes, ${s.linkCount} links, ${s.journalEntryNodes} journal entry lines. Click nodes for details, or ask about billing or accounting document numbers.`;
}
