import { type ReactNode, createContext, useContext, useState } from "react";

export type UserRole = "owner" | "seniorAdmin" | "staff";

export interface AuthState {
  userId: bigint | null;
  username: string | null;
  role: UserRole | null;
}

interface AuthContextValue extends AuthState {
  login: (
    userId: bigint,
    username: string,
    role: string,
    password?: string,
  ) => void;
  logout: () => void;
  updateUsername: (newUsername: string) => void;
  getStoredCredentials: () => { username: string; password: string } | null;
  isAuthenticated: boolean;
  canManageStaff: boolean;
  canSendAnnouncements: boolean;
  canViewPasswords: boolean;
  canRenameUsers: boolean;
  canDemote: (targetRole: string) => boolean;
  canIssueWarning: (targetRole: string) => boolean;
  canChangePasswordFor: (targetRole: string) => boolean;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const STORAGE_KEY = "r3esports_auth";
const CREDS_KEY = "r3esports_creds";

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

  const login = (
    userId: bigint,
    username: string,
    role: string,
    password?: string,
  ) => {
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
    // Persist credentials for auto-relogin after canister restarts
    if (password) {
      localStorage.setItem(CREDS_KEY, JSON.stringify({ username, password }));
    }
  };

  const logout = () => {
    setAuth({ userId: null, username: null, role: null });
    localStorage.removeItem(STORAGE_KEY);
    localStorage.removeItem(CREDS_KEY);
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
        // Also update stored creds username
        const storedCreds = localStorage.getItem(CREDS_KEY);
        if (storedCreds) {
          const parsed = JSON.parse(storedCreds);
          localStorage.setItem(
            CREDS_KEY,
            JSON.stringify({ ...parsed, username: newUsername }),
          );
        }
      } catch {
        // ignore
      }
      return updated;
    });
  };

  const getStoredCredentials = (): {
    username: string;
    password: string;
  } | null => {
    try {
      const stored = localStorage.getItem(CREDS_KEY);
      if (stored) {
        const parsed = JSON.parse(stored);
        if (parsed.username && parsed.password) {
          return { username: parsed.username, password: parsed.password };
        }
      }
    } catch {
      // ignore
    }
    return null;
  };

  const isAuthenticated = auth.userId !== null;
  const role = auth.role;

  // Owner and SeniorAdmin can manage staff (view user list, demotion panel)
  const canManageStaff = role === "owner" || role === "seniorAdmin";
  // Owner and SeniorAdmin can send announcements
  const canSendAnnouncements = role === "owner" || role === "seniorAdmin";
  // Only owners can view the passwords tab
  const canViewPasswords = role === "owner";
  // Owners and Senior Admins can rename users
  const canRenameUsers = role === "owner" || role === "seniorAdmin";

  const canDemote = (targetRole: string) => {
    if (role === "owner") return targetRole !== "owner";
    if (role === "seniorAdmin")
      return targetRole === "staff" || targetRole === "seniorAdmin";
    return false;
  };

  const canIssueWarning = (targetRole: string) => {
    if (role === "owner") return targetRole !== "owner";
    if (role === "seniorAdmin")
      return targetRole === "staff" || targetRole === "seniorAdmin";
    return false;
  };

  const canChangePasswordFor = (targetRole: string) => {
    if (role === "owner") return true;
    if (role === "seniorAdmin") return targetRole !== "owner";
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        login,
        logout,
        updateUsername,
        getStoredCredentials,
        isAuthenticated,
        canManageStaff,
        canSendAnnouncements,
        canViewPasswords,
        canRenameUsers,
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
