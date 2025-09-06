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
  reorderCategories: (categories: Category[]) => Promise<void>;
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
      .order('created_at', { ascending: true }); // Ordenar por data de criação em vez de alfabética

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

  const reorderCategories = async (reorderedCategories: Category[]) => {
    try {
      // Atualizar a ordem localmente primeiro para feedback imediato
      setCategories(reorderedCategories);

      // Para simular a reordenação, vamos deletar todas e recriar na nova ordem
      // Isso é uma solução simples já que não temos um campo de ordem na tabela
      const categoryNames = reorderedCategories.map(cat => cat.name);
      
      // Deletar todas as categorias
      const { error: deleteError } = await supabase
        .from('categories')
        .delete()
        .neq('id', '00000000-0000-0000-0000-000000000000'); // Deletar todas

      if (deleteError) {
        throw deleteError;
      }

      // Recriar na nova ordem
      const { error: insertError } = await supabase
        .from('categories')
        .insert(categoryNames.map(name => ({ name })));

      if (insertError) {
        throw insertError;
      }

      // Recarregar para obter os novos IDs
      await fetchCategories();
      toast.success('Ordem das categorias atualizada!');
    } catch (error) {
      console.error('Erro ao reordenar categorias:', error);
      toast.error('Erro ao reordenar categorias.');
      // Reverter para o estado anterior em caso de erro
      fetchCategories();
    }
  };

  const value: CategoryContextType = {
    categories,
    addCategory,
    updateCategory,
    deleteCategory,
    reorderCategories,
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