"use client";

import {
  Background,
  BackgroundVariant,
  Handle,
  Position,
  ReactFlow,
  type Edge,
  type Node,
  type NodeProps,
} from "@xyflow/react";
import { memo, useMemo } from "react";
import type { CheckRecord, NodeState } from "@/lib/types";

type FlowNodeData = {
  index: string;
  title: string;
  detail: string;
  state: NodeState;
};

function stateClass(state: NodeState) {
  if (state === "locked") return "slot-dashed text-[var(--muted)]";
  if (state === "running") return "glow-active bg-white";
  if (state === "done") return "glow-done bg-white";
  return "bg-white border border-[var(--line)]";
}

function WorkflowNode({ data }: NodeProps<Node<FlowNodeData>>) {
  return (
    <div className={`w-[220px] rounded-2xl p-3 ${stateClass(data.state)}`}>
      <Handle type="target" position={Position.Left} className="!h-2.5 !w-2.5 !bg-[var(--green)]" />
      <p className="font-mono text-[10px] tracking-widest text-[var(--muted)]">{data.index}</p>
      <p className="mt-1 text-sm font-semibold">{data.title}</p>
      <p className="mt-1 text-xs leading-5 text-[var(--muted)]">{data.detail}</p>
      <div className="mt-3 h-1.5 overflow-hidden rounded-full bg-[var(--line)]">
        <div
          className="h-full bg-[var(--green)] transition-all"
          style={{
            width: data.state === "done" ? "100%" : data.state === "running" ? "55%" : "0%",
          }}
        />
      </div>
      <Handle type="source" position={Position.Right} className="!h-2.5 !w-2.5 !bg-[var(--green)]" />
    </div>
  );
}

const nodeTypes = { workflow: memo(WorkflowNode) };

function nodeState(check: CheckRecord, step: number, running: string | null): NodeState {
  const paid = Boolean(check.payload.entitlementActive) && check.status === "unlocked";
  if (step >= 3 && !paid && check.status !== "unlocked") {
    if (running === `0${step}`) return "running";
    return "locked";
  }
  if (running === `0${step}`) return "running";
  if (step <= 2 && check.payload.firstLook) return "done";
  if (step === 3 && check.payload.gap && paid) return "done";
  if (step === 4 && check.payload.followUp) return "done";
  if (step === 5 && check.payload.brief) return "done";
  return "idle";
}

export default function CheckCanvas({
  check,
  running,
}: {
  check: CheckRecord | null;
  running: string | null;
}) {
  const nodes: Node<FlowNodeData>[] = useMemo(() => {
    if (!check) return [];
    const items: Array<{ id: string; title: string; detail: string; step: number; x: number }> = [
      {
        id: "1",
        title: "Look up",
        detail: check.payload.firstLook
          ? `${check.payload.firstLook.sources.length} sources`
          : "Linkup search 1",
        step: 1,
        x: 0,
      },
      {
        id: "2",
        title: "Save findings",
        detail: check.payload.firstLook ? "Stored on your account" : "Persist sources",
        step: 2,
        x: 260,
      },
      {
        id: "3",
        title: "Find the gap",
        detail: check.payload.gap?.label || "Locked until second look",
        step: 3,
        x: 520,
      },
      {
        id: "4",
        title: "Follow-up",
        detail: check.payload.followUp
          ? `${check.payload.followUp.sources.length} sources`
          : "Linkup search 2",
        step: 4,
        x: 780,
      },
      {
        id: "5",
        title: "Brief",
        detail: check.payload.brief?.verdict || "Nebius writes the receipt",
        step: 5,
        x: 1040,
      },
    ];
    return items.map((item) => ({
      id: item.id,
      type: "workflow",
      position: { x: item.x, y: 40 },
      data: {
        index: `#0${item.step}`,
        title: item.title,
        detail: item.detail,
        state: nodeState(check, item.step, running),
      },
      draggable: false,
    }));
  }, [check, running]);

  const edges: Edge[] = useMemo(
    () =>
      [
        ["1", "2"],
        ["2", "3"],
        ["3", "4"],
        ["4", "5"],
      ].map(([source, target]) => ({
        id: `${source}-${target}`,
        source,
        target,
        type: "smoothstep",
        style: { stroke: "#1f6b4a", strokeWidth: 1.5 },
      })),
    [],
  );

  return (
    <div className="h-[280px] overflow-hidden rounded-2xl border border-[var(--line)] bg-[#f3eee5]">
      <ReactFlow
        nodes={nodes}
        edges={edges}
        nodeTypes={nodeTypes}
        fitView
        panOnDrag
        zoomOnScroll={false}
        nodesConnectable={false}
        proOptions={{ hideAttribution: true }}
      >
        <Background variant={BackgroundVariant.Dots} gap={18} size={1.4} color="#c9c1b3" />
      </ReactFlow>
    </div>
  );
}
