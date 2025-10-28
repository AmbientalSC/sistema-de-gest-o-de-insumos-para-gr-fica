
import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';
import { User, Role } from '../types';
import { apiLogin, apiSignOut } from '../services/firebaseApi';

interface AuthContextType {
  user: User | null;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
  toggleRole?: () => void;
  candidates?: User[] | null;
  selectProfile?: (userId: number | string) => void;
  isImpersonating?: boolean;
  originalUser?: User | null;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const AuthProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [user, setUser] = useState<User | null>(() => {
    const storedUser = localStorage.getItem('user');
    return storedUser ? JSON.parse(storedUser) : null;
  });
  const [originalUser, setOriginalUser] = useState<User | null>(() => {
    const stored = localStorage.getItem('originalUser');
    return stored ? JSON.parse(stored) : null;
  });
  const [isImpersonating, setIsImpersonating] = useState<boolean>(() => {
    return localStorage.getItem('isImpersonating') === 'true';
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
    // Capture current values to avoid closure staleness inside setUser
    const currentlyImpersonating = isImpersonating;
    const orig = originalUser;

    setUser(prev => {
      if (!prev) return prev;

      // If current user is Manager and not impersonating, start impersonation
      if (prev.role === Role.Manager && !currentlyImpersonating) {
        setOriginalUser(prev);
        setIsImpersonating(true);
        const updated: User = { ...prev, role: Role.Collaborator };
        localStorage.setItem('user', JSON.stringify(updated));
        localStorage.setItem('originalUser', JSON.stringify(prev));
        localStorage.setItem('isImpersonating', 'true');
        return updated;
      }

      // If currently impersonating, restore original user
      if (currentlyImpersonating && orig) {
        const restored = orig;
        setOriginalUser(null);
        setIsImpersonating(false);
        localStorage.setItem('user', JSON.stringify(restored));
        localStorage.removeItem('originalUser');
        localStorage.setItem('isImpersonating', 'false');
        return restored;
      }

      // Otherwise, do nothing (e.g., collaborator cannot toggle)
      return prev;
    });
  }, [isImpersonating, originalUser]);

  const selectProfile = useCallback((userId: number | string) => {
    if (!candidates) return;
    const selected = candidates.find(c => c.id === userId);
    if (!selected) return;
    setUser(selected);
    localStorage.setItem('user', JSON.stringify(selected));
    setCandidates(null);
  }, [candidates]);

  return (
    <AuthContext.Provider value={{ user, login, logout, toggleRole, candidates, selectProfile, isImpersonating, originalUser }}>
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
