import { Target, BarChart3, TrendingUp, TrendingDown } from "lucide-react";
import type { Valuation } from "@/entities/session";
import { formatKrwFromEok } from "@/shared/utils/currency";

export function SummaryCard({ valuation }: { valuation: Valuation }) {
  const fairValue = valuation.tree.value;
  const marketCap = valuation.companyMarketCap;
  const upside = ((fairValue - marketCap) / marketCap) * 100;
  const isPositive = upside >= 0;

  return (
    <div className="rounded-2xl border border-zinc-200 bg-white p-6 shadow-sm">
      <div className="mb-1 flex items-center gap-2 text-xs font-bold text-zinc-400 uppercase tracking-wider">
        <span>{valuation.companyCode}</span>
        <span className="h-1 w-1 rounded-full bg-zinc-300" />
        <span>{valuation.methodology}</span>
      </div>
      <h2 className="mb-6 text-2xl font-black text-zinc-900">{valuation.companyName}</h2>

      <div className="grid grid-cols-2 gap-6">
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
            <Target className="h-3.5 w-3.5" />
            적정가치
          </div>
          <div className="text-xl font-bold text-zinc-900">{formatKrwFromEok(fairValue)}</div>
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-1.5 text-xs font-semibold text-zinc-500">
            <BarChart3 className="h-3.5 w-3.5" />
            현재 시총
          </div>
          <div className="text-xl font-bold text-zinc-600">
            {formatKrwFromEok(marketCap)}
          </div>
        </div>
      </div>

      <div className={`mt-6 flex items-center justify-between rounded-xl p-4 ${isPositive ? "bg-emerald-50" : "bg-red-50"}`}>
        <div className="flex flex-col">
          <span className={`text-xs font-bold uppercase tracking-wider ${isPositive ? "text-emerald-700/70" : "text-red-700/70"}`}>
            Potential Upside
          </span>
          <span className="text-sm font-medium text-zinc-500">
            {isPositive ? "현재 저평가 상태" : "현재 고평가 상태"}
          </span>
        </div>
        <div className="flex items-center gap-2">
          <span className={`text-3xl font-black ${isPositive ? "text-emerald-600" : "text-red-600"}`}>
            {isPositive ? "+" : ""}
            {upside.toFixed(1)}%
          </span>
          {isPositive ? (
            <TrendingUp className="h-6 w-6 text-emerald-500" />
          ) : (
            <TrendingDown className="h-6 w-6 text-red-500" />
          )}
        </div>
      </div>
    </div>
  );
}
