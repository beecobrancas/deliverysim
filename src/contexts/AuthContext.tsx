"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

interface User {
  email: string;
  isAdmin: boolean;
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isAdmin: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

const ADMIN_CREDENTIALS = [
  { email: 'lt@bossmode.dev', password: 'pato12345' },
  { email: 'k7@bossmode.dev', password: 'kaua12345' }
];

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    // Verificar se há sessão salva
    const savedUser = localStorage.getItem('admin_user');
    if (savedUser) {
      setUser(JSON.parse(savedUser));
    }
  }, []);

  const login = async (email: string, password: string): Promise<boolean> => {
    const adminUserCredentials = ADMIN_CREDENTIALS.find(
      cred => cred.email === email && cred.password === password
    );

    if (adminUserCredentials) {
      const adminUser: User = {
        email: adminUserCredentials.email,
        isAdmin: true
      };
      setUser(adminUser);
      localStorage.setItem('admin_user', JSON.stringify(adminUser));
      return true;
    }
    return false;
  };

  const logout = () => {
    setUser(null);
    localStorage.removeItem('admin_user');
  };

  const value: AuthContextType = {
    user,
    isAuthenticated: !!user,
    isAdmin: user?.isAdmin || false,
    login,
    logout
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth deve ser usado dentro de um AuthProvider');
  }
  return context;
}