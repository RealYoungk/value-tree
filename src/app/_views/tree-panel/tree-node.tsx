"use client";

import type { TreeNode as TreeNodeType } from "@/entities/session";
import { SourceList } from "./source-list";

interface TreeNodeProps {
  node: TreeNodeType;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}

function formatValue(value: number, unit: string): string {
  if (unit === "억원" && Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(1)}조원`;
  }
  if (unit === "억원") {
    return `${value.toLocaleString("ko-KR")}억원`;
  }
  return `${value.toLocaleString("ko-KR")}${unit}`;
}

type NodeKind = "formula" | "data" | "assumption";

function getNodeKind(node: TreeNodeType): NodeKind {
  if (node.formula != null) return "formula";
  if (node.sources.length > 0) return "data";
  return "assumption";
}

const kindBadge: Record<NodeKind, { label: string; className: string }> = {
  formula: { label: "수식", className: "bg-blue-50 text-blue-600" },
  data: { label: "데이터", className: "bg-emerald-50 text-emerald-600" },
  assumption: { label: "가정", className: "bg-amber-50 text-amber-600" },
};

export function TreeNode({ node, level, expanded, onToggle }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const kind = getNodeKind(node);
  const badge = kindBadge[kind];

  return (
    <div className={level > 0 ? "ml-4 border-l border-zinc-200 pl-3" : ""}>
      <button
        type="button"
        onClick={() => hasChildren && onToggle(node.id)}
        className={`w-full text-left ${hasChildren ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="group rounded-lg px-3 py-2 transition-colors hover:bg-zinc-100">
          <div className="flex items-start gap-2">
            {hasChildren && (
              <span className="mt-0.5 text-xs text-zinc-400">
                {isExpanded ? "▼" : "▶"}
              </span>
            )}
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-baseline gap-x-2">
                <span className="font-medium">{node.name}</span>
                <span className="text-sm text-zinc-500">
                  = {formatValue(node.value, node.unit)}
                </span>
                <span
                  className={`rounded px-1.5 py-0.5 text-[10px] font-medium ${badge.className}`}
                >
                  {badge.label}
                </span>
              </div>
              {node.formula && (
                <div className="mt-0.5 text-xs text-zinc-400">
                  = {node.formula}
                </div>
              )}
              {node.description && (
                <div className="mt-0.5 text-xs text-zinc-500">
                  {node.description}
                </div>
              )}
              {node.sources.length > 0 && <SourceList sources={node.sources} />}
            </div>
          </div>
        </div>
      </button>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-1">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child as TreeNodeType}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
            />
          ))}
        </div>
      )}
    </div>
  );
}
