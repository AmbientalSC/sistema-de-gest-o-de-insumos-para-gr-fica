
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User } from '../types';
import { apiLogin, apiSignOut } from '../services/firebaseApi';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  toggleRole?: () => void;
  candidates?: User[] | null;
  selectProfile?: (userId: number | string) => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [candidates, setCandidates] = useState<User[] | null>(null);

  const login = useCallback(async (username: string, password: string) => {
    try {
      const res = await apiLogin(username, password);
      if (res.candidates && res.candidates.length > 0) {
        // Multiple profiles: store candidates and let UI handle selection
        setCandidates(res.candidates as User[]);
        return;
      }
      if (res.user) {
        setUser(res.user);
        localStorage.setItem('user', JSON.stringify(res.user));
      }
    } catch (error) {
      console.error('Login failed:', error);
      throw error;
    }
  }, []);

  const logout = useCallback(async () => {
    try {
      await apiSignOut();
      setUser(null);
      localStorage.removeItem('user');
    } catch (error) {
      console.error('Logout failed:', error);
      // Remove local data anyway
      setUser(null);
      localStorage.removeItem('user');
    }
  }, []);

  const toggleRole = useCallback(() => {
    setUser(prev => {
      if (!prev) return prev;
      const newRole = prev.role === 'Manager' ? 'Collaborator' : 'Manager';
      const updated = { ...prev, role: newRole as any };
      localStorage.setItem('user', JSON.stringify(updated));
      return updated;
    });
  }, []);

  const selectProfile = useCallback((userId: number | string) => {
    if (!candidates) return;
    const selected = candidates.find(c => c.id === userId);
    if (!selected) return;
    setUser(selected);
    localStorage.setItem('user', JSON.stringify(selected));
    setCandidates(null);
  }, [candidates]);

  return (
    <AuthContext.Provider value={{ user, login, logout, toggleRole, candidates, selectProfile }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = (): AuthContextType => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};
