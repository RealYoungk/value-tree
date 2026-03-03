import { SessionsSidebarContentView } from "./content";

interface SessionsSidebarViewProps {
  sidebarOpen: boolean;
  onSelectSession: (id: string, hasValuation: boolean) => void;
  onNewSession: () => void;
  onCloseSidebar: () => void;
}

export function SessionsSidebarView({
  sidebarOpen,
  onSelectSession,
  onNewSession,
  onCloseSidebar,
}: SessionsSidebarViewProps) {
  const contentProps = { onSelectSession, onNewSession };

  return (
    <>
      {/* Desktop sidebar (>= 1280px) */}
      <aside className="hidden xl:flex w-[260px] min-w-[260px] flex-col border-r border-zinc-200 bg-zinc-50">
        <SessionsSidebarContentView {...contentProps} />
      </aside>

      {/* Mobile/Tablet sidebar drawer (< 1280px) */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div
            className="absolute inset-0 bg-black/30 animate-[fade-in_150ms_ease-out]"
            onClick={onCloseSidebar}
          />
          <aside className="relative flex h-full w-[280px] max-w-[calc(100vw-3rem)] flex-col bg-zinc-50 shadow-xl animate-[slide-in-left_200ms_ease-out]">
            <SessionsSidebarContentView {...contentProps} />
          </aside>
        </div>
      )}
    </>
  );
}
