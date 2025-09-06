"use client";

import React from 'react';
import { ShoppingCart } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useCart } from '@/contexts/CartContext';

interface CartIconProps {
  onClick: () => void;
}

export function CartIcon({ onClick }: CartIconProps) {
  const { getTotalItems } = useCart();
  const totalItems = getTotalItems();

  return (
    <Button
      variant="default"
      size="icon"
      className="relative bg-white text-gray-800 hover:bg-gray-200 shadow-md"
      onClick={onClick}
    >
      <ShoppingCart className="h-4 w-4" />
      {totalItems > 0 && (
        <Badge 
          variant="destructive" 
          className="absolute -top-2 -right-2 h-5 w-5 flex items-center justify-center p-0 text-xs"
        >
          {totalItems}
        </Badge>
      )}
    </Button>
  );
}