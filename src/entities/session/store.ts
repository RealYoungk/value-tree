import { create } from "zustand";
import { createClient } from "@/shared/supabase/client";
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
  loadingStatus: string | null;
  sessionsLoaded: boolean;

  createSession: (companyName: string) => string;
  setActiveSessionId: (id: string | null) => void;
  setLoadingSessionId: (id: string | null, status?: string) => void;
  addMessage: (sessionId: string, msg: ChatMessage) => void;
  updateSession: (sessionId: string, updater: (s: Session) => Session) => void;
  loadSessions: (investorId: string) => Promise<void>;
  saveSession: (session: Session, investorId: string) => Promise<void>;
  deleteSession: (sessionId: string) => Promise<void>;
  clearSessions: () => void;
}

let saveTimer: ReturnType<typeof setTimeout> | null = null;

export const useSessionStore = create<SessionStore>((set, get) => ({
  sessions: [],
  activeSessionId: null,
  loadingSessionId: null,
  loadingStatus: null,
  sessionsLoaded: false,

  createSession: (companyName) => {
    const id = crypto.randomUUID();
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

  setLoadingSessionId: (id, status) =>
    set({ loadingSessionId: id, loadingStatus: status ?? null }),

  addMessage: (sessionId, msg) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId
          ? { ...s, messages: [...s.messages, msg] }
          : s,
      ),
    })),

  updateSession: (sessionId, updater) =>
    set((state) => ({
      sessions: state.sessions.map((s) =>
        s.id === sessionId ? updater(s) : s,
      ),
    })),

  loadSessions: async (investorId) => {
    const supabase = createClient();
    const { data, error } = await supabase
      .from("sessions")
      .select("*")
      .eq("investor_id", investorId)
      .order("updated_at", { ascending: false });

    if (error) {
      console.error("Failed to load sessions:", error);
      set({ sessionsLoaded: true });
      return;
    }

    const sessions: Session[] = (data ?? []).map((row) => ({
      id: row.id,
      companyName: row.company_name,
      messages: (row.messages as ChatMessage[]) ?? [],
      valuation: (row.valuation as Valuation) ?? null,
    }));

    set({ sessions, sessionsLoaded: true });
  },

  saveSession: async (session, investorId) => {
    // Debounce: wait 1s after last call
    if (saveTimer) clearTimeout(saveTimer);
    saveTimer = setTimeout(async () => {
      const supabase = createClient();
      const { error } = await supabase.from("sessions").upsert(
        {
          id: session.id,
          investor_id: investorId,
          company_name: session.companyName,
          messages: session.messages as unknown as Record<string, unknown>[],
          valuation: session.valuation as unknown as Record<string, unknown>,
          updated_at: new Date().toISOString(),
        },
        { onConflict: "id" },
      );
      if (error) {
        console.error("Failed to save session:", error);
      }
    }, 1000);
  },

  deleteSession: async (sessionId) => {
    const supabase = createClient();
    await supabase.from("sessions").delete().eq("id", sessionId);
    set((state) => ({
      sessions: state.sessions.filter((s) => s.id !== sessionId),
      activeSessionId:
        state.activeSessionId === sessionId ? null : state.activeSessionId,
    }));
  },

  clearSessions: () =>
    set({ sessions: [], activeSessionId: null, sessionsLoaded: false }),
}));

export function useActiveSession() {
  return useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === s.activeSessionId) ?? null,
  );
}

export function useMessages() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const session = useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === activeSessionId),
  );
  return session?.messages ?? [];
}

export function useCurrentValuation() {
  const activeSessionId = useSessionStore((s) => s.activeSessionId);
  const session = useSessionStore((s) =>
    s.sessions.find((sess) => sess.id === activeSessionId),
  );
  return session?.valuation ?? null;
}

export function useIsLoading() {
  return useSessionStore(
    (s) =>
      s.loadingSessionId != null &&
      s.loadingSessionId === s.activeSessionId,
  );
}

export function useLoadingStatus() {
  return useSessionStore((s) => s.loadingStatus);
}
