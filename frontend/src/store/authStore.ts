import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Gender, User, UserRole } from "@rideshare/types";
import type { AppLanguage } from "../i18n/translations";

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

export const useAuthStore = create<AuthState>()(
  persist(
    (set, get) => ({
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
          user?.aadhaarVerified && user?.dlVerified && user?.faceMatchDone && role && role !== "passenger",
        );
      },
    }),
    { name: "rideshare-auth" },
  ),
);

export type { Gender, AppLanguage };
