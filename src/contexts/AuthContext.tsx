import { createContext, useContext, useState, useEffect, ReactNode } from "react";
import { auth, User } from "@/api/client";

interface AuthContextType {
  user: User | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(auth.getUser());
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (auth.isLoggedIn()) {
      auth.me()
        .then((data) => setUser(data.user))
        .catch(() => {
          setUser(null);
          localStorage.removeItem("leily_token");
          localStorage.removeItem("leily_user");
        })
        .finally(() => setLoading(false));
    } else {
      setLoading(false);
    }
  }, []);

  const login = async (email: string, password: string) => {
    const data = await auth.login(email, password);
    setUser(data.user);
  };

  const register = async (email: string, password: string, name?: string) => {
    const data = await auth.register(email, password, name);
    setUser(data.user);
  };

  const logout = () => {
    setUser(null);
    auth.logout();
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
}
