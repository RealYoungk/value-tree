import type { Valuation } from "@/lib/schemas";

function formatNumber(value: number): string {
  if (Math.abs(value) >= 10000) {
    return `${(value / 10000).toFixed(1)}조원`;
  }
  return `${value.toLocaleString("ko-KR")}억원`;
}

export function SummaryCard({ valuation }: { valuation: Valuation }) {
  const fairValue = valuation.tree.value;
  const marketCap = valuation.companyMarketCap;
  const upside = ((fairValue - marketCap) / marketCap) * 100;
  const isPositive = upside >= 0;

  return (
    <div className="rounded-xl border border-zinc-200 bg-white p-6">
      <div className="mb-1 text-sm text-zinc-500">
        {valuation.companyCode} · {valuation.methodology}
      </div>
      <h2 className="mb-4 text-xl font-bold">{valuation.companyName}</h2>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <div className="text-xs text-zinc-400">적정가치</div>
          <div className="text-lg font-semibold">{formatNumber(fairValue)}</div>
        </div>
        <div>
          <div className="text-xs text-zinc-400">현재 시총</div>
          <div className="text-lg font-semibold text-zinc-600">
            {formatNumber(marketCap)}
          </div>
        </div>
      </div>

      <div className="mt-4 border-t border-zinc-100 pt-4">
        <span
          className={`text-2xl font-bold ${isPositive ? "text-emerald-600" : "text-red-500"}`}
        >
          {isPositive ? "+" : ""}
          {upside.toFixed(1)}%
        </span>
        <span className="ml-2 text-sm text-zinc-400">
          {isPositive ? "저평가" : "고평가"}
        </span>
      </div>
    </div>
  );
}
