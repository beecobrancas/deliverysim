"use client";

import React, { useState } from 'react';
import { Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { Product } from '@/types/product';
import { ProductCustomizationModal } from '@/components/ProductCustomizationModal';
import { toast } from 'sonner';

interface ProductCardProps {
  product: Product;
}

export function ProductCard({ product }: ProductCardProps) {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const [isCustomizationOpen, setIsCustomizationOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleAction = () => {
    if (product.customizationGroups && product.customizationGroups.length > 0) {
      setIsCustomizationOpen(true);
    } else {
      addItem(product);
      if (settings.show_notifications) {
        toast.success(`${product.name} adicionado ao carrinho!`);
      }
    }
  };

  const handleCardClick = () => {
    handleAction();
  };

  const handleButtonClick = (e: React.MouseEvent) => {
    e.stopPropagation();
    handleAction();
  };

  const renderTag = () => {
    if (!product.tag) return null;

    const tagClasses = "text-xs font-bold";
    if (product.tag === 'NOVIDADE') {
      return <Badge variant="secondary" className={`bg-purple-100 text-purple-700 ${tagClasses}`}>🔥 NOVIDADE</Badge>;
    }
    if (product.tag === 'MAIS VENDIDO') {
      return <Badge variant="secondary" className={`bg-green-100 text-green-700 ${tagClasses}`}>💜 MAIS VENDIDO</Badge>;
    }
    return null;
  };

  return (
    <>
      <Card 
        className="overflow-hidden hover:shadow-lg transition-all duration-300 bg-white cursor-pointer flex flex-col"
        onClick={handleCardClick}
      >
        <div className="flex flex-1">
          <div className="flex-1 p-4 flex flex-col">
            {product.tag && <div className="mb-2">{renderTag()}</div>}
            <h3 className="font-bold text-lg mb-2 text-gray-800">{product.name}</h3>
            <p className="text-gray-600 text-sm mb-3 line-clamp-3 flex-grow">
              {product.description}
            </p>
            
            <div className="mt-auto">
              {product.originalPrice && (
                <p className="text-gray-400 line-through text-sm">
                  de {formatPrice(product.originalPrice)}
                </p>
              )}
              <p className="text-green-600 font-bold text-xl">
                {formatPrice(product.price)}
              </p>
              {product.stockLimit && (
                <Badge variant="destructive" className="mt-1 text-xs">
                  🔥 Apenas {product.stockLimit} disponíveis
                </Badge>
              )}
            </div>
          </div>

          <div className="w-28 md:w-32 flex-shrink-0 p-4 flex flex-col justify-between items-center">
            <img
              src={product.image || settings.default_image}
              alt={product.name}
              className="w-full h-24 object-cover rounded-lg hover:scale-105 transition-transform duration-300"
            />
            <Button 
              onClick={handleButtonClick}
              size="icon"
              className="bg-orange-500 hover:bg-orange-600 text-white rounded-md w-10 h-10 mt-4"
            >
              <Plus className="w-5 h-5" />
            </Button>
          </div>
        </div>
      </Card>

      <ProductCustomizationModal
        product={product}
        isOpen={isCustomizationOpen}
        onClose={() => setIsCustomizationOpen(false)}
      />
    </>
  );
}