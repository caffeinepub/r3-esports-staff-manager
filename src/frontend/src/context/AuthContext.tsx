import { type ReactNode, createContext, useContext, useState } from "react";

export type UserRole = "owner" | "seniorAdmin" | "staff";

export interface AuthState {
  userId: bigint | null;
  username: string | null;
  role: UserRole | null;
}

interface AuthContextValue extends AuthState {
  login: (userId: bigint, username: string, role: string) => void;
  logout: () => void;
  updateUsername: (newUsername: string) => void;
  isAuthenticated: boolean;
  canManageStaff: boolean;
  canSendAnnouncements: boolean;
  canViewPasswords: boolean;
  canDemote: (targetRole: string) => boolean;
  canIssueWarning: (targetRole: string) => boolean;
  canChangePasswordFor: (targetRole: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "r3esports_auth";

export function AuthProvider({ children }: { children: ReactNode }) {
  const [auth, setAuth] = useState<AuthState>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        return {
          userId: parsed.userId ? BigInt(parsed.userId) : null,
          username: parsed.username,
          role: parsed.role as UserRole | null,
        };
      }
    } catch {
      // ignore
    }
    return { userId: null, username: null, role: null };
  });

  const login = (userId: bigint, username: string, role: string) => {
    const newAuth: AuthState = {
      userId,
      username,
      role: role as UserRole,
    };
    setAuth(newAuth);
    localStorage.setItem(
      STORAGE_KEY,
      JSON.stringify({
        userId: userId.toString(),
        username,
        role,
      }),
    );
  };

  const logout = () => {
    setAuth({ userId: null, username: null, role: null });
    localStorage.removeItem(STORAGE_KEY);
  };

  const updateUsername = (newUsername: string) => {
    setAuth((prev) => {
      const updated = { ...prev, username: newUsername };
      try {
        const stored = localStorage.getItem(STORAGE_KEY);
        if (stored) {
          const parsed = JSON.parse(stored);
          localStorage.setItem(
            STORAGE_KEY,
            JSON.stringify({ ...parsed, username: newUsername }),
          );
        }
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const isAuthenticated = auth.userId !== null;
  const role = auth.role;

  // Owner and SeniorAdmin can manage staff (view user list, demotion panel)
  const canManageStaff = role === "owner" || role === "seniorAdmin";
  // Owner and SeniorAdmin can send announcements
  const canSendAnnouncements = role === "owner" || role === "seniorAdmin";
  // Only owners can view the passwords tab
  const canViewPasswords = role === "owner";

  const canDemote = (targetRole: string) => {
    if (role === "owner") return targetRole !== "owner";
    if (role === "seniorAdmin") return targetRole === "staff";
    return false;
  };

  const canIssueWarning = (targetRole: string) => {
    if (role === "owner") return targetRole !== "owner";
    if (role === "seniorAdmin") return targetRole === "staff";
    return false;
  };

  const canChangePasswordFor = (_targetRole: string) => {
    if (role === "owner") return true;
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        login,
        logout,
        updateUsername,
        isAuthenticated,
        canManageStaff,
        canSendAnnouncements,
        canViewPasswords,
        canDemote,
        canIssueWarning,
        canChangePasswordFor,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
