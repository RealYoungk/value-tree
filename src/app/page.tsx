"use client";

import { useRef, useState, useCallback } from "react";
import type { Valuation, TreeNode } from "@/lib/schemas";
import { SummaryCard } from "@/components/summary-card";
import { ValuationTree } from "@/components/valuation-tree";
import { Disclaimer } from "@/components/disclaimer";

interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

interface HistoryEntry {
  id: string;
  valuation: Valuation;
  createdAt: Date;
}

export default function ChatPage() {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [input, setInput] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [currentValuation, setCurrentValuation] = useState<Valuation | null>(
    null,
  );
  const [history, setHistory] = useState<HistoryEntry[]>([]);
  const [showHistory, setShowHistory] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }, []);

  // Build history array for API (text-only summary of messages)
  function buildApiHistory() {
    return messages.map((m) => ({ role: m.role, content: m.content }));
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setMessages((prev) => [...prev, userMsg]);
    setInput("");
    setIsLoading(true);
    scrollToBottom();

    try {
      const res = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          message: trimmed,
          history: buildApiHistory(),
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
      setMessages((prev) => [...prev, assistantMsg]);

      // If a valuation was returned, update the active tree
      if (data.valuation) {
        // Push current to history before replacing
        if (currentValuation) {
          setHistory((prev) => [
            {
              id: `history-${Date.now()}`,
              valuation: currentValuation,
              createdAt: new Date(),
            },
            ...prev,
          ]);
        }
        setCurrentValuation(data.valuation);
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content:
          err instanceof Error ? err.message : "처리에 실패했습니다.",
      };
      setMessages((prev) => [...prev, errorMsg]);
    } finally {
      setIsLoading(false);
      scrollToBottom();
      inputRef.current?.focus();
    }
  }

  function restoreFromHistory(entry: HistoryEntry) {
    if (currentValuation) {
      setHistory((prev) => [
        {
          id: `history-${Date.now()}`,
          valuation: currentValuation,
          createdAt: new Date(),
        },
        ...prev.filter((h) => h.id !== entry.id),
      ]);
    } else {
      setHistory((prev) => prev.filter((h) => h.id !== entry.id));
    }
    setCurrentValuation(entry.valuation);
    setShowHistory(false);
  }

  const isEmpty = messages.length === 0;
  const hasTree = currentValuation != null;

  return (
    <div className="flex h-dvh">
      {/* Left: Chat */}
      <div
        className={`flex flex-col border-r border-zinc-200 transition-all duration-300 ${
          hasTree ? "w-[420px] min-w-[420px]" : "w-full"
        }`}
      >
        <div ref={scrollRef} className="flex-1 overflow-y-auto">
          {isEmpty ? (
            <div className="flex h-full flex-col items-center justify-center px-4">
              <div className="space-y-2 text-center">
                <h1 className="text-3xl font-bold tracking-tight">
                  ValuTree
                </h1>
                <p className="text-sm text-zinc-500">
                  회사명을 입력하면 AI가 밸류에이션 트리를 생성합니다
                </p>
                <p className="text-xs text-zinc-400">
                  트리 생성 후 질문하거나 수정을 요청할 수 있습니다
                </p>
              </div>
            </div>
          ) : (
            <div className="px-4 py-6 space-y-3">
              {messages.map((msg) => (
                <div
                  key={msg.id}
                  className={`flex ${msg.role === "user" ? "justify-end" : "justify-start"}`}
                >
                  <div
                    className={`max-w-[85%] rounded-2xl px-4 py-2.5 text-sm whitespace-pre-wrap ${
                      msg.role === "user"
                        ? "bg-zinc-900 text-white"
                        : "bg-zinc-100 text-zinc-800"
                    }`}
                  >
                    {msg.content}
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
          <form onSubmit={handleSubmit} className="flex gap-2">
            <input
              ref={inputRef}
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder={
                hasTree
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
              className="rounded-xl bg-zinc-900 px-5 py-3 text-sm font-medium text-white transition-colors hover:bg-zinc-800 disabled:cursor-not-allowed disabled:opacity-40"
            >
              전송
            </button>
          </form>
        </div>
      </div>

      {/* Right: Tree Viewer Panel */}
      {hasTree && (
        <div className="flex flex-1 flex-col bg-white">
          {/* Panel header */}
          <div className="flex items-center justify-between border-b border-zinc-200 px-6 py-4">
            <div>
              <h2 className="font-semibold">
                {currentValuation.companyName}
              </h2>
              <p className="text-xs text-zinc-500">
                {currentValuation.methodology} ·{" "}
                {currentValuation.companyCode}
              </p>
            </div>
            <div className="flex items-center gap-2">
              {history.length > 0 && (
                <div className="relative">
                  <button
                    type="button"
                    onClick={() => setShowHistory(!showHistory)}
                    className="rounded-lg px-3 py-1.5 text-xs text-zinc-500 transition-colors hover:bg-zinc-100"
                  >
                    히스토리 ({history.length})
                  </button>
                  {showHistory && (
                    <div className="absolute right-0 top-full z-10 mt-1 w-64 rounded-xl border border-zinc-200 bg-white py-1 shadow-lg">
                      {history.map((entry) => (
                        <button
                          key={entry.id}
                          type="button"
                          onClick={() => restoreFromHistory(entry)}
                          className="flex w-full items-center justify-between px-4 py-2.5 text-left text-sm transition-colors hover:bg-zinc-50"
                        >
                          <div>
                            <div className="font-medium">
                              {entry.valuation.companyName}
                            </div>
                            <div className="text-xs text-zinc-400">
                              {entry.valuation.methodology}
                            </div>
                          </div>
                          <div className="text-xs text-zinc-400">
                            {entry.createdAt.toLocaleTimeString("ko-KR", {
                              hour: "2-digit",
                              minute: "2-digit",
                            })}
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                </div>
              )}
              <button
                type="button"
                onClick={() => {
                  setHistory((prev) => [
                    {
                      id: `history-${Date.now()}`,
                      valuation: currentValuation,
                      createdAt: new Date(),
                    },
                    ...prev,
                  ]);
                  setCurrentValuation(null);
                }}
                className="rounded-lg p-2 text-zinc-400 transition-colors hover:bg-zinc-100 hover:text-zinc-600"
                title="트리 닫기"
              >
                <svg
                  width="16"
                  height="16"
                  viewBox="0 0 16 16"
                  fill="none"
                  stroke="currentColor"
                  strokeWidth="2"
                >
                  <path d="M12 4L4 12M4 4l8 8" />
                </svg>
              </button>
            </div>
          </div>

          {/* Panel content */}
          <div className="flex-1 overflow-y-auto px-6 py-6 space-y-6">
            <SummaryCard valuation={currentValuation} />
            <ValuationTree tree={currentValuation.tree as TreeNode} />
            <Disclaimer />
          </div>
        </div>
      )}
    </div>
  );
}
