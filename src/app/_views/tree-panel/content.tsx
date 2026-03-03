import type { Valuation, TreeNode } from "@/entities/session";
import { SummaryCard } from "./summary-card";
import { ValuationTree } from "./valuation-tree";
import { Disclaimer } from "./disclaimer";

interface TreePanelContentViewProps {
  valuation: Valuation | null;
  onClose: () => void;
}

export function TreePanelContentView({
  valuation,
  onClose,
}: TreePanelContentViewProps) {
  if (valuation) {
    return (
      <>
        <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
          <div>
            <h2 className="font-semibold">
              {valuation.companyName}
            </h2>
            <p className="text-xs text-zinc-500">
              {valuation.methodology} ·{" "}
              {valuation.companyCode}
            </p>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="lg:hidden shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
          >
            <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
              <path d="M4 4l10 10M14 4L4 14" />
            </svg>
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
          <SummaryCard valuation={valuation} />
          <ValuationTree tree={valuation.tree as TreeNode} />
          <Disclaimer />
        </div>
      </>
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
