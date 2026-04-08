import { create } from "zustand";

type User = { id: string; email: string; name?: string } | null;

interface AuthState {
  user: User;
  setUser: (u: User) => void;
}

export const useAuthStore = create<AuthState>((set) => ({
  user: null,
  setUser: (user) => set({ user }),
}));
