import { useCurrentValuation } from "@/entities/session";
import { TreePanelContentView } from "./content";

interface TreePanelViewProps {
  treePanelOpen: boolean;
  onClose: () => void;
}

export function TreePanelView({ treePanelOpen, onClose }: TreePanelViewProps) {
  const valuation = useCurrentValuation();

  return (
    <>
      {/* Desktop tree panel (>= 1024px) */}
      <div className="hidden lg:flex w-[480px] min-w-[480px] flex-col border-l border-zinc-200 bg-white">
        <TreePanelContentView valuation={valuation} onClose={onClose} />
      </div>

      {/* Mobile/Tablet tree panel overlay (< 1024px) */}
      {treePanelOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 animate-[fade-in_150ms_ease-out]"
            onClick={onClose}
          />
          <div className="absolute inset-y-0 right-0 flex w-full sm:w-[60%] flex-col bg-white shadow-xl animate-[slide-in-right_200ms_ease-out]">
            <div className="flex flex-1 flex-col overflow-hidden">
              <TreePanelContentView valuation={valuation} onClose={onClose} />
            </div>
          </div>
        </div>
      )}
    </>
  );
}
