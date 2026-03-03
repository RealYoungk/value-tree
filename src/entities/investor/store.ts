import { create } from "zustand";
import { createClient } from "@/shared/supabase/client";

interface Investor {
  id: string;
  email: string;
  name: string | null;
  avatarUrl: string | null;
}

interface InvestorStore {
  investor: Investor | null;
  loading: boolean;
  init: () => Promise<void>;
  logout: () => Promise<void>;
}

export const useInvestorStore = create<InvestorStore>((set) => ({
  investor: null,
  loading: true,

  init: async () => {
    const supabase = createClient();

    // Get current session
    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (user) {
      set({
        investor: {
          id: user.id,
          email: user.email!,
          name: user.user_metadata?.full_name ?? null,
          avatarUrl: user.user_metadata?.avatar_url ?? null,
        },
        loading: false,
      });
    } else {
      set({ investor: null, loading: false });
    }

    // Listen for auth changes
    supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        set({
          investor: {
            id: session.user.id,
            email: session.user.email!,
            name: session.user.user_metadata?.full_name ?? null,
            avatarUrl: session.user.user_metadata?.avatar_url ?? null,
          },
          loading: false,
        });
      } else {
        set({ investor: null, loading: false });
      }
    });
  },

  logout: async () => {
    const supabase = createClient();
    await supabase.auth.signOut();
    set({ investor: null });
  },
}));
