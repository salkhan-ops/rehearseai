"use client";

import { useMemo, useState } from "react";
import ReactFlow, { Background, Controls, Edge, Node } from "reactflow";
import "reactflow/dist/style.css";
import type { ReasoningTree } from "@/lib/types";
import { ChartShell } from "./ChartShell";

export function DecisionTreeDiagram({ tree }: { tree: ReasoningTree }) {
  const [expanded, setExpanded] = useState(true);

  const { nodes, edges } = useMemo(() => {
    const root: Node = {
      id: "root",
      position: { x: 320, y: 20 },
      data: { label: tree.rootNode },
      style: { borderRadius: 18, border: "1px solid #cbd5e1", padding: 12, width: 280, fontSize: 12, fontWeight: 600 },
    };

    const branchNodes: Node[] = expanded
      ? tree.branches.map((branch, index) => ({
          id: branch.id,
          position: { x: index * 220, y: 180 },
          data: { label: `${branch.label}\n${branch.consequence}` },
          style: {
            borderRadius: 18,
            border: branch.quality === "strong" ? "1px solid #0f766e" : branch.quality === "weak" ? "1px solid #f59e0b" : "1px solid #e11d48",
            padding: 12,
            width: 200,
            fontSize: 11,
            background: "#fff",
            boxShadow: "0 14px 38px rgba(35,45,75,0.08)",
          },
        }))
      : [];

    const visibleEdges: Edge[] = expanded
      ? tree.branches.map((branch) => ({
          id: `root-${branch.id}`,
          source: "root",
          target: branch.id,
          animated: true,
          style: { stroke: branch.quality === "strong" ? "#0f766e" : "#6200a8" },
        }))
      : [];

    return { nodes: [root, ...branchNodes], edges: visibleEdges };
  }, [expanded, tree]);

  return (
    <ChartShell title="Decision Pathway" insight={tree.question}>
      <div className="mb-3 flex justify-end">
        <button
          type="button"
          onClick={() => setExpanded((value) => !value)}
          className="rounded-full bg-violet-50 px-4 py-2 text-sm font-semibold text-violet-700 ring-1 ring-violet-100 transition hover:bg-violet-100 dark:bg-white/10 dark:text-violet-100 dark:ring-white/10"
        >
          {expanded ? "Collapse branches" : "Expand branches"}
        </button>
      </div>
      <div className="h-[360px] overflow-hidden rounded-2xl bg-slate-50 ring-1 ring-slate-200 dark:bg-white/10 dark:ring-white/10">
        <ReactFlow nodes={nodes} edges={edges} fitView minZoom={0.45} maxZoom={1.6} nodesDraggable={false}>
          <Background />
          <Controls />
        </ReactFlow>
      </div>
    </ChartShell>
  );
}
