"use client";

import React from 'react';
import { Star } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import { useReviews } from '@/contexts/ReviewsContext';
import { useSettings } from '@/contexts/SettingsContext';

const StarRating = ({ rating }: { rating: number }) => {
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

export function Reviews() {
  const { reviews } = useReviews();
  const { settings } = useSettings();

  // Calcular média das avaliações mas garantir 4.9
  const averageRating = 4.9;
  
  // Número fixo de avaliações, independente do array real
  const totalReviews = 2748;
  const recentReviews = 239; // Últimos 30 dias

  return (
    <section className="py-12 bg-gray-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        {/* Label de Avaliações */}
        <div className="flex justify-center mb-8">
          <div className="bg-white border-2 border-gray-200 rounded-2xl px-8 py-4 shadow-sm">
            <div className="text-center">
              <div className="text-3xl font-bold text-gray-800 mb-1">
                {averageRating.toFixed(1)}
              </div>
              <div className="flex justify-center mb-2">
                <StarRating rating={Math.round(averageRating)} />
              </div>
              <div className="text-sm text-gray-600">
                <span className="font-medium">{recentReviews} avaliações</span> • últimos 30 dias
              </div>
              <div className="text-xs text-gray-500 mt-1">
                {totalReviews} avaliações no total
              </div>
            </div>
          </div>
        </div>

        <div className="text-center mb-8">
          <h2 className="text-3xl font-bold text-gray-800">O que nossos clientes dizem</h2>
          <p className="text-gray-600 mt-2">Avaliações reais de clientes satisfeitos!</p>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {reviews.map((review, index) => (
            <Card key={index} className="overflow-hidden">
              <CardContent className="p-6">
                <div className="flex items-start space-x-4">
                  <img 
                    src={review.image || settings.default_image} 
                    alt={review.name} 
                    className="w-16 h-16 rounded-full object-cover border-2 border-orange-200"
                  />
                  <div className="flex-1">
                    <div className="flex items-center justify-between">
                      <h3 className="font-bold text-lg text-gray-800">{review.name}</h3>
                      <StarRating rating={review.rating} />
                    </div>
                    <p className="text-gray-600 text-sm mt-2">{review.text}</p>
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      </div>
    </section>
  );
}