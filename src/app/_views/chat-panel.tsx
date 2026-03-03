"use client";

import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import {
  useSessionStore,
  useActiveSession,
  useMessages,
  useIsLoading,
} from "@/entities/session";

interface ChatViewProps {
  input: string;
  onInputChange: (value: string) => void;
  onSubmit: (e: React.FormEvent) => void;
  scrollRef: React.RefObject<HTMLDivElement | null>;
  inputRef: React.RefObject<HTMLInputElement | null>;
}

export function ChatView({
  input,
  onInputChange,
  onSubmit,
  scrollRef,
  inputRef,
}: ChatViewProps) {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const activeSession = useActiveSession();
  const messages = useMessages();
  const isLoading = useIsLoading();
  const isEmpty = messages.length === 0 && !activeSession;

  return (
    <>
      <div key={activeSessionId ?? "new"} ref={scrollRef} className="flex-1 overflow-y-auto">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="space-y-2 text-center">
              <p className="text-2xl font-bold tracking-tight">
                AI 밸류에이션 분석
              </p>
              <p className="text-sm text-zinc-500">
                회사명을 입력하면 AI가 밸류에이션 트리를 생성합니다
              </p>
              <p className="text-xs text-zinc-400">
                트리 생성 후 질문하거나 수정을 요청할 수 있습니다
              </p>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl px-4 py-6 space-y-3">
            {messages.map((msg) => (
              <div key={msg.id}>
                <div
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm ${
                      msg.role === "user"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {msg.role === "user" ? (
                      <span className="whitespace-pre-wrap">{msg.content}</span>
                    ) : (
                      <div className="prose prose-sm prose-zinc max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-2 prose-headings:my-2 prose-headings:text-zinc-800">
                        <ReactMarkdown remarkPlugins={[remarkGfm]}>
                          {msg.content}
                        </ReactMarkdown>
                      </div>
                    )}
                  </div>
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start">
                <div className="flex items-center gap-2 rounded-2xl bg-zinc-100 px-4 py-2.5 text-sm text-zinc-500">
                  <span className="inline-block h-4 w-4 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
                  분석 중...
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 bg-white px-4 py-3">
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-2xl gap-2"
        >
          <input
            ref={inputRef}
            type="text"
            value={input}
            onChange={(e) => onInputChange(e.target.value)}
            placeholder={
              activeSession
                ? "질문하거나 수정을 요청하세요..."
                : "회사명을 입력하세요 (예: 삼성전자)"
            }
            maxLength={500}
            disabled={isLoading}
            className="flex-1 rounded-xl border border-zinc-300 bg-zinc-50 px-4 py-3 text-sm outline-none transition-colors placeholder:text-zinc-400 focus:border-zinc-500 focus:ring-2 focus:ring-zinc-200 disabled:opacity-50"
          />
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="shrink-0 rounded-xl bg-zinc-900 px-4 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
          >
            전송
          </button>
        </form>
      </div>
    </>
  );
}
