import { create } from "zustand";
import type { Gender, User, UserRole } from "@rideshare/types";

export type AppLanguage = "en" | "hi" | "ta";

interface AuthState {
  sessionToken: string | null;
  refreshToken: string | null;
  user: User | null;
  language: AppLanguage;
  setSession: (sessionToken: string, refreshToken: string, user: User) => void;
  setUser: (user: User) => void;
  setLanguage: (language: AppLanguage) => void;
  signOut: () => void;
  isKycComplete: () => boolean;
  canDrive: () => boolean;
}

export const useAuthStore = create<AuthState>((set, get) => ({
  sessionToken: null,
  refreshToken: null,
  user: null,
  language: "en",
  setSession: (sessionToken, refreshToken, user) => set({ sessionToken, refreshToken, user }),
  setUser: (user) => set({ user }),
  setLanguage: (language) => set({ language }),
  signOut: () => set({ sessionToken: null, refreshToken: null, user: null }),
  isKycComplete: () => {
    const user = get().user;
    return Boolean(user?.aadhaarVerified && user?.faceMatchDone);
  },
  canDrive: () => {
    const user = get().user;
    const role: UserRole | undefined = user?.role;
    return Boolean(
      user?.aadhaarVerified && user?.dlVerified && user?.faceMatchDone && role && role !== "passenger"
    );
  },
}));

export type { Gender };
