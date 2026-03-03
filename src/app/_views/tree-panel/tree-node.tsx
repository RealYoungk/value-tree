"use client";

import { ChevronDown, ChevronRight, Calculator, Database, Lightbulb } from "lucide-react";
import type { TreeNode as TreeNodeType } from "@/entities/session";
import { formatValueByUnit } from "@/shared/utils/currency";
import { SourceList } from "./source-list";

interface TreeNodeProps {
  node: TreeNodeType;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
}

type NodeKind = "formula" | "data" | "assumption";

function getNodeKind(node: TreeNodeType): NodeKind {
  if (node.formula != null) return "formula";
  if (node.sources.length > 0) return "data";
  return "assumption";
}

const kindBadge: Record<NodeKind, { label: string; icon: any; className: string }> = {
  formula: { label: "수식", icon: Calculator, className: "bg-blue-50 text-blue-600 ring-blue-500/10" },
  data: { label: "데이터", icon: Database, className: "bg-emerald-50 text-emerald-600 ring-emerald-500/10" },
  assumption: { label: "가정", icon: Lightbulb, className: "bg-amber-50 text-amber-600 ring-amber-500/10" },
};

export function TreeNode({ node, level, expanded, onToggle }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const kind = getNodeKind(node);
  const badge = kindBadge[kind];
  const KindIcon = badge.icon;

  return (
    <div className={level > 0 ? "ml-4 border-l border-zinc-200 pl-3" : ""}>
      <button
        type="button"
        onClick={() => hasChildren && onToggle(node.id)}
        className={`w-full text-left ${hasChildren ? "cursor-pointer" : "cursor-default"}`}
      >
        <div className="group rounded-lg px-2 py-2 transition-all hover:bg-zinc-100/80">
          <div className="flex items-start gap-2">
            <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
              {hasChildren && (
                isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
              )}
            </div>
            <div className="min-w-0 flex-1">
              <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                <span className="font-semibold text-zinc-900">{node.name}</span>
                <span className="text-sm font-medium text-zinc-500">
                  = {formatValueByUnit(node.value, node.unit)}
                </span>
                <span
                  className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset ${badge.className}`}
                >
                  <KindIcon className="h-2.5 w-2.5" />
                  {badge.label}
                </span>
              </div>
              {node.formula && (
                <div className="mt-1 font-mono text-[11px] text-zinc-400">
                  {node.formula}
                </div>
              )}
              {node.description && (
                <div className="mt-1 text-xs leading-relaxed text-zinc-500">
                  {node.description}
                </div>
              )}
              {node.sources.length > 0 && (
                <div className="mt-2">
                  <SourceList sources={node.sources} />
                </div>
              )}
            </div>
          </div>
        </div>
      </button>

      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-0.5">
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
