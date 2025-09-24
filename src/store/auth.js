import { create } from "zustand";

export const useAuth = create((set) => ({
  user: null,
  setUser: (u) => set({ user: u }),
  logout: () => {
    localStorage.removeItem("access_token");
    set({ user: null });
  },
}));
