import { useActiveSession, useCurrentValuation } from "@/entities/session";

interface AppBarViewProps {
  onOpenSidebar: () => void;
  onOpenTree: () => void;
}

export function AppBarView({ onOpenSidebar, onOpenTree }: AppBarViewProps) {
  const activeSession = useActiveSession();
  const currentValuation = useCurrentValuation();
  const hasTree = currentValuation != null;

  return (
    <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-3 xl:hidden">
      <button
        type="button"
        onClick={onOpenSidebar}
        className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100"
      >
        <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
          <path d="M3 5h14M3 10h14M3 15h14" />
        </svg>
      </button>
      <span className="text-sm font-semibold text-zinc-800 truncate px-2">
        {activeSession?.companyName ?? "ValuTree"}
      </span>
      {/* Spacer to keep title centered when tree toggle is hidden (lg-xl) */}
      <div className="hidden lg:block w-8" />
      <button
        type="button"
        onClick={onOpenTree}
        disabled={!hasTree}
        className="lg:hidden rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
      >
        <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
          <path d="M3 3v18h18" />
          <path d="m7 16 4-8 4 4 4-6" />
        </svg>
      </button>
    </div>
  );
}
