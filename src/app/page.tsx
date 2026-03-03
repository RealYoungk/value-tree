"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import {
  useSessionStore,
  useActiveSession,
  useMessages,
  useCurrentValuation,
  useIsLoading,
} from "@/entities/session";
import type { ChatMessage } from "@/entities/session";
import { useInvestorStore } from "@/entities/investor";
import { createClient } from "@/shared/supabase/client";
import { AppBarView } from "./_views/app-bar";
import { SessionsSidebarView } from "./_views/sidebar";
import { ChatView } from "./_views/chat-panel";
import { TreePanelView } from "./_views/tree-panel";

function LoginDialog({
  open,
  onClose,
}: {
  open: boolean;
  onClose: () => void;
}) {
  if (!open) return null;

  function handleGoogleLogin() {
    const supabase = createClient();
    supabase.auth.signInWithOAuth({
      provider: "google",
      options: { redirectTo: `${location.origin}/auth/callback` },
    });
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center bg-black/40"
      onClick={onClose}
    >
      <div
        className="mx-4 w-full max-w-sm rounded-2xl bg-white p-6 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 className="text-lg font-bold tracking-tight">로그인</h2>
        <p className="mt-1 text-sm text-zinc-500">
          분석 결과를 저장하려면 로그인이 필요합니다
        </p>
        <button
          type="button"
          onClick={handleGoogleLogin}
          className="mt-5 inline-flex w-full items-center justify-center gap-3 rounded-xl border border-zinc-200 bg-white px-4 py-3 text-sm font-medium text-zinc-700 shadow-sm transition-colors hover:bg-zinc-50"
        >
          <svg width="18" height="18" viewBox="0 0 24 24">
            <path d="M22.56 12.25c0-.78-.07-1.53-.2-2.25H12v4.26h5.92a5.06 5.06 0 0 1-2.2 3.32v2.77h3.57c2.08-1.92 3.28-4.74 3.28-8.1z" fill="#4285F4" />
            <path d="M12 23c2.97 0 5.46-.98 7.28-2.66l-3.57-2.77c-.98.66-2.23 1.06-3.71 1.06-2.86 0-5.29-1.93-6.16-4.53H2.18v2.84C3.99 20.53 7.7 23 12 23z" fill="#34A853" />
            <path d="M5.84 14.09c-.22-.66-.35-1.36-.35-2.09s.13-1.43.35-2.09V7.07H2.18C1.43 8.55 1 10.22 1 12s.43 3.45 1.18 4.93l2.85-2.22.81-.62z" fill="#FBBC05" />
            <path d="M12 5.38c1.62 0 3.06.56 4.21 1.64l3.15-3.15C17.45 2.09 14.97 1 12 1 7.7 1 3.99 3.47 2.18 7.07l3.66 2.84c.87-2.6 3.3-4.53 6.16-4.53z" fill="#EA4335" />
          </svg>
          Google로 계속하기
        </button>
        <button
          type="button"
          onClick={onClose}
          className="mt-3 w-full rounded-xl px-4 py-2.5 text-sm text-zinc-400 transition-colors hover:text-zinc-600"
        >
          닫기
        </button>
      </div>
    </div>
  );
}

export default function ChatPage() {
  // UI state (local)
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [treePanelOpen, setTreePanelOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Auth state
  const investor = useInvestorStore((s) => s.investor);
  const investorLoading = useInvestorStore((s) => s.loading);
  const initInvestor = useInvestorStore((s) => s.init);
  const isLoggedIn = !!investor;

  // Domain state (store)
  const {
    activeSessionId,
    sessionsLoaded,
    createSession,
    setActiveSessionId,
    setLoadingSessionId,
    addMessage,
    updateSession,
    loadSessions,
    saveSession,
  } = useSessionStore();
  const activeSession = useActiveSession();
  const messages = useMessages();
  const currentValuation = useCurrentValuation();
  const isLoading = useIsLoading();

  // Init auth
  useEffect(() => {
    initInvestor();
  }, [initInvestor]);

  // Load sessions when investor is ready
  useEffect(() => {
    if (investor && !sessionsLoaded) {
      loadSessions(investor.id);
    }
  }, [investor, sessionsLoaded, loadSessions]);

  const scrollToBottom = useCallback(() => {
    setTimeout(() => {
      scrollRef.current?.scrollTo({
        top: scrollRef.current.scrollHeight,
        behavior: "smooth",
      });
    }, 100);
  }, []);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading) return;

    // Gate: require login
    if (!isLoggedIn) {
      setLoginDialogOpen(true);
      return;
    }

    setInput("");

    let sessionId = activeSessionId;
    const isNewSession = !activeSession;

    if (isNewSession) {
      sessionId = createSession(trimmed);
    }

    const userMsg: ChatMessage = {
      id: `user-${Date.now()}`,
      role: "user",
      content: trimmed,
    };

    setLoadingSessionId(sessionId);

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

      // Auto-save to DB
      if (investor) {
        const updated = useSessionStore
          .getState()
          .sessions.find((s) => s.id === sessionId);
        if (updated) {
          saveSession(updated, investor.id);
        }
      }
    } catch (err) {
      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: err instanceof Error ? err.message : "처리에 실패했습니다.",
      };
      addMessage(sessionId!, errorMsg);
    } finally {
      setLoadingSessionId(null);
      scrollToBottom();
      inputRef.current?.focus();
    }
  }

  function handleSelectSession(id: string, hasValuation: boolean) {
    setActiveSessionId(id);
    setTreePanelOpen(hasValuation);
    setSidebarOpen(false);
  }

  function handleNewSession() {
    setActiveSessionId(null);
    setTreePanelOpen(false);
    setSidebarOpen(false);
  }

  // Show spinner while checking auth
  if (investorLoading) {
    return (
      <div className="flex h-dvh items-center justify-center">
        <div className="h-6 w-6 animate-spin rounded-full border-2 border-zinc-300 border-t-zinc-600" />
      </div>
    );
  }

  return (
    <>
      <div className="flex h-dvh">
        <SessionsSidebarView
          sidebarOpen={sidebarOpen}
          onSelectSession={handleSelectSession}
          onNewSession={handleNewSession}
          onCloseSidebar={() => setSidebarOpen(false)}
        />

        <div className="flex flex-1 flex-col min-w-0">
          <AppBarView
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenTree={() => setTreePanelOpen(true)}
          />
          <ChatView
            input={input}
            onInputChange={setInput}
            onSubmit={handleSubmit}
            scrollRef={scrollRef}
            inputRef={inputRef}
          />
        </div>

        <TreePanelView
          treePanelOpen={treePanelOpen}
          onClose={() => setTreePanelOpen(false)}
        />
      </div>

      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      />
    </>
  );
}
