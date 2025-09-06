"use client";

import React from 'react';
import { ProductCard } from '@/components/ProductCard';
import { useAdmin } from '@/contexts/AdminContext';
import { useCategory } from '@/contexts/CategoryContext';
import { Skeleton } from '@/components/ui/skeleton';

export function ProductGrid() {
  const { products } = useAdmin();
  const { categories, loading: loadingCategories } = useCategory();

  const isLoading = products.length === 0 || loadingCategories;

  // Skeleton para o estado de carregamento
  if (isLoading) {
    return (
      <section id="menu" className="py-12 bg-gray-50 min-h-screen">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="space-y-12">
            {[...Array(3)].map((_, i) => (
              <div key={i}>
                <Skeleton className="h-8 w-1/3 mb-6" />
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex bg-white p-4 rounded-lg shadow">
                    <div className="flex-1 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-6 w-1/2" /></div>
                    <Skeleton className="w-24 h-24 rounded-md" />
                  </div>
                  <div className="flex bg-white p-4 rounded-lg shadow">
                    <div className="flex-1 space-y-3"><Skeleton className="h-5 w-3/4" /><Skeleton className="h-4 w-full" /><Skeleton className="h-4 w-5/6" /><Skeleton className="h-6 w-1/2" /></div>
                    <Skeleton className="w-24 h-24 rounded-md" />
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  }

  return (
    <section id="menu" className="py-12 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="space-y-12">
          {categories.map((category) => {
            const productsInCategory = products.filter(
              (product) => product.category === category.name
            );

            // Não renderiza a categoria se não houver produtos nela
            if (productsInCategory.length === 0) {
              return null;
            }

            return (
              <div key={category.id}>
                <h2 className="text-3xl font-bold text-gray-800 mb-6 border-l-4 border-orange-500 pl-4">
                  {category.name}
                </h2>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {productsInCategory.map((product) => (
                    <ProductCard key={product.id} product={product} />
                  ))}
                </div>
              </div>
            );
          })}
        </div>
      </div>
    </section>
  );
}