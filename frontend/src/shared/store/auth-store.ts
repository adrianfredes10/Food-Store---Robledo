import { create } from "zustand";
import { persist } from "zustand/middleware";

interface User {
  id: number;
  nombre: string;
  apellido: string | null;
  email: string;
  roles: string[];
  created_at?: string;
}

type AuthState = {
  access_token: string | null;
  refresh_token: string | null;
  user: User | null;
  isAuthenticated: boolean;
  setTokens: (access: string | null, refresh: string | null) => void;
  setUser: (user: User | null) => void;
  logout: () => void;
};

// guardo el token en localStorage para que no se pierda al recargar
export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
      access_token: null,
      refresh_token: null,
      user: null,
      isAuthenticated: false,
      setTokens: (access, refresh) =>
        set({ access_token: access, refresh_token: refresh, isAuthenticated: !!access }),
      setUser: (user) => set({ user }),
      logout: () => {
        const hadSession = Boolean(get().access_token);
        set({ access_token: null, refresh_token: null, user: null, isAuthenticated: false });
        if (hadSession && typeof window !== "undefined") {
          window.location.replace("/");
        }
      },
    }),
    {
      name: "foodstore-auth",
      partialize: (s) => ({
        access_token: s.access_token,
        refresh_token: s.refresh_token,
      }),
    },
  ),
);
