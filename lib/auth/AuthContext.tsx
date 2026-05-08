"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";

export type DirectusAuthUser = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  role: { id: string; name: string; admin_access: boolean } | null;
};

const ROLE_ALIASES: Record<string, string> = {
  administrator: "admin",
  admin: "admin",
  manager: "manager",
  frontdesk: "frontdesk",
  "front desk": "frontdesk",
  "event organiser": "event organiser",
  "event organizer": "event organiser",
  "event guest": "event guest",
};

function normalizeRole(user: DirectusAuthUser | null): string | null {
  if (!user) return null;
  const name = user.role?.name?.trim().toLowerCase();
  if (!name) return user.role?.admin_access ? "admin" : null;
  return ROLE_ALIASES[name] ?? name;
}

export interface AuthContextState {
  user: DirectusAuthUser | null;
  userRole: string | null;
  isAdmin: boolean;
  isManager: boolean;
  isFrontdesk: boolean;
  isEventOrganiser: boolean;
  isEventGuest: boolean;
  loading: boolean;
  error: Error | null;
  refresh: () => Promise<void>;
}

const initialState: Omit<AuthContextState, "refresh"> = {
  user: null,
  userRole: null,
  isAdmin: false,
  isManager: false,
  isFrontdesk: false,
  isEventOrganiser: false,
  isEventGuest: false,
  loading: true,
  error: null,
};

const AuthContext = createContext<AuthContextState>({
  ...initialState,
  refresh: async () => {},
});

export function AuthProvider({ children }: { children: ReactNode }) {
  const [state, setState] = useState<Omit<AuthContextState, "refresh">>(initialState);

  const load = useCallback(async () => {
    try {
      const res = await fetch("/api/auth/me", { cache: "no-store" });
      if (!res.ok) throw new Error(`auth/me ${res.status}`);
      const { user } = (await res.json()) as { user: DirectusAuthUser | null };
      const userRole = normalizeRole(user);
      const isAdmin = userRole === "admin" || !!user?.role?.admin_access;
      const isManager = userRole === "manager" || isAdmin;
      const isFrontdesk = userRole === "frontdesk" || isManager;
      const isEventOrganiser = userRole === "event organiser" || isManager;
      const isEventGuest = userRole === "event guest" || isEventOrganiser || isManager;
      setState({
        user,
        userRole,
        isAdmin,
        isManager,
        isFrontdesk,
        isEventOrganiser,
        isEventGuest,
        loading: false,
        error: null,
      });
    } catch (err) {
      setState({
        ...initialState,
        loading: false,
        error: err instanceof Error ? err : new Error(String(err)),
      });
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  return (
    <AuthContext.Provider value={{ ...state, refresh: load }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  return useContext(AuthContext);
}
