import { useSessionStore } from "@/entities/session";
import type { Valuation } from "@/entities/session";

interface SessionsSidebarContentViewProps {
  onSelectSession: (id: string, hasValuation: boolean) => void;
  onNewSession: () => void;
}

function calcUpside(v: Valuation) {
  return ((v.tree.value - v.companyMarketCap) / v.companyMarketCap) * 100;
}

export function SessionsSidebarContentView({
  onSelectSession,
  onNewSession,
}: SessionsSidebarContentViewProps) {
  const sessions = useSessionStore((s) => s.sessions);
  const activeSessionId = useSessionStore((s) => s.activeSessionId);

  return (
    <>
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-lg font-bold tracking-tight">ValuTree</h1>
        <button
          type="button"
          onClick={onNewSession}
          className="rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-200 hover:text-zinc-600"
          title="새 분석"
        >
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M8 3v10M3 8h10" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-2">
        {sessions.length > 0 ? (
          sessions.map((session) => {
            const isActive = session.id === activeSessionId;
            const upside = session.valuation ? calcUpside(session.valuation) : null;
            return (
              <button
                key={session.id}
                type="button"
                onClick={() => onSelectSession(session.id, session.valuation != null)}
                className={`mb-0.5 flex w-full items-center justify-between rounded-lg px-3 py-2.5 text-left transition-colors ${
                  isActive
                    ? "bg-white shadow-sm ring-1 ring-zinc-200"
                    : "hover:bg-white"
                }`}
              >
                <div className="min-w-0">
                  <div className={`text-sm font-medium truncate ${isActive ? "text-zinc-900" : "text-zinc-600"}`}>
                    {session.companyName}
                  </div>
                  {session.valuation && (
                    <div className="text-xs text-zinc-400">
                      {session.valuation.methodology}
                    </div>
                  )}
                </div>
                {upside != null && (
                  <div
                    className={`shrink-0 ml-2 text-xs font-medium ${upside >= 0 ? "text-emerald-600" : "text-red-500"}`}
                  >
                    {upside >= 0 ? "+" : ""}
                    {upside.toFixed(0)}%
                  </div>
                )}
              </button>
            );
          })
        ) : (
          <div className="px-3 py-8 text-center text-xs text-zinc-400">
            분석 결과가 여기에 쌓입니다
          </div>
        )}
      </div>
    </>
  );
}
