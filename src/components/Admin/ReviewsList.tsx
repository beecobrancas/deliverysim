"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Review } from '@/types/product';
import { Plus, Edit, Trash2, Star } from 'lucide-react';

interface ReviewsListProps {
  reviews: Review[];
  onAdd: () => void;
  onEdit: (review: Review) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void;
}

export function ReviewsList({ reviews, onAdd, onEdit, onDelete }: ReviewsListProps) {
  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta avaliação?')) {
      onDelete(id);
    }
  };

  const renderStars = (rating: number) => {
    return (
      <div className="flex items-center">
        {[...Array(5)].map((_, index) => (
          <Star
            key={index}
            className={`w-4 h-4 ${index < rating ? 'text-yellow-400 fill-yellow-400' : 'text-gray-300'}`}
          />
        ))}
      </div>
    );
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gerenciar Avaliações</h3>
        <Button onClick={onAdd} className="bg-blue-500 hover:bg-blue-600">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Avaliação
        </Button>
      </div>

      <div className="grid gap-4">
        {reviews.map((review) => (
          <Card key={review.id} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <img
                  src={review.image}
                  alt={review.name}
                  className="w-16 h-16 object-cover rounded-full border-2 border-orange-200"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{review.name}</h4>
                      <div className="flex items-center gap-2 mt-1">
                        {renderStars(review.rating)}
                        <span className="text-sm text-gray-600">({review.rating}/5)</span>
                      </div>
                      <p className="text-gray-600 text-sm mt-2 line-clamp-2">{review.text}</p>
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(review)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(review.id)}
                    >
                      <Trash2 className="h-3 w-3" />
                    </Button>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ))}
      </div>
    </div>
  );
}