"use client";

import React from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Product } from '@/types/product';
import { Plus, Edit, Trash2 } from 'lucide-react';

interface ProductsListProps {
  products: Product[];
  onAdd: () => void;
  onEdit: (product: Product) => void;
  onDelete: (id: string) => void;
  onMove: (index: number, direction: 'up' | 'down') => void; // Mantido por compatibilidade, mas sem uso
}

export function ProductsList({ products, onAdd, onEdit, onDelete }: ProductsListProps) {
  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleDelete = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir este produto?')) {
      onDelete(id);
    }
  };

  return (
    <div className="space-y-4">
      <div className="flex justify-between items-center">
        <h3 className="text-lg font-semibold">Gerenciar Produtos</h3>
        <Button onClick={onAdd} className="bg-orange-500 hover:bg-orange-600">
          <Plus className="w-4 h-4 mr-2" />
          Adicionar Produto
        </Button>
      </div>

      <div className="grid gap-4">
        {products && products.map((product, index) => (
          product && <Card key={product.id || index} className="relative">
            <CardContent className="p-4">
              <div className="flex items-start gap-4">
                <img
                  src={product.image || '/imagemprodutos.png'}
                  alt={product.name}
                  className="w-20 h-20 object-cover rounded-lg"
                />
                
                <div className="flex-1">
                  <div className="flex items-start justify-between">
                    <div>
                      <h4 className="font-semibold text-lg">{product.name}</h4>
                      <p className="text-gray-600 text-sm line-clamp-2">{product.description}</p>
                      <div className="flex items-center gap-2 mt-2">
                        <Badge variant="outline">{product.category}</Badge>
                        {product.tag && (
                          <Badge variant="secondary" className="bg-purple-100 text-purple-700">
                            {product.tag}
                          </Badge>
                        )}
                      </div>
                    </div>
                    
                    <div className="text-right">
                      <p className="font-bold text-green-600">{formatPrice(product.price)}</p>
                      {product.originalPrice && (
                        <p className="text-gray-400 line-through text-sm">
                          {formatPrice(product.originalPrice)}
                        </p>
                      )}
                    </div>
                  </div>
                </div>

                <div className="flex flex-col gap-2">
                  <div className="flex gap-1">
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8"
                      onClick={() => onEdit(product)}
                    >
                      <Edit className="h-3 w-3" />
                    </Button>
                    <Button
                      variant="outline"
                      size="icon"
                      className="h-8 w-8 text-red-600 hover:bg-red-50"
                      onClick={() => handleDelete(product.id)}
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