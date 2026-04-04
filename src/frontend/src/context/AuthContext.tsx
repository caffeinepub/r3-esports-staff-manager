import {
  type ReactNode,
  createContext,
  useContext,
  useEffect,
  useState,
} from "react";

export type UserRole = "owner" | "seniorAdmin" | "admin" | "staff";

export interface AuthState {
  userId: bigint | null;
  username: string | null;
  role: UserRole | null;
}

interface AuthContextValue extends AuthState {
  login: (userId: bigint, username: string, role: string) => void;
  logout: () => void;
  isAuthenticated: boolean;
  canManageStaff: boolean;
  canSendAnnouncements: boolean;
  canViewPasswords: boolean;
  canDemote: (targetRole: string) => boolean;
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

  const isAuthenticated = auth.userId !== null;
  const role = auth.role;

  const canManageStaff = role === "owner" || role === "seniorAdmin";
  const canSendAnnouncements = role === "owner" || role === "seniorAdmin";
  const canViewPasswords = role === "owner" || role === "seniorAdmin";

  const canDemote = (targetRole: string) => {
    if (role === "owner") return targetRole !== "owner";
    if (role === "seniorAdmin")
      return targetRole === "staff" || targetRole === "admin";
    return false;
  };

  return (
    <AuthContext.Provider
      value={{
        ...auth,
        login,
        logout,
        isAuthenticated,
        canManageStaff,
        canSendAnnouncements,
        canViewPasswords,
        canDemote,
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
