"use client";

import React from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { useCart } from '@/contexts/CartContext';
import { ShoppingCart } from 'lucide-react';
import { toast } from 'sonner';

interface CheckoutButtonProps {
  className?: string;
  variant?: "default" | "destructive" | "outline" | "secondary" | "ghost" | "link";
  size?: "default" | "sm" | "lg" | "icon";
}

export function CheckoutButton({ className, variant = "default", size = "default" }: CheckoutButtonProps) {
  const { items } = useCart();
  const router = useRouter();

  const handleCheckout = () => {
    if (items.length === 0) {
      toast.error('Adicione itens ao carrinho antes de finalizar o pedido');
      return;
    }
    
    router.push('/checkout');
  };

  return (
    <Button 
      onClick={handleCheckout}
      className={className}
      variant={variant}
      size={size}
    >
      <ShoppingCart className="w-4 h-4 mr-2" />
      Finalizar Pedido
    </Button>
  );
}