"use client";

import { useCallback, useEffect, useState } from "react";
import { ChatSidebar, type ChatMessage } from "@/components/ChatSidebar";
import { GraphCanvas } from "@/components/GraphCanvas";
import { JournalEntryCard } from "@/components/JournalEntryCard";
import { NodeDetailsCard } from "@/components/NodeDetailsCard";
import { assistantWelcomeFromGraphApi } from "@/lib/chat-welcome";
import type { GraphLink, GraphNode } from "@/lib/types";

export default function Home() {
  const [graph, setGraph] = useState<{
    nodes: GraphNode[];
    links: GraphLink[];
  }>({ nodes: [], links: [] });
  const [datasetPresent, setDatasetPresent] = useState(true);
  const [graphStats, setGraphStats] = useState<{
    nodeCount: number;
    linkCount: number;
    journalEntryNodes: number;
  } | null>(null);
  const [selected, setSelected] = useState<GraphNode | null>(null);
  const [minimized, setMinimized] = useState(false);
  const [showGranular, setShowGranular] = useState(true);
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [graphInitializing, setGraphInitializing] = useState(true);
  const [busy, setBusy] = useState(false);

  const selectedConnectionCount = selected
    ? graph.links.reduce((acc, l) => {
        if (l.source === selected.id || l.target === selected.id) return acc + 1;
        return acc;
      }, 0)
    : 0;

  useEffect(() => {
    void fetch("/api/graph")
      .then((r) => r.json())
      .then((d) => {
        setGraph({ nodes: d.nodes || [], links: d.links || [] });
        setDatasetPresent(d.datasetPresent !== false);
        if (d.stats && typeof d.stats.nodeCount === "number") {
          setGraphStats(d.stats);
        } else {
          setGraphStats(null);
        }
        setMessages([
          {
            role: "assistant",
            content: assistantWelcomeFromGraphApi(d),
          },
        ]);
      })
      .catch(() => {
        setDatasetPresent(false);
        setGraphStats(null);
        setMessages([
          {
            role: "assistant",
            content:
              "Could not load the graph from the server. Check that data/sap-o2c-data exists and try npm run dev:clean.",
          },
        ]);
      })
      .finally(() => {
        setGraphInitializing(false);
      });
  }, []);

  const sendChat = useCallback(async (text: string) => {
    const nextMessages: ChatMessage[] = [
      ...messages,
      { role: "user", content: text },
    ];
    setMessages(nextMessages);
    setBusy(true);
    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ messages: nextMessages }),
      });
      const data = (await res.json()) as { content?: string; error?: string };
      const reply =
        data.content ||
        data.error ||
        "Something went wrong. Check API configuration.";
      setMessages((m) => [...m, { role: "assistant", content: reply }]);
    } finally {
      setBusy(false);
    }
  }, [messages]);

  return (
    <div className="flex min-h-screen flex-col">
      <header className="border-b border-gray-200 bg-white px-6 py-4">
        <p className="text-sm text-gray-900">
          <span className="text-gray-500">Mapping</span>
          <span className="mx-1.5 text-gray-300">/</span>
          <span className="font-semibold">Order to Cash</span>
        </p>
        {!datasetPresent && (
          <p className="mt-2 flex items-start gap-2 rounded-md border border-amber-200 bg-amber-50 px-3 py-2 text-xs text-amber-900">
            <span aria-hidden>⚠</span>
            <span>
              SAP O2C dataset not found. Place the extracted{" "}
              <code className="rounded bg-amber-100 px-1">data/sap-o2c-data</code>{" "}
              folder in the project root (from the zip in Google Drive).
            </span>
          </p>
        )}
      </header>

      <div className="flex min-h-0 flex-1 flex-col lg:flex-row">
        <main className="relative min-h-0 min-w-0 flex-1 p-4 lg:flex-[3] lg:p-6">
          <div className="mb-3 flex flex-wrap items-center gap-2">
            <button
              type="button"
              onClick={() => setMinimized((v) => !v)}
              className="inline-flex items-center gap-2 rounded-md border border-gray-200 bg-white px-3 py-1.5 text-xs font-medium text-gray-800 shadow-sm hover:bg-gray-50"
            >
              <span aria-hidden>⤢</span>
              {minimized ? "Expand" : "Minimize"}
            </button>
            <button
              type="button"
              onClick={() => setShowGranular((v) => !v)}
              className={`inline-flex items-center gap-2 rounded-md border px-3 py-1.5 text-xs font-medium shadow-sm ${
                showGranular
                  ? "border-gray-900 bg-gray-900 text-white hover:bg-gray-800"
                  : "border-gray-200 bg-white text-gray-800 hover:bg-gray-50"
              }`}
            >
              <span aria-hidden>▥</span>
              {showGranular ? "Hide Granular Overlay" : "Show Granular Overlay"}
            </button>
            {datasetPresent && graphStats && graphStats.nodeCount > 0 && (
              <span className="text-xs text-gray-500">
                Loaded from{" "}
                <span className="font-mono text-gray-700">data/sap-o2c-data</span>
                : {graphStats.nodeCount} nodes, {graphStats.linkCount} links (
                {graphStats.journalEntryNodes} journal lines)
              </span>
            )}
          </div>

          <div className="relative">
            <GraphCanvas
              data={graph}
              showGranular={showGranular}
              minimized={minimized}
              selectedId={selected?.id ?? null}
              onSelect={setSelected}
            />
            {selected?.journalEntry && (
              <div className="pointer-events-none absolute left-4 top-4 z-10">
                <JournalEntryCard
                  entry={selected.journalEntry}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}
            {selected && !selected.journalEntry && (
              <div className="pointer-events-none absolute left-4 top-4 z-10">
                <NodeDetailsCard
                  node={selected}
                  connectionCount={selectedConnectionCount}
                  onClose={() => setSelected(null)}
                />
              </div>
            )}
          </div>
        </main>

        <div className="h-[min(520px,50vh)] w-full shrink-0 lg:h-auto lg:min-h-0 lg:min-w-[300px] lg:max-w-[420px] lg:flex-[1]">
          <ChatSidebar
            messages={messages}
            onSend={sendChat}
            busy={busy}
            initializing={graphInitializing}
          />
        </div>
      </div>
    </div>
  );
}
