"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart, Plus, Minus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';

export function CartDrawer() {
  const { 
    items, 
    getTotalPrice, 
    updateQuantity, 
    removeItem, 
    isCartOpen, 
    closeCart 
  } = useCart();
  const router = useRouter();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  const handleQuantityChange = (id: string, newQuantity: number) => {
    if (newQuantity <= 0) {
      removeItem(id);
      toast.success('Item removido do carrinho');
    } else {
      updateQuantity(id, newQuantity);
    }
  };

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Seu carrinho está vazio');
      return;
    }
    
    closeCart();
    router.push('/checkout');
  };

  const totalItems = items.reduce((sum, item) => sum + item.quantity, 0);

  return (
    <Sheet open={isCartOpen} onOpenChange={(open) => !open && closeCart()}>
      <SheetTrigger asChild>
        <Button 
          variant="outline" 
          size="icon" 
          className="fixed bottom-4 right-4 z-50 h-14 w-14 rounded-full shadow-lg bg-orange-500 hover:bg-orange-600 border-orange-500 text-white"
        >
          <ShoppingCart className="h-6 w-6" />
          {totalItems > 0 && (
            <Badge 
              variant="destructive" 
              className="absolute -top-2 -right-2 h-6 w-6 rounded-full p-0 flex items-center justify-center text-xs bg-red-500"
            >
              {totalItems}
            </Badge>
          )}
        </Button>
      </SheetTrigger>
      
      <SheetContent className="w-full sm:max-w-lg flex flex-col">
        <SheetHeader className="pb-4">
          <SheetTitle className="text-left">
            Seu Carrinho ({totalItems} {totalItems === 1 ? 'item' : 'itens'})
          </SheetTitle>
        </SheetHeader>
        
        <div className="flex flex-col flex-1">
          {items.length === 0 ? (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center">
                <ShoppingCart className="h-12 w-12 mx-auto text-gray-400 mb-4" />
                <p className="text-gray-500">Seu carrinho está vazio</p>
                <Button 
                  onClick={closeCart}
                  variant="outline"
                  className="mt-4"
                >
                  Continuar comprando
                </Button>
              </div>
            </div>
          ) : (
            <>
              <div className="flex-1 overflow-y-auto">
                <div className="space-y-3">
                  {items.map((item, index) => (
                    <div key={`${item.id}-${index}`} className="flex items-start space-x-3 p-3 border rounded-lg bg-white">
                      <img 
                        src={item.image} 
                        alt={item.name}
                        className="w-14 h-14 object-cover rounded-md flex-shrink-0"
                      />
                      <div className="flex-1 min-w-0">
                        <h4 className="font-medium text-sm text-gray-800 line-clamp-2">{item.name}</h4>
                        <p className="text-orange-600 font-semibold text-sm mt-1">
                          {formatPrice(item.price)}
                        </p>
                        
                        {/* Controles de quantidade */}
                        <div className="flex items-center justify-between mt-3">
                          <div className="flex items-center space-x-1">
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => handleQuantityChange(`${item.id}-${index}`, item.quantity - 1)}
                            >
                              <Minus className="h-3 w-3" />
                            </Button>
                            <span className="w-8 text-center text-sm font-medium">
                              {item.quantity}
                            </span>
                            <Button
                              variant="outline"
                              size="icon"
                              className="h-7 w-7 rounded-full"
                              onClick={() => handleQuantityChange(`${item.id}-${index}`, item.quantity + 1)}
                            >
                              <Plus className="h-3 w-3" />
                            </Button>
                          </div>
                          
                          <Button
                            variant="ghost"
                            size="icon"
                            className="h-7 w-7 text-red-500 hover:text-red-700 hover:bg-red-50"
                            onClick={() => {
                              removeItem(`${item.id}-${index}`);
                              toast.success('Item removido do carrinho');
                            }}
                          >
                            <Trash2 className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </div>
              
              <div className="border-t pt-4 mt-4 space-y-4 bg-white">
                <div className="flex justify-between items-center">
                  <span className="text-lg font-semibold">Total:</span>
                  <span className="text-xl font-bold text-green-600">
                    {formatPrice(getTotalPrice())}
                  </span>
                </div>
                
                <div className="space-y-2">
                  <Button 
                    onClick={handleCheckout}
                    className="w-full bg-orange-500 hover:bg-orange-600 text-white h-12 font-semibold"
                    size="lg"
                  >
                    Finalizar Pedido
                  </Button>
                  
                  <Button 
                    onClick={closeCart}
                    variant="outline"
                    className="w-full h-10"
                  >
                    Continuar comprando
                  </Button>
                </div>
              </div>
            </>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
}