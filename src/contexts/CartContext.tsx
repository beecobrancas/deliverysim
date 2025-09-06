"use client";

import React, { createContext, useContext, useReducer, useState } from 'react';
import { Product, CartItem, CartContextType, ProductCustomization } from '@/types/product';
import * as fpixel from '@/lib/fpixel';

const CartContext = createContext<CartContextType | undefined>(undefined);

type CartAction =
  | { type: 'ADD_ITEM'; payload: { product: Product; customizations?: ProductCustomization[]; observations?: string } }
  | { type: 'REMOVE_ITEM'; payload: string }
  | { type: 'UPDATE_QUANTITY'; payload: { id: string; quantity: number } }
  | { type: 'CLEAR_CART' };

function cartReducer(state: CartItem[], action: CartAction): CartItem[] {
  switch (action.type) {
    case 'ADD_ITEM': {
      const { product, customizations, observations } = action.payload;
      const newItem: CartItem = {
        ...product,
        quantity: 1,
        customizations,
        observations
      };
      
      if (customizations && customizations.length > 0) {
        return [...state, newItem];
      }
      
      const existingItem = state.find(item => 
        item.id === product.id && 
        !item.customizations?.length
      );
      
      if (existingItem) {
        return state.map(item =>
          item.id === product.id && !item.customizations?.length
            ? { ...item, quantity: item.quantity + 1 }
            : item
        );
      }
      
      return [...state, newItem];
    }
    case 'REMOVE_ITEM':
      return state.filter((_, index) => `${_.id}-${index}` !== action.payload);
    case 'UPDATE_QUANTITY':
      if (action.payload.quantity <= 0) {
        return state.filter((_, index) => `${_.id}-${index}` !== action.payload.id);
      }
      return state.map((item, index) =>
        `${item.id}-${index}` === action.payload.id
          ? { ...item, quantity: action.payload.quantity }
          : item
      );
    case 'CLEAR_CART':
      return [];
    default:
      return state;
  }
}

export function CartProvider({ children }: { children: React.ReactNode }) {
  const [items, dispatch] = useReducer(cartReducer, []);
  const [isCartOpen, setIsCartOpen] = useState(false);

  const addItem = (product: Product, customizations?: ProductCustomization[], observations?: string) => {
    dispatch({ type: 'ADD_ITEM', payload: { product, customizations, observations } });
    setIsCartOpen(true); // Abre o carrinho ao adicionar item

    // Disparar evento do Pixel
    fpixel.event('AddToCart', {
      content_ids: [product.id],
      content_name: product.name,
      content_type: 'product',
      value: product.price,
      currency: 'BRL',
    });
  };

  const removeItem = (productId: string) => {
    dispatch({ type: 'REMOVE_ITEM', payload: productId });
  };

  const updateQuantity = (productId: string, quantity: number) => {
    dispatch({ type: 'UPDATE_QUANTITY', payload: { id: productId, quantity } });
  };

  const clearCart = () => {
    dispatch({ type: 'CLEAR_CART' });
  };

  const getTotalItems = () => {
    return items.reduce((total, item) => total + item.quantity, 0);
  };

  const getTotalPrice = () => {
    return items.reduce((total, item) => {
      let itemTotal = item.price * item.quantity;
      return total + itemTotal;
    }, 0);
  };

  const value: any = {
    items,
    addItem,
    removeItem,
    updateQuantity,
    clearCart,
    getTotalItems,
    getTotalPrice,
    isCartOpen,
    openCart: () => setIsCartOpen(true),
    closeCart: () => setIsCartOpen(false),
  };

  return (
    <CartContext.Provider value={value}>
      {children}
    </CartContext.Provider>
  );
}

export function useCart() {
  const context = useContext(CartContext);
  if (context === undefined) {
    throw new Error('useCart deve ser usado dentro de um CartProvider');
  }
  return context as CartContextType & {
    isCartOpen: boolean;
    openCart: () => void;
    closeCart: () => void;
  };
}