"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Category } from '@/types/product';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface CategoryContextType {
  categories: Category[];
  addCategory: (name: string) => Promise<void>;
  updateCategory: (id: string, name: string) => Promise<void>;
  deleteCategory: (id: string) => Promise<void>;
  loading: boolean;
}

const CategoryContext = createContext<CategoryContextType | undefined>(undefined);

export function CategoryProvider({ children }: { children: React.ReactNode }) {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchCategories = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('categories')
      .select('*')
      .order('name', { ascending: true });

    if (error) {
      console.error('Erro ao buscar categorias:', error);
      toast.error('Erro ao carregar categorias.');
    } else {
      setCategories(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  const addCategory = async (name: string) => {
    const { error } = await supabase.from('categories').insert([{ name }]);
    if (error) {
      toast.error(`Erro ao adicionar categoria: ${error.message}`);
    } else {
      toast.success('Categoria adicionada!');
      fetchCategories();
    }
  };

  const updateCategory = async (id: string, name: string) => {
    const { error } = await supabase.from('categories').update({ name }).eq('id', id);
    if (error) {
      toast.error(`Erro ao atualizar categoria: ${error.message}`);
    } else {
      toast.success('Categoria atualizada!');
      fetchCategories();
    }
  };

  const deleteCategory = async (id: string) => {
    const { error } = await supabase.from('categories').delete().eq('id', id);
    if (error) {
      toast.error(`Erro ao excluir categoria: ${error.message}`);
    } else {
      toast.success('Categoria excluída!');
      fetchCategories();
    }
  };

  const value: CategoryContextType = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    loading,
  };

  return (
    <CategoryContext.Provider value={value}>
      {children}
    </CategoryContext.Provider>
  );
}

export function useCategory() {
  const context = useContext(CategoryContext);
  if (context === undefined) {
    throw new Error('useCategory deve ser usado dentro de um CategoryProvider');
  }
  return context;
}