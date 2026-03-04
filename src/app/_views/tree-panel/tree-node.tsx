"use client";

import { ChevronDown, ChevronRight, Calculator, Database, Lightbulb, Info } from "lucide-react";
import type { TreeNode as TreeNodeType } from "@/entities/session";
import { formatValueByUnit } from "@/shared/utils/currency";

interface TreeNodeProps {
  node: TreeNodeType;
  level: number;
  expanded: Set<string>;
  onToggle: (id: string) => void;
  onShowDetail: (node: TreeNodeType) => void;
  selectedDetailId?: string;
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

export function TreeNode({ node, level, expanded, onToggle, onShowDetail, selectedDetailId }: TreeNodeProps) {
  const hasChildren = node.children && node.children.length > 0;
  const isExpanded = expanded.has(node.id);
  const isSelected = selectedDetailId === node.id;
  const kind = getNodeKind(node);
  const badge = kindBadge[kind];
  const KindIcon = badge.icon;

  return (
    <div className={level > 0 ? "ml-4 border-l border-zinc-200 pl-3" : ""}>
      <div 
        className={`group flex items-center justify-between rounded-lg px-2 py-1.5 transition-all hover:bg-zinc-100/80 ${
          isSelected ? "bg-zinc-100 ring-1 ring-zinc-200" : ""
        }`}
      >
        <button
          type="button"
          onClick={() => hasChildren && onToggle(node.id)}
          className={`flex flex-1 items-start gap-2 text-left ${hasChildren ? "cursor-pointer" : "cursor-default"}`}
        >
          <div className="mt-1 flex h-4 w-4 shrink-0 items-center justify-center">
            {hasChildren && (
              isExpanded ? <ChevronDown className="h-3.5 w-3.5 text-zinc-400" /> : <ChevronRight className="h-3.5 w-3.5 text-zinc-400" />
            )}
          </div>
          <div className="min-w-0 flex-1">
            <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
              <span className="font-semibold text-zinc-900 break-words">{node.name}</span>
              <span className="text-sm font-medium text-zinc-500 whitespace-nowrap">
                = {formatValueByUnit(node.value, node.unit)}
              </span>
              <span
                className={`inline-flex items-center gap-1 rounded-md px-1.5 py-0.5 text-[10px] font-bold ring-1 ring-inset shrink-0 ${badge.className}`}
              >
                <KindIcon className="h-2.5 w-2.5" />
                {badge.label}
              </span>
            </div>
            {node.formula && (
              <div className="mt-1 font-mono text-[10px] text-zinc-400 break-words whitespace-normal leading-relaxed">
                {node.formula}
              </div>
            )}
          </div>
        </button>

        {/* Detail Action */}
        <button
          type="button"
          onClick={(e) => {
            e.stopPropagation();
            onShowDetail(node);
          }}
          className={`ml-2 flex h-7 w-7 items-center justify-center rounded-md transition-colors ${
            isSelected 
              ? "bg-zinc-900 text-white" 
              : "text-zinc-400 hover:bg-zinc-200 hover:text-zinc-600"
          }`}
          title="상세 근거 보기"
        >
          <Info className="h-4 w-4" />
        </button>
      </div>

      {hasChildren && isExpanded && (
        <div className="mt-0.5 space-y-0.5">
          {node.children!.map((child) => (
            <TreeNode
              key={child.id}
              node={child as TreeNodeType}
              level={level + 1}
              expanded={expanded}
              onToggle={onToggle}
              onShowDetail={onShowDetail}
              selectedDetailId={selectedDetailId}
            />
          ))}
        </div>
      )}
    </div>
  );
}
