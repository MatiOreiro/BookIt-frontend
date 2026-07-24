import {
  createContext,
  useEffect,
  useState,
  type ReactNode,
} from 'react';
import type { User } from '../types/auth';
import { getCurrentUser, logout as logoutService } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthData: (token: string, user: User) => void;
  refreshUser: () => Promise<User | null>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextValue | null>(null);

const normalizeStoredUser = (value: unknown): User | null => {
  if (!value || typeof value !== 'object') {
    return null;
  }

  const candidate = value as Record<string, unknown>;
  const id = candidate.id ?? candidate.Id;
  const name = candidate.name ?? candidate.Nombre ?? candidate.nombre;
  const email = candidate.email ?? candidate.Email ?? candidate.email;
  const role = candidate.role ?? candidate.Rol ?? candidate.rol;
  const profileImageUrl = candidate.profileImageUrl ?? candidate.ProfileImageUrl;

  if (
    typeof id !== 'string' ||
    typeof name !== 'string' ||
    typeof email !== 'string' ||
    typeof role !== 'string'
  ) {
    return null;
  }

  return {
    id,
    name,
    email,
    role: role.toLowerCase(),
    profileImageUrl: typeof profileImageUrl === 'string' ? profileImageUrl : null,
  };
};

const getStoredUser = (): User | null => {
  try {
    if (globalThis.window === undefined) return null;
    const raw = globalThis.localStorage.getItem('user');
    return raw ? normalizeStoredUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(getStoredUser);
  const [token, setToken] = useState<string | null>(() => {
    try {
      return globalThis.window === undefined ? null : globalThis.localStorage.getItem('token');
    } catch {
      return null;
    }
  });
  const [isLoading, setIsLoading] = useState<boolean>(() => {
    try {
      return globalThis.window !== undefined && Boolean(globalThis.localStorage.getItem('token'));
    } catch {
      return false;
    }
  });

  const logout = () => {
    logoutService();
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  useEffect(() => {
    if (!token) {
      setIsLoading(false);
      return;
    }

    let cancelled = false;

    (async () => {
      try {
        const currentUser = await getCurrentUser();
        if (cancelled) return;
        localStorage.setItem('user', JSON.stringify(currentUser));
        setUser(currentUser);
      } catch {
        if (!cancelled) logout();
      } finally {
        if (!cancelled) {
          setIsLoading(false);
        }
      }
    })();

    return () => {
      cancelled = true;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const setAuthData = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const refreshUser = async (): Promise<User | null> => {
    if (!token) {
      return null;
    }

    try {
      const currentUser = await getCurrentUser();
      localStorage.setItem('user', JSON.stringify(currentUser));
      setUser(currentUser);
      return currentUser;
    } catch {
      return null;
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading,
        setAuthData,
        refreshUser,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
