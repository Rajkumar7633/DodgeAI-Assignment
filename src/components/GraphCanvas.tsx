"use client";

import dynamic from "next/dynamic";
import { useCallback, useMemo } from "react";
import type { GraphLink, GraphNode } from "@/lib/types";

const ForceGraph2D = dynamic(() => import("react-force-graph-2d"), {
  ssr: false,
  loading: () => (
    <div className="flex h-full items-center justify-center text-sm text-gray-500">
      Loading graph…
    </div>
  ),
});

type FGNode = GraphNode & { x?: number; y?: number };
type FGLink = { source: string | FGNode; target: string | FGNode };

type Props = {
  data: { nodes: GraphNode[]; links: GraphLink[] };
  showGranular: boolean;
  minimized: boolean;
  selectedId: string | null;
  onSelect: (node: GraphNode | null) => void;
};

export function GraphCanvas({
  data,
  showGranular,
  minimized,
  selectedId,
  onSelect,
}: Props) {
  const filtered = useMemo(() => {
    const hide = (n: GraphNode) => n.granular === true && !showGranular;
    const nodes = data.nodes.filter((n) => !hide(n));
    const ids = new Set(nodes.map((n) => n.id));
    const links = data.links.filter(
      (l) => ids.has(l.source) && ids.has(l.target)
    );
    return { nodes, links };
  }, [data, showGranular]);

  const paintRing = useCallback(
    (node: object, ctx: CanvasRenderingContext2D, globalScale: number) => {
      const n = node as FGNode;
      if (n.id !== selectedId) return;
      const r = 7;
      ctx.beginPath();
      ctx.arc(n.x!, n.y!, r + 2 / globalScale, 0, 2 * Math.PI);
      ctx.strokeStyle = "#1d4ed8";
      ctx.lineWidth = 2 / globalScale;
      ctx.stroke();
    },
    [selectedId]
  );

  if (minimized) {
    return (
      <div className="flex h-14 items-center justify-center rounded-lg border border-gray-200 bg-white text-sm text-gray-500">
        Graph minimized — expand to explore
      </div>
    );
  }

  return (
    <div className="relative h-[min(72vh,720px)] w-full overflow-hidden rounded-lg border border-gray-200 bg-white">
      <ForceGraph2D
        graphData={filtered as { nodes: FGNode[]; links: FGLink[] }}
        nodeId="id"
        linkColor={(link) => {
          const l = link as FGLink;
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          if (selectedId && (s === selectedId || t === selectedId)) {
            return "rgba(37, 99, 235, 0.95)";
          }
          return "rgba(148, 163, 184, 0.85)";
        }}
        linkWidth={(link) => {
          const l = link as FGLink;
          const s = typeof l.source === "object" ? l.source.id : l.source;
          const t = typeof l.target === "object" ? l.target.id : l.target;
          if (selectedId && (s === selectedId || t === selectedId)) {
            return 2.2;
          }
          return 0.6;
        }}
        nodeRelSize={4}
        nodeVal={() => 1}
        nodeLabel="id"
        nodeColor={(n) => ((n as FGNode).group === 0 ? "#f87171" : "#93c5fd")}
        onNodeClick={(n) => onSelect(n as GraphNode)}
        onBackgroundClick={() => onSelect(null)}
        nodeCanvasObjectMode={() => "after"}
        nodeCanvasObject={paintRing}
        cooldownTicks={120}
        enableNodeDrag
      />
    </div>
  );
}
