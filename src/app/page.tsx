"use client";

import { useRef, useState, useCallback } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";
import type { Valuation, TreeNode } from "@/lib/schemas";
import { SummaryCard } from "@/components/summary-card";
import { ValuationTree } from "@/components/valuation-tree";
import { Disclaimer } from "@/components/disclaimer";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface Session {
  id: string;
  companyName: string;
  messages: ChatMessage[];
  valuation: Valuation | null;
}

export default function ChatPage() {
  const [sessions, setSessions] = useState<Session[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [treePanelOpen, setTreePanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const activeSession = sessions.find((s) => s.id === activeSessionId) ?? null;
  const messages = activeSession?.messages ?? [];
  const currentValuation = activeSession?.valuation ?? null;

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }, []);

  function updateSession(sessionId: string, updater: (s: Session) => Session) {
    setSessions((prev) => prev.map((s) => (s.id === sessionId ? updater(s) : s)));
  }

  function addMessage(sessionId: string, msg: ChatMessage) {
    updateSession(sessionId, (s) => ({ ...s, messages: [...s.messages, msg] }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    setInput("");
    setIsLoading(true);

    let sessionId = activeSessionId;
    const isNewSession = !activeSession;

    if (isNewSession) {
      sessionId = `session-${Date.now()}`;
      const newSession: Session = {
        id: sessionId,
        companyName: trimmed,
        messages: [],
        valuation: null,
      };
      setSessions((prev) => [newSession, ...prev]);
      setActiveSessionId(sessionId);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    const historyMsgs = isNewSession
      ? []
      : messages.map((m) => ({ role: m.role, content: m.content }));

    addMessage(sessionId!, userMsg);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: historyMsgs,
          currentValuation,
        }),
      });
      const data = await res.json();

      if (!res.ok) {
        throw new Error(data.error || "처리에 실패했습니다.");
      }

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
      };

      updateSession(sessionId!, (s) => ({
        ...s,
        messages: [...s.messages, assistantMsg],
        valuation: data.valuation ?? s.valuation,
        companyName: data.valuation?.companyName ?? s.companyName,
      }));

      if (data.valuation) {
        setTreePanelOpen(true);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: err instanceof Error ? err.message : "처리에 실패했습니다.",
      };
      addMessage(sessionId!, errorMsg);
    } finally {
      setIsLoading(false);
      scrollToBottom();
      inputRef.current?.focus();
    }
  }

  function startNewSession() {
    setActiveSessionId(null);
    setSidebarOpen(false);
  }

  const isEmpty = messages.length === 0 && !activeSession;
  const hasTree = currentValuation != null;

  function calcUpside(v: Valuation) {
    return ((v.tree.value - v.companyMarketCap) / v.companyMarketCap) * 100;
  }

  /* ── Shared sidebar content ── */
  const sidebarContent = (
    <>
      <div className="flex items-center justify-between px-4 py-4">
        <h1 className="text-lg font-bold tracking-tight">ValuTree</h1>
        <button
          type="button"
          onClick={startNewSession}
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
                onClick={() => {
                  setActiveSessionId(session.id);
                  setSidebarOpen(false);
                }}
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

  /* ── Shared tree panel content ── */
  const treePanelContent = hasTree ? (
    <>
      <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-3">
        <div>
          <h2 className="font-semibold">
            {currentValuation.companyName}
          </h2>
          <p className="text-xs text-zinc-500">
            {currentValuation.methodology} ·{" "}
            {currentValuation.companyCode}
          </p>
        </div>
        <button
          type="button"
          onClick={() => setTreePanelOpen(false)}
          className="lg:hidden shrink-0 rounded-lg p-1.5 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
        >
          <svg width="18" height="18" viewBox="0 0 18 18" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
            <path d="M4 4l10 10M14 4L4 14" />
          </svg>
        </button>
      </div>

      <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
        <SummaryCard valuation={currentValuation} />
        <ValuationTree tree={currentValuation.tree as TreeNode} />
        <Disclaimer />
      </div>
    </>
  ) : (
    <div className="flex flex-1 flex-col items-center justify-center px-8 text-center">
      <div className="rounded-2xl bg-zinc-50 p-6">
        <svg
          className="mx-auto mb-4 text-zinc-300"
          width="48"
          height="48"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <path d="M3 3v18h18" />
          <path d="m7 16 4-8 4 4 4-6" />
        </svg>
        <p className="text-sm font-medium text-zinc-400">
          밸류에이션 트리
        </p>
        <p className="mt-1 text-xs text-zinc-400">
          회사명을 입력하면 여기에 분석 결과가 표시됩니다
        </p>
      </div>
    </div>
  );

  return (
    <div className="flex h-dvh">
      {/* ── Desktop sidebar (≥ 1280px) ── */}
      <aside className="hidden xl:flex w-[260px] min-w-[260px] flex-col border-r border-zinc-200 bg-zinc-50">
        {sidebarContent}
      </aside>

      {/* ── Mobile/Tablet sidebar drawer (< 1280px) ── */}
      {sidebarOpen && (
        <div className="fixed inset-0 z-40 xl:hidden">
          <div
            className="absolute inset-0 bg-black/30 animate-[fade-in_150ms_ease-out]"
            onClick={() => setSidebarOpen(false)}
          />
          <aside className="relative flex h-full w-[280px] max-w-[calc(100vw-3rem)] flex-col bg-zinc-50 shadow-xl animate-[slide-in-left_200ms_ease-out]">
            {sidebarContent}
          </aside>
        </div>
      )}

      {/* ── Center: Chat ── */}
      <div className="flex flex-1 flex-col min-w-0">
        {/* Mobile/Tablet header (< 1280px) */}
        <div className="flex items-center justify-between border-b border-zinc-200 bg-white px-3 py-3 xl:hidden">
          <button
            type="button"
            onClick={() => setSidebarOpen(true)}
            className="rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100"
          >
            <svg width="20" height="20" viewBox="0 0 20 20" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round">
              <path d="M3 5h14M3 10h14M3 15h14" />
            </svg>
          </button>
          <span className="text-sm font-semibold text-zinc-800 truncate px-2">
            {activeSession?.companyName ?? "ValuTree"}
          </span>
          {/* Spacer to keep title centered when tree toggle is hidden (lg–xl) */}
          <div className="hidden lg:block w-8" />
          <button
            type="button"
            onClick={() => setTreePanelOpen(true)}
            disabled={!hasTree}
            className="lg:hidden rounded-lg p-1.5 text-zinc-600 hover:bg-zinc-100 disabled:opacity-30 disabled:cursor-not-allowed"
          >
            <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
              <path d="M3 3v18h18" />
              <path d="m7 16 4-8 4 4 4-6" />
            </svg>
          </button>
        </div>

        <div ref={scrollRef} className="flex-1 overflow-y-auto">
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

        {/* Input */}
        <div className="border-t border-zinc-200 bg-white px-4 py-3">
          <form
            onSubmit={handleSubmit}
            className="mx-auto flex max-w-2xl gap-2"
          >
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
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
      </div>

      {/* ── Desktop tree panel (≥ 1024px) ── */}
      <div className="hidden lg:flex w-[480px] min-w-[480px] flex-col border-l border-zinc-200 bg-white">
        {treePanelContent}
      </div>

      {/* ── Mobile/Tablet tree panel overlay (< 1024px) ── */}
      {treePanelOpen && (
        <div className="fixed inset-0 z-40 lg:hidden">
          <div
            className="absolute inset-0 bg-black/30 animate-[fade-in_150ms_ease-out]"
            onClick={() => setTreePanelOpen(false)}
          />
          {/* Full-screen on mobile (< 640px), 60% slide-in on tablet (640–1023px) */}
          <div className="absolute inset-y-0 right-0 flex w-full sm:w-[60%] flex-col bg-white shadow-xl animate-[slide-in-right_200ms_ease-out]">
            <div className="flex flex-1 flex-col overflow-hidden">
              {treePanelContent}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
