import { create } from "zustand";
import type { Valuation } from "./schemas";

export interface ChatMessage {
  id: string;
  role: "user" | "assistant";
  content: string;
}

export interface Session {
  id: string;
  companyName: string;
  messages: ChatMessage[];
  valuation: Valuation | null;
}

interface SessionStore {
  sessions: Session[];
  activeSessionId: string | null;
  loadingSessionId: string | null;

  createSession: (companyName: string) => string;
  setActiveSessionId: (id: string | null) => void;
  setLoadingSessionId: (id: string | null) => void;
  addMessage: (sessionId: string, msg: ChatMessage) => void;
  updateSession: (sessionId: string, updater: (s: Session) => Session) => void;
}

export const useSessionStore = create<SessionStore>((set) => ({
  sessions: [],
  activeSessionId: null,
  loadingSessionId: null,

  createSession: (companyName) => {
    const id = `session-${Date.now()}`;
    set((state) => ({
      sessions: [
        { id, companyName, messages: [], valuation: null },
        ...state.sessions,
      ],
      activeSessionId: id,
    }));
    return id;
  },

  setActiveSessionId: (id) => set({ activeSessionId: id }),

  setLoadingSessionId: (id) => set({ loadingSessionId: id }),

  addMessage: (sessionId, msg) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, msg] }
          : s
      ),
    })),

  updateSession: (sessionId, updater) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? updater(s) : s
      ),
    })),
}));

export function useActiveSession() {
  return useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === s.activeSessionId) ?? null
  );
}

export function useMessages() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const session = useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === activeSessionId)
  );
  return session?.messages ?? [];
}

export function useCurrentValuation() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const session = useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === activeSessionId)
  );
  return session?.valuation ?? null;
}

export function useIsLoading() {
  return useSessionStore(
    (s) => s.loadingSessionId != null && s.loadingSessionId === s.activeSessionId
  );
}
