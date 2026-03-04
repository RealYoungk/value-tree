"use client";

import Link from "next/link";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import { Info, SendHorizontal, Loader2, Sparkles } from "lucide-react";
import {
  useSessionStore,
  useActiveSession,
  useMessages,
  useIsLoading,
  useLoadingStatus,
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
  const loadingStatus = useLoadingStatus();
  const isEmpty = messages.length === 0 && !activeSession;

  return (
    <>
      <div key={activeSessionId ?? "new"} ref={scrollRef} className="flex-1 overflow-y-auto bg-zinc-50/30">
        {isEmpty ? (
          <div className="flex h-full flex-col items-center justify-center px-4">
            <div className="max-w-md w-full space-y-6 text-center">
              <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-zinc-900 text-white shadow-xl shadow-zinc-200">
                <Sparkles className="h-8 w-8" />
              </div>
              <div className="space-y-2">
                <p className="text-2xl font-bold tracking-tight text-zinc-900">
                  AI 밸류에이션 분석
                </p>
                <p className="text-zinc-500">
                  회사명을 입력하면 AI가 실시간 데이터를 바탕으로<br />
                  복잡한 밸류에이션 트리를 생성합니다.
                </p>
              </div>
              
              <div className="flex flex-col gap-2 pt-4">
                <Link
                  href="/about"
                  className="inline-flex items-center justify-center gap-2 rounded-xl bg-white border border-zinc-200 px-5 py-3 text-sm font-semibold text-zinc-700 shadow-sm transition-all hover:bg-zinc-50 hover:text-zinc-900 active:scale-95"
                >
                  <Info className="h-4 w-4 text-zinc-400" />
                  왜 ValueTree를 써야 할까요?
                </Link>
              </div>

              <div className="grid grid-cols-2 gap-2 text-left pt-8">
                {["삼성전자", "테슬라", "엔비디아", "애플"].map((company) => (
                  <button
                    key={company}
                    onClick={() => onInputChange(company)}
                    className="p-3 rounded-lg border border-zinc-100 bg-white/50 text-xs text-zinc-500 hover:border-zinc-300 hover:bg-white transition-colors text-center"
                  >
                    "{company}" 분석해줘
                  </button>
                ))}
              </div>
            </div>
          </div>
        ) : (
          <div className="mx-auto max-w-2xl px-4 py-8 space-y-6">
            {messages.map((msg) => (
              <div key={msg.id} className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}>
                <div
                  className={`max-w-[85%] rounded-2xl px-4 py-3 text-sm shadow-sm ${
                    msg.role === "user"
                      ? "bg-zinc-900 text-white"
                      : "bg-white border border-zinc-100 text-zinc-800"
                  }`}
                >
                  {msg.role === "user" ? (
                    <span className="whitespace-pre-wrap leading-relaxed">{msg.content}</span>
                  ) : (
                    <div className="prose prose-sm prose-zinc max-w-none prose-p:my-1 prose-ul:my-1 prose-ol:my-1 prose-li:my-0.5 prose-pre:my-2 prose-headings:my-2 prose-headings:text-zinc-900">
                      <ReactMarkdown remarkPlugins={[remarkGfm]}>
                        {msg.content}
                      </ReactMarkdown>
                    </div>
                  )}
                </div>
              </div>
            ))}

            {isLoading && (
              <div className="flex justify-start animate-in fade-in slide-in-from-bottom-2 duration-300">
                <div className="flex items-center gap-3 rounded-2xl bg-white border border-zinc-100 px-4 py-3 text-sm text-zinc-500 shadow-sm">
                  <div className="flex h-5 w-5 items-center justify-center">
                    <Loader2 className="h-4 w-4 animate-spin text-zinc-400" />
                  </div>
                  <span>{loadingStatus || "데이터를 분석하고 트리를 구성하는 중..."}</span>
                </div>
              </div>
            )}
          </div>
        )}
      </div>

      <div className="border-t border-zinc-200 bg-white p-4">
        <form
          onSubmit={onSubmit}
          className="mx-auto flex max-w-2xl gap-2"
        >
          <div className="relative flex-1">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => onInputChange(e.target.value)}
              placeholder={
                activeSession
                  ? "추가 분석을 요청하거나 수치를 수정해 보세요..."
                  : "회사명을 입력하세요 (예: 엔비디아)"
              }
              maxLength={500}
              disabled={isLoading}
              className="h-[52px] w-full rounded-xl border border-zinc-200 bg-zinc-50 px-4 text-sm outline-none transition-all placeholder:text-zinc-400 focus:border-zinc-900 focus:bg-white focus:ring-4 focus:ring-zinc-900/5 disabled:opacity-50"
            />
          </div>
          <button
            type="submit"
            disabled={!input.trim() || isLoading}
            className="group flex h-[52px] items-center justify-center shrink-0 rounded-xl bg-zinc-900 px-5 text-white transition-all hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-30 active:scale-95 shadow-sm"
          >
            {isLoading ? (
              <Loader2 className="h-5 w-5 animate-spin" />
            ) : (
              <SendHorizontal className="h-5 w-5 transition-transform group-hover:translate-x-0.5" />
            )}
          </button>
        </form>
      </div>
    </>
  );
}
