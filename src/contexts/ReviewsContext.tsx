"use client";

import React, { createContext, useContext, useState, useEffect, useCallback } from 'react';
import { Review } from '@/types/product'; // Usando um tipo unificado
import { supabase } from '@/lib/supabase';
import { toast } from 'sonner';

interface ReviewsContextType {
  reviews: Review[];
  updateReview: (id: string, updates: Partial<Review>) => Promise<void>;
  addReview: (review: Omit<Review, 'id'>) => Promise<void>;
  deleteReview: (id: string) => Promise<void>;
  reorderReviews: (newOrder: Review[]) => void;
  resetReviews: () => void;
}

const ReviewsContext = createContext<ReviewsContextType | undefined>(undefined);

export function ReviewsProvider({ children }: { children: React.ReactNode }) {
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(true);

  const fetchReviews = useCallback(async () => {
    setLoading(true);
    const { data, error } = await supabase
      .from('reviews')
      .select('*')
      .order('created_at', { ascending: true });

    if (error) {
      console.error('Erro ao buscar avaliações:', error);
      toast.error('Erro ao carregar avaliações.');
      setReviews([]);
    } else {
      setReviews(data || []);
    }
    setLoading(false);
  }, []);

  useEffect(() => {
    fetchReviews();
  }, [fetchReviews]);

  const updateReview = async (id: string, updates: Partial<Review>) => {
    const { error } = await supabase
      .from('reviews')
      .update(updates)
      .eq('id', id);

    if (error) {
      toast.error('Erro ao atualizar avaliação.');
    } else {
      toast.success('Avaliação atualizada!');
      fetchReviews();
    }
  };

  const addReview = async (newReview: Omit<Review, 'id'>) => {
    const { error } = await supabase
      .from('reviews')
      .insert([newReview]);

    if (error) {
      toast.error('Erro ao adicionar avaliação.');
    } else {
      toast.success('Avaliação adicionada!');
      fetchReviews();
    }
  };

  const deleteReview = async (id: string) => {
    const { error } = await supabase
      .from('reviews')
      .delete()
      .eq('id', id);

    if (error) {
      toast.error('Erro ao excluir avaliação.');
    } else {
      toast.success('Avaliação excluída!');
      fetchReviews();
    }
  };

  const reorderReviews = (newOrder: Review[]) => {
    setReviews(newOrder);
    toast.info("Ordem atualizada na visualização.");
  };

  const resetReviews = () => {
    setReviews([]);
    toast.info("Para resetar, gerencie os dados no dashboard do Supabase.");
  };

  const value: ReviewsContextType = {
    reviews,
    updateReview,
    addReview,
    deleteReview,
    reorderReviews,
    resetReviews,
  };

  return (
    <ReviewsContext.Provider value={value}>
      {children}
    </ReviewsContext.Provider>
  );
}

export function useReviews() {
  const context = useContext(ReviewsContext);
  if (context === undefined) {
    throw new Error('useReviews deve ser usado dentro de um ReviewsProvider');
  }
  return context;
}