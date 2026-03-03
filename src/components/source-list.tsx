import type { Source } from "@/lib/schemas";

export function SourceList({ sources }: { sources: Source[] }) {
  if (sources.length === 0) return null;

  return (
    <ul className="mt-1 space-y-0.5">
      {sources.map((source, i) => (
        <li key={i} className="text-xs text-zinc-400">
          <a
            href={source.url}
            target="_blank"
            rel="noopener noreferrer"
            className="underline decoration-zinc-300 transition-colors hover:text-zinc-600"
          >
            {source.label}
          </a>
        </li>
      ))}
    </ul>
  );
}
