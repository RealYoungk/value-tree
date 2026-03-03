"use client";

import { useRef, useState, useCallback } from "react";
import {
  useSessionStore,
  useActiveSession,
  useMessages,
  useCurrentValuation,
  useIsLoading,
} from "@/entities/session";
import type { ChatMessage } from "@/entities/session";
import { AppBarView } from "./_views/app-bar";
import { SessionsSidebarView } from "./_views/sidebar";
import { ChatView } from "./_views/chat-panel";
import { TreePanelView } from "./_views/tree-panel";

export default function ChatPage() {
  // UI state (local)
  const [input, setInput] = useState("");
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [treePanelOpen, setTreePanelOpen] = useState(false);
  const scrollRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLInputElement>(null);

  // Domain state (store)
  const {
    activeSessionId,
    createSession,
    setActiveSessionId,
    setLoadingSessionId,
    addMessage,
    updateSession,
  } = useSessionStore();
  const activeSession = useActiveSession();
  const messages = useMessages();
  const currentValuation = useCurrentValuation();
  const isLoading = useIsLoading();

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

  return (
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
  );
}
