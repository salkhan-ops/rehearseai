"use client";

import ReactFlow, { Background, Controls, type Edge, type Node } from "reactflow";
import type { Session } from "@/lib/types";

export function ConversationMap({ session }: { session: Session }) {
  const nodes: Node[] = [
    { id: "topic", position: { x: 0, y: 0 }, data: { label: session.topic || "Topic" }, type: "input" },
    { id: "question", position: { x: 0, y: 95 }, data: { label: "Initial question" } },
    { id: "objection", position: { x: -165, y: 195 }, data: { label: "Possible objection" } },
    { id: "reasoning", position: { x: 165, y: 195 }, data: { label: "Your reasoning" } },
    { id: "counter", position: { x: -40, y: 300 }, data: { label: "Counterargument" } },
    { id: "response", position: { x: -40, y: 405 }, data: { label: "Response structure" } },
    { id: "resolution", position: { x: -40, y: 510 }, data: { label: "Resolution" }, type: "output" },
  ].map((node) => ({
    ...node,
    className: "rounded-2xl border border-cyan-100/20 bg-slate-950/85 px-3 py-2 text-sm font-semibold text-white shadow-[0_14px_40px_rgba(34,211,238,0.12)]",
  }));
  const edges: Edge[] = [
    ["topic", "question"],
    ["question", "objection"],
    ["question", "reasoning"],
    ["objection", "counter"],
    ["reasoning", "counter"],
    ["counter", "response"],
    ["response", "resolution"],
  ].map(([source, target]) => ({ id: `${source}-${target}`, source, target, animated: true, style: { stroke: "#67e8f9" } }));

  return (
    <section className="h-[28rem] overflow-hidden rounded-[1.5rem] bg-white/[0.07] ring-1 ring-white/12 backdrop-blur-2xl">
      <ReactFlow nodes={nodes} edges={edges} fitView nodesDraggable={false} nodesConnectable={false} panOnScroll={false}>
        <Background color="rgba(255,255,255,0.12)" gap={22} />
        <Controls showInteractive={false} />
      </ReactFlow>
    </section>
  );
}
