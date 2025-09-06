"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Product } from '@/types/product';
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface AdminContextType {
  products: Product[];
  updateProduct: (id: string, updates: Partial<Product>) => Promise<void>;
  addProduct: (product: Omit<Product, 'id' | 'created_at'>) => Promise<void>;
  deleteProduct: (id: string) => Promise<void>;
  reorderProducts: (newOrder: Product[]) => void;
  resetProducts: () => void;
}

const AdminContext = createContext<AdminContextType | undefined>(undefined);

export function AdminProvider({ children }: { children: React.ReactNode }) {
  const [products, setProducts] = useState<Product[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchProducts = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar produtos:', error);
      toast.error('Erro ao carregar produtos.');
      setProducts([]);
    } else {
      // Mapear dados do Supabase (snake_case) para o formato do app (camelCase)
      const mappedData = data.map(p => ({
        ...p,
        originalPrice: p.originalprice,
        stockLimit: p.stocklimit,
        customizationGroups: p.customizationgroups,
      }));
      setProducts(mappedData || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchProducts();
  }, [fetchProducts]);

  const updateProduct = async (id: string, updates: Partial<Product>) => {
    const { originalPrice, stockLimit, customizationGroups, ...rest } = updates;
    
    // Mapear do formato do app (camelCase) para o do Supabase (snake_case)
    const supabaseData: { [key: string]: any } = { ...rest };
    if (originalPrice !== undefined) supabaseData.originalprice = originalPrice;
    if (stockLimit !== undefined) supabaseData.stocklimit = stockLimit;
    if (customizationGroups !== undefined) supabaseData.customizationgroups = customizationGroups;

    const { error } = await supabase
      .from('products')
      .update(supabaseData)
      .eq('id', id);

    if (error) {
      console.error('Erro ao atualizar produto:', error);
      toast.error(`Erro ao atualizar produto: ${error.message}`);
    } else {
      toast.success('Produto atualizado com sucesso!');
      fetchProducts();
    }
  };

  const addProduct = async (newProduct: Omit<Product, 'id' | 'created_at'>) => {
    const { originalPrice, stockLimit, customizationGroups, ...rest } = newProduct;

    // Mapear do formato do app (camelCase) para o do Supabase (snake_case)
    const supabaseData = {
      ...rest,
      originalprice: originalPrice,
      stocklimit: stockLimit,
      customizationgroups: customizationGroups,
    };

    const { error } = await supabase
      .from('products')
      .insert([supabaseData]);

    if (error) {
      console.error('Erro ao adicionar produto:', error);
      toast.error(`Erro ao adicionar produto: ${error.message}`);
    } else {
      toast.success('Produto adicionado com sucesso!');
      fetchProducts();
    }
  };

  const deleteProduct = async (id: string) => {
    const { error } = await supabase
      .from('products')
      .delete()
      .eq('id', id);

    if (error) {
      console.error('Erro ao deletar produto:', error);
      toast.error('Erro ao deletar produto.');
    } else {
      toast.success('Produto excluído com sucesso!');
      fetchProducts();
    }
  };

  const reorderProducts = (newOrder: Product[]) => {
    setProducts(newOrder);
    toast.info("A ordem dos produtos foi atualizada na visualização. Para salvar, seria necessário uma coluna de ordenação.");
  };

  const resetProducts = async () => {
    setProducts([]);
    toast.info("Para resetar os produtos, por favor, gerencie os dados no seu dashboard do Supabase.");
  };

  const value: AdminContextType = {
    products,
    updateProduct,
    addProduct,
    deleteProduct,
    reorderProducts,
    resetProducts
  };

  return (
    <AdminContext.Provider value={value}>
      {children}
    </AdminContext.Provider>
  );
}

export function useAdmin() {
  const context = useContext(AdminContext);
  if (context === undefined) {
    throw new Error('useAdmin deve ser usado dentro de um AdminProvider');
  }
  return context;
}