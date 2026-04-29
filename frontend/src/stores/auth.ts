import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { User } from "@/api/types";

type AuthState = {
  access: string | null;
  refresh: string | null;
  user: User | null;
  hydrated: boolean;
  setSession: (tokens: { access: string; refresh: string }, user: User) => void;
  setTokens: (access: string, refresh: string) => void;
  setUser: (user: User) => void;
  clear: () => void;
};

export const useAuthStore = create<AuthState>()(
  persist(
    (set) => ({
      access: null,
      refresh: null,
      user: null,
      hydrated: false,
      setSession: (tokens, user) =>
        set({ access: tokens.access, refresh: tokens.refresh, user }),
      setTokens: (access, refresh) => set({ access, refresh }),
      setUser: (user) => set({ user }),
      clear: () => set({ access: null, refresh: null, user: null }),
    }),
    {
      name: "lucivine.auth",
      onRehydrateStorage: () => (state) => {
        if (state) state.hydrated = true;
      },
    },
  ),
);

export const isAuthenticated = () => Boolean(useAuthStore.getState().access);
