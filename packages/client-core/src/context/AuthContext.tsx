import {
  createContext,
  useContext,
  useEffect,
  useState,
  ReactNode,
} from "react";
import { User, LoginCredentials } from "@domas/ts-types";
import { auth } from "@domas/api-client";

export interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (credentials: LoginCredentials) => Promise<User>;
  logout: () => Promise<void>;
  hasPermission: (permission?: string) => boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    checkAuth();
  }, []);

  const checkAuth = async () => {
    try {
      const profile = await auth.getProfile();
      setUser(profile);
    } catch (error) {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  const login = async (credentials: LoginCredentials): Promise<User> => {
    const user = await auth.login(credentials);
    setUser(user);
    return user;
  };

  const logout = async () => {
    await auth.logout();
    setUser(null);
  };

  const hasPermission = (permission?: string) => {
    if (!permission) return true;
    if (!user) return false;
    if (user.isRecoveryAdmin) return true;
    return user.permissions?.includes(permission) || false;
  };

  return (
    <AuthContext.Provider
      value={{ user, isLoading, login, logout, hasPermission }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
