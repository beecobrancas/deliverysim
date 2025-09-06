"use client";

import React, { createContext, useContext, useState, useEffect } from 'react';

export interface UserAccount {
  id: string;
  name: string;
  email: string;
  cpf: string;
  whatsapp: string;
  addresses: Array<{
    id: string;
    cep: string;
    endereco: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
    isDefault: boolean;
  }>;
  createdAt: string;
  lastLogin: string;
}

interface UserContextType {
  currentUser: UserAccount | null;
  users: UserAccount[];
  login: (email: string, password: string) => Promise<{ success: boolean; user?: UserAccount; error?: string }>;
  register: (userData: {
    name: string;
    email: string;
    cpf: string;
    whatsapp: string;
    password: string;
  }) => Promise<{ success: boolean; user?: UserAccount; error?: string }>;
  logout: () => void;
  updateUserAddress: (userId: string, addressData: any) => void;
  getAllUsers: () => UserAccount[];
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [currentUser, setCurrentUser] = useState<UserAccount | null>(null);
  const [users, setUsers] = useState<UserAccount[]>([]);

  useEffect(() => {
    // Carregar usuários salvos
    try {
      const savedUsers = localStorage.getItem('user_accounts');
      if (savedUsers) {
        setUsers(JSON.parse(savedUsers));
      }

      // Verificar se há usuário logado
      const savedCurrentUser = localStorage.getItem('current_user');
      if (savedCurrentUser) {
        setCurrentUser(JSON.parse(savedCurrentUser));
      }
    } catch (error) {
      console.error('Erro ao carregar usuários:', error);
    }
  }, []);

  useEffect(() => {
    // Salvar usuários sempre que houver mudanças
    try {
      localStorage.setItem('user_accounts', JSON.stringify(users));
    } catch (error) {
      console.error('Erro ao salvar usuários:', error);
    }
  }, [users]);

  const login = async (email: string, password: string): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
    try {
      // Buscar usuário por email
      const user = users.find(u => u.email.toLowerCase() === email.toLowerCase());
      
      if (!user) {
        return { success: false, error: 'Usuário não encontrado' };
      }

      // Verificar senha (simulação - em produção seria hash)
      const savedPassword = localStorage.getItem(`password_${user.id}`);
      if (savedPassword !== password) {
        return { success: false, error: 'Senha incorreta' };
      }

      // Atualizar último login
      const updatedUser = { ...user, lastLogin: new Date().toISOString() };
      setUsers(prev => prev.map(u => u.id === user.id ? updatedUser : u));
      setCurrentUser(updatedUser);
      localStorage.setItem('current_user', JSON.stringify(updatedUser));

      return { success: true, user: updatedUser };
    } catch (error) {
      return { success: false, error: 'Erro interno' };
    }
  };

  const register = async (userData: {
    name: string;
    email: string;
    cpf: string;
    whatsapp: string;
    password: string;
  }): Promise<{ success: boolean; user?: UserAccount; error?: string }> => {
    try {
      // Verificar se email já existe
      const existingUser = users.find(u => u.email.toLowerCase() === userData.email.toLowerCase());
      if (existingUser) {
        return { success: false, error: 'Email já cadastrado' };
      }

      // Criar novo usuário
      const newUser: UserAccount = {
        id: Date.now().toString(),
        name: userData.name,
        email: userData.email,
        cpf: userData.cpf,
        whatsapp: userData.whatsapp,
        addresses: [],
        createdAt: new Date().toISOString(),
        lastLogin: new Date().toISOString()
      };

      // Salvar senha separadamente
      localStorage.setItem(`password_${newUser.id}`, userData.password);

      // Adicionar usuário à lista
      setUsers(prev => [...prev, newUser]);
      setCurrentUser(newUser);
      localStorage.setItem('current_user', JSON.stringify(newUser));

      return { success: true, user: newUser };
    } catch (error) {
      return { success: false, error: 'Erro ao criar conta' };
    }
  };

  const logout = () => {
    setCurrentUser(null);
    localStorage.removeItem('current_user');
  };

  const updateUserAddress = (userId: string, addressData: any) => {
    setUsers(prev => prev.map(user => {
      if (user.id === userId) {
        const newAddress = {
          id: Date.now().toString(),
          ...addressData,
          isDefault: user.addresses.length === 0
        };
        return {
          ...user,
          addresses: [...user.addresses, newAddress]
        };
      }
      return user;
    }));
  };

  const getAllUsers = () => users;

  const value: UserContextType = {
    currentUser,
    users,
    login,
    register,
    logout,
    updateUserAddress,
    getAllUsers
  };

  return (
    <UserContext.Provider value={value}>
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error('useUser deve ser usado dentro de um UserProvider');
  }
  return context;
}