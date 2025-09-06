"use client";

import React from 'react';
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from '@/components/ui/accordion';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';

export function CartSummary() {
  const { items, getTotalPrice } = useCart();

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  return (
    <Accordion type="single" collapsible className="w-full bg-gray-50 rounded-lg p-4 mb-6">
      <AccordionItem value="item-1">
        <AccordionTrigger>
          <div className="flex items-center justify-between w-full">
            <div className="flex items-center gap-2">
              <ShoppingCart className="w-5 h-5 text-orange-500" />
              <span className="font-semibold">Resumo do Pedido</span>
            </div>
            <span className="font-bold text-green-600">{formatPrice(getTotalPrice())}</span>
          </div>
        </AccordionTrigger>
        <AccordionContent>
          <div className="space-y-2 pt-4">
            {items.map((item, index) => (
              <div key={`${item.id}-${index}`} className="flex justify-between text-sm">
                <span>{item.quantity}x {item.name}</span>
                <span>{formatPrice(item.price * item.quantity)}</span>
              </div>
            ))}
            <div className="flex justify-between font-bold pt-2 border-t">
              <span>Total</span>
              <span>{formatPrice(getTotalPrice())}</span>
            </div>
          </div>
        </AccordionContent>
      </AccordionItem>
    </Accordion>
  );
}