"use client";

import { useRef, useState, useEffect, useCallback } from "react";
import { useMutation } from "@tanstack/react-query";
import {
  useSessionStore,
  useActiveSession,
  useMessages,
  useCurrentValuation,
  useIsLoading,
} from "@/entities/session";
import type { ChatMessage, Valuation } from "@/entities/session";
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
      options: {
        redirectTo: `${location.origin}/auth/callback`,
      },
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

// Helper: read NDJSON stream, dispatch status events, return result/intent
async function readNdjsonStream(
  res: Response,
  onStatus: (msg: string) => void,
): Promise<{ result?: Record<string, unknown>; intent?: { intent: string; companyName: string } }> {
  const reader = res.body?.getReader();
  if (!reader) throw new Error("스트림을 읽을 수 없습니다.");

  const decoder = new TextDecoder();
  let buffer = "";
  let result: Record<string, unknown> | undefined;
  let intent: { intent: string; companyName: string } | undefined;

  while (true) {
    const { done, value } = await reader.read();
    if (done) break;

    buffer += decoder.decode(value, { stream: true });
    const lines = buffer.split("\n");
    buffer = lines.pop() || "";

    for (const line of lines) {
      if (!line.trim()) continue;
      try {
        const event = JSON.parse(line);
        if (event.type === "status") {
          onStatus(event.message);
        } else if (event.type === "result") {
          result = event.data;
        } else if (event.type === "intent") {
          intent = event.data;
        } else if (event.type === "error") {
          throw new Error(event.error);
        }
      } catch (e) {
        if (e instanceof Error && e.message !== line) throw e;
      }
    }
  }

  return { result, intent };
}

export default function ChatPage() {
  // UI state (local)
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [treePanelOpen, setTreePanelOpen] = useState(false);
  const [loginDialogOpen, setLoginDialogOpen] = useState(false);
  const [treeWidth, setTreeWidth] = useState(550);
  const isResizing = useRef(false);

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

  // Track which session the current mutation is for
  const mutationSessionRef = useRef<string | null>(null);

  const chatMutation = useMutation({
    mutationFn: async (params: {
      message: string;
      history: { role: "user" | "assistant"; content: string }[];
      currentValuation?: Valuation;
    }) => {
      const sessionId = mutationSessionRef.current;
      const updateStatus = (msg: string) => {
        if (sessionId) setLoadingSessionId(sessionId, msg);
      };

      // Step 1: Route intent via /api/chat
      const chatRes = await fetch("/api/chat", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(params),
      });

      if (!chatRes.ok) {
        let errorMsg = "처리에 실패했습니다.";
        try {
          const json = await chatRes.json();
          errorMsg = json.error || errorMsg;
        } catch { /* ignore parse error */ }
        throw new Error(errorMsg);
      }

      const chatStream = await readNdjsonStream(chatRes, updateStatus);

      // If not an analyze intent, return the direct result
      if (!chatStream.intent) {
        if (!chatStream.result) throw new Error("서버에서 결과를 받지 못했습니다.");
        return chatStream.result as { message: string; valuation?: Valuation };
      }

      // Step 2: Analyze flow — call /api/chat/research
      const { companyName } = chatStream.intent;

      const researchRes = await fetch("/api/chat/research", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ companyName }),
      });

      if (!researchRes.ok) {
        let errorMsg = "리서치에 실패했습니다.";
        try {
          const json = await researchRes.json();
          errorMsg = json.error || errorMsg;
        } catch { /* ignore */ }
        throw new Error(errorMsg);
      }

      const researchStream = await readNdjsonStream(researchRes, updateStatus);

      if (!researchStream.result) throw new Error("리서치 결과를 받지 못했습니다.");
      const researchResult = researchStream.result as {
        researchText: string;
        realData?: Record<string, unknown>;
      };

      // Step 3: Call /api/chat/structure with research results
      const structureRes = await fetch("/api/chat/structure", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          companyName,
          researchText: researchResult.researchText,
          realData: researchResult.realData,
        }),
      });

      if (!structureRes.ok) {
        let errorMsg = "밸류에이션 구조화에 실패했습니다.";
        try {
          const json = await structureRes.json();
          errorMsg = json.error || errorMsg;
        } catch { /* ignore */ }
        throw new Error(errorMsg);
      }

      const structureStream = await readNdjsonStream(structureRes, updateStatus);

      if (!structureStream.result) throw new Error("밸류에이션 결과를 받지 못했습니다.");
      return structureStream.result as { message: string; valuation: Valuation };
    },
    onSuccess: (data) => {
      const sessionId = mutationSessionRef.current;
      if (!sessionId) return;

      const assistantMsg: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: "assistant",
        content: data.message,
      };

      updateSession(sessionId, (s) => ({
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
    },
    onError: (err: Error) => {
      const sessionId = mutationSessionRef.current;
      if (!sessionId) return;

      const errorMsg: ChatMessage = {
        id: `error-${Date.now()}`,
        role: "assistant",
        content: err.message || "처리에 실패했습니다.",
      };
      addMessage(sessionId, errorMsg);
    },
    onSettled: () => {
      setLoadingSessionId(null);
      scrollToBottom();
      inputRef.current?.focus();
    },
  });

  function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const trimmed = input.trim();
    if (!trimmed || isLoading || chatMutation.isPending) return;

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

    mutationSessionRef.current = sessionId;
    setLoadingSessionId(sessionId);

    const historyMsgs = isNewSession
      ? []
      : messages.map((m) => ({ role: m.role, content: m.content }));

    addMessage(sessionId!, userMsg);
    scrollToBottom();

    chatMutation.mutate({
      message: trimmed,
      history: historyMsgs,
      currentValuation: currentValuation ?? undefined,
    });
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

  // --- Resizing Logic ---
  const startResizing = useCallback(() => {
    isResizing.current = true;
    document.body.style.cursor = "col-resize";
    document.body.style.userSelect = "none";
  }, []);

  const stopResizing = useCallback(() => {
    isResizing.current = false;
    document.body.style.cursor = "default";
    document.body.style.userSelect = "auto";
  }, []);

  const resize = useCallback((e: MouseEvent) => {
    if (!isResizing.current) return;
    const newWidth = window.innerWidth - e.clientX;
    // Min 350px, Max 75% of screen
    if (newWidth > 350 && newWidth < window.innerWidth * 0.75) {
      setTreeWidth(newWidth);
    }
  }, []);

  useEffect(() => {
    window.addEventListener("mousemove", resize);
    window.addEventListener("mouseup", stopResizing);
    return () => {
      window.removeEventListener("mousemove", resize);
      window.removeEventListener("mouseup", stopResizing);
    };
  }, [resize, stopResizing]);

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

        <div className="flex flex-1 flex-col min-w-0 bg-white">
          <AppBarView
            onOpenSidebar={() => setSidebarOpen(true)}
            onOpenTree={() => setTreePanelOpen(true)}
          />
          <main className="flex-1 flex flex-col overflow-hidden">
            <ChatView
              input={input}
              onInputChange={setInput}
              onSubmit={handleSubmit}
              scrollRef={scrollRef}
              inputRef={inputRef}
            />
          </main>
        </div>

        {/* Resizer bar */}
        <div
          onMouseDown={startResizing}
          className="hidden lg:flex w-1 cursor-col-resize items-center justify-center bg-zinc-100 transition-colors hover:bg-zinc-300 group"
        >
          <div className="h-8 w-[1px] bg-zinc-300 group-hover:bg-zinc-400" />
        </div>

        <TreePanelView
          treePanelOpen={treePanelOpen}
          onClose={() => setTreePanelOpen(false)}
          width={treeWidth}
        />
      </div>

      <LoginDialog
        open={loginDialogOpen}
        onClose={() => setLoginDialogOpen(false)}
      />
    </>
  );
}
