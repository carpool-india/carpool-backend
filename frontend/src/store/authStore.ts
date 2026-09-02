import { create } from "zustand";
import { persist } from "zustand/middleware";
import type { Gender, User, UserRole } from "@rideshare/types";

interface AuthState {
  sessionToken: string | null;
  refreshToken: string | null;
  user: User | null;
  setSession: (sessionToken: string, refreshToken: string, user: User) => void;
  setUser: (user: User) => void;
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
      setSession: (sessionToken, refreshToken, user) => set({ sessionToken, refreshToken, user }),
      setUser: (user) => set({ user }),
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

export type { Gender };
