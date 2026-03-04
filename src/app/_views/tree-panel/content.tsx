"use client";

import { useState } from "react";
import { X, ExternalLink, Lightbulb } from "lucide-react";
import type { Valuation, TreeNode as TreeNodeType } from "@/entities/session";
import { SummaryCard } from "./summary-card";
import { ValuationTree } from "./valuation-tree";
import { Disclaimer } from "./disclaimer";
import { SourceList } from "./source-list";

interface TreePanelContentViewProps {
  valuation: Valuation | null;
  onClose: () => void;
}

export function TreePanelContentView({
  valuation,
  onClose,
}: TreePanelContentViewProps) {
  const [selectedNode, setSelectedNode] = useState<TreeNodeType | null>(null);

  if (valuation) {
    return (
      <div className="flex flex-col h-full relative overflow-hidden bg-white">
        {/* Header */}
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3 shrink-0 bg-white z-10">
          <div>
            <h2 className="font-semibold text-zinc-900">
              {valuation.companyName}
            </h2>
            <p className="text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
              {valuation.methodology} · {valuation.companyCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <X className="h-4.5 w-4.5" />
          </button>
        </div>

        {/* Scrollable Content */}
        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6 scrollbar-hide pb-32">
          <SummaryCard valuation={valuation} />
          <ValuationTree 
            tree={valuation.tree as TreeNodeType} 
            selectedNode={selectedNode}
            onSelectNode={setSelectedNode}
          />
          <Disclaimer />
        </div>

        {/* Fixed Detail Panel Overlay */}
        {selectedNode && (
          <div className="absolute bottom-0 left-0 right-0 z-30 p-4 bg-gradient-to-t from-white via-white/80 to-transparent pt-12 pointer-events-none">
            <div className="rounded-2xl border border-zinc-200 bg-white p-5 shadow-[0_-8px_30px_rgb(0,0,0,0.12)] animate-in fade-in slide-in-from-bottom-4 duration-300 pointer-events-auto">
              <div className="mb-4 flex items-start justify-between">
                <div className="flex items-center gap-2">
                  <div className="flex h-8 w-8 items-center justify-center rounded-lg bg-zinc-900 text-white">
                    <Lightbulb className="h-4 w-4" />
                  </div>
                  <div>
                    <h4 className="text-sm font-bold text-zinc-900">{selectedNode.name}</h4>
                    <p className="text-[10px] font-medium text-zinc-400 uppercase tracking-wider">Detail Analysis</p>
                  </div>
                </div>
                <button
                  type="button"
                  onClick={() => setSelectedNode(null)}
                  className="rounded-full p-1 text-zinc-400 hover:bg-zinc-100 hover:text-zinc-600 transition-colors"
                >
                  <X className="h-4 w-4" />
                </button>
              </div>

              <div className="max-h-[30vh] overflow-y-auto space-y-4 pr-1">
                {selectedNode.description && (
                  <div className="text-sm leading-relaxed text-zinc-600">
                    {selectedNode.description}
                  </div>
                )}

                {selectedNode.sources.length > 0 && (
                  <div className="pt-4 border-t border-zinc-100">
                    <div className="mb-2 flex items-center gap-1.5 text-[10px] font-bold text-zinc-400 uppercase tracking-widest">
                      <ExternalLink className="h-3 w-3" />
                      Sources
                    </div>
                    <SourceList sources={selectedNode.sources} />
                  </div>
                )}
              </div>
            </div>
          </div>
        )}
      </div>
    );
  }

  return (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="rounded-2xl bg-zinc-50 p-6">
        <svg
          className="mx-auto mb-4 text-zinc-300"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <path d="m7 16 4-8 4 4 4-6" />
        </svg>
        <p className="text-sm font-medium text-zinc-400">
          밸류에이션 트리
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          회사명을 입력하면 여기에 분석 결과가 표시됩니다
        </p>
      </div>
    </div>
  );
}
