import {
  createContext,
  useState,
  useEffect,
  type ReactNode,
} from 'react';
import type { User } from '../types/auth';
import { logout as logoutService } from '../services/authService';

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  setAuthData: (token: string, user: User) => void;
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
  };
};

const getStoredUser = (): User | null => {
  try {
    if (typeof window === 'undefined') return null;
    const raw = localStorage.getItem('user');
    return raw ? normalizeStoredUser(JSON.parse(raw)) : null;
  } catch {
    return null;
  }
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider = ({ children }: AuthProviderProps) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);

  useEffect(() => {
    setUser(getStoredUser());
    try {
      setToken(typeof window !== 'undefined' ? localStorage.getItem('token') : null);
    } catch {
      setToken(null);
    }
  }, []);

  const setAuthData = (newToken: string, newUser: User) => {
    localStorage.setItem('token', newToken);
    localStorage.setItem('user', JSON.stringify(newUser));
    setToken(newToken);
    setUser(newUser);
  };

  const logout = () => {
    logoutService();
    localStorage.removeItem('user');
    setToken(null);
    setUser(null);
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        token,
        isAuthenticated: Boolean(token),
        isLoading: false,
        setAuthData,
        logout,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

export default AuthContext;
