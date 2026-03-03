export function LoadingSkeleton() {
  return (
    <div className="animate-pulse space-y-6">
      {/* Summary card skeleton */}
      <div className="rounded-xl border border-zinc-200 bg-white p-6">
        <div className="space-y-3">
          <div className="h-5 w-32 rounded bg-zinc-200" />
          <div className="h-8 w-48 rounded bg-zinc-200" />
          <div className="flex gap-4">
            <div className="h-4 w-24 rounded bg-zinc-200" />
            <div className="h-4 w-24 rounded bg-zinc-200" />
          </div>
        </div>
      </div>

      {/* Tree skeleton */}
      <div className="space-y-3">
        <div className="h-5 w-40 rounded bg-zinc-200" />
        <div className="space-y-2 pl-4">
          <div className="h-12 rounded-lg border border-zinc-200 bg-white" />
          <div className="space-y-2 pl-6">
            <div className="h-12 rounded-lg border border-zinc-200 bg-white" />
            <div className="h-12 rounded-lg border border-zinc-200 bg-white" />
            <div className="space-y-2 pl-6">
              <div className="h-10 rounded-lg border border-zinc-200 bg-white" />
              <div className="h-10 rounded-lg border border-zinc-200 bg-white" />
            </div>
          </div>
        </div>
      </div>

      <p className="text-center text-sm text-zinc-400">
        AI가 분석 중입니다... (10~30초 소요)
      </p>
    </div>
  );
}
