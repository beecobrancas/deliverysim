"use client";

import React, { useState } from 'react';
import { Minus, Plus, Trash2, ShoppingBag } from 'lucide-react';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { CheckoutModal } from './CheckoutModal';
import * as fpixel from '@/lib/fpixel';

export function CartDrawer() {
  const { items, updateQuantity, removeItem, getTotalPrice, clearCart, isCartOpen, closeCart } = useCart();
  const { settings } = useSettings();
  const [isCheckoutOpen, setIsCheckoutOpen] = useState(false);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleOpenCheckout = () => {
    // Disparar evento do Pixel
    fpixel.event('InitiateCheckout', {
      value: getTotalPrice(),
      currency: 'BRL',
      num_items: items.reduce((sum, item) => sum + item.quantity, 0),
      content_ids: items.map(item => item.id),
      content_type: 'product',
    });

    closeCart();
    setIsCheckoutOpen(true);
  };

  if (items.length === 0) {
    return (
      <Sheet open={isCartOpen} onOpenChange={closeCart}>
        <SheetContent className="w-full sm:max-w-lg">
          <SheetHeader>
            <SheetTitle>Seu Carrinho</SheetTitle>
            <SheetDescription>
              Seus itens selecionados aparecerão aqui
            </SheetDescription>
          </SheetHeader>
          
          <div className="flex flex-col items-center justify-center h-64 text-center">
            <ShoppingBag className="h-16 w-16 text-gray-300 mb-4" />
            <p className="text-gray-500 mb-2">Seu carrinho está vazio</p>
            <p className="text-sm text-gray-400">Adicione alguns produtos deliciosos!</p>
          </div>
        </SheetContent>
      </Sheet>
    );
  }

  return (
    <>
      <Sheet open={isCartOpen} onOpenChange={closeCart}>
        <SheetContent className="w-full sm:max-w-lg flex flex-col">
          <SheetHeader>
            <SheetTitle>Seu Carrinho</SheetTitle>
            <SheetDescription>
              {items.length} {items.length === 1 ? 'item' : 'itens'} no seu carrinho
            </SheetDescription>
          </SheetHeader>

          <div className="flex-1 overflow-y-auto py-4">
            <div className="space-y-4">
              {items.map((item, index) => (
                <div key={`${item.id}-${index}`} className="flex items-start space-x-4 bg-gray-50 p-4 rounded-lg">
                  <img
                    src={item.image || settings.default_image}
                    alt={item.name}
                    className="w-16 h-16 object-cover rounded-md flex-shrink-0"
                  />
                  
                  <div className="flex-1 min-w-0">
                    <h3 className="font-medium text-sm">{item.name}</h3>
                    <p className="text-sm text-gray-600">{formatPrice(item.price)}</p>
                    
                    <div className="flex items-center space-x-2 mt-2">
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(`${item.id}-${index}`, item.quantity - 1)}
                      >
                        <Minus className="h-3 w-3" />
                      </Button>
                      
                      <span className="w-8 text-center text-sm font-medium">
                        {item.quantity}
                      </span>
                      
                      <Button
                        variant="outline"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => updateQuantity(`${item.id}-${index}`, item.quantity + 1)}
                      >
                        <Plus className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  
                  <div className="text-right flex-shrink-0">
                    <p className="font-medium text-sm">
                      {formatPrice(item.price * item.quantity)}
                    </p>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 text-red-500 hover:text-red-700 mt-1"
                      onClick={() => removeItem(`${item.id}-${index}`)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="border-t pt-4 space-y-4">
            <div className="flex justify-between items-center">
              <span className="text-lg font-semibold">Total:</span>
              <span className="text-lg font-bold text-green-600">
                {formatPrice(getTotalPrice())}
              </span>
            </div>
            
            <div className="space-y-2">
              <Button 
                onClick={handleOpenCheckout}
                className="w-full bg-green-600 hover:bg-green-700 text-white"
                size="lg"
              >
                Finalizar Compra
              </Button>
              
              <Button 
                variant="outline" 
                onClick={clearCart}
                className="w-full text-red-600 hover:bg-red-100 hover:text-red-700"
              >
                <Trash2 className="w-4 h-4 mr-2" />
                Limpar Carrinho
              </Button>
            </div>
          </div>
        </SheetContent>
      </Sheet>

      <CheckoutModal 
        isOpen={isCheckoutOpen}
        onClose={() => setIsCheckoutOpen(false)}
      />
    </>
  );
}