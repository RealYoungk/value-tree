import { Menu, BarChart3 } from "lucide-react";
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
        className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 transition-colors"
      >
        <Menu className="h-5 w-5" />
      </button>
      <span className="text-sm font-semibold text-zinc-800 truncate px-2">
        {activeSession?.companyName ?? "ValueTree"}
      </span>
      {/* Spacer to keep title centered when tree toggle is hidden (lg-xl) */}
      <div className="hidden lg:block w-8" />
      <button
        type="button"
        onClick={onOpenTree}
        disabled={!hasTree}
        className="lg:hidden rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed transition-colors"
      >
        <BarChart3 className="h-5 w-5" />
      </button>
    </div>
  );
}
