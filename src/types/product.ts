export interface Category {
  id: string;
  name: string;
  created_at?: string;
}

export interface ProductOption {
  id: string;
  name: string;
  description?: string;
  price: number;
  maxQuantity?: number;
  tag?: string;
}

export interface ProductCustomizationGroup {
  id: string;
  title: string;
  description?: string;
  required: boolean;
  minSelections: number;
  maxSelections: number;
  options: ProductOption[];
}

export interface Product {
  id: string;
  name: string;
  description: string;
  price: number;
  originalPrice?: number;
  image: string;
  category: string;
  tag?: 'NOVIDADE' | 'MAIS VENDIDO';
  customizationGroups?: ProductCustomizationGroup[];
  stockLimit?: number;
  created_at?: string;
}

export interface Review {
  id: string;
  name: string;
  rating: number;
  text: string;
  image: string;
  created_at?: string;
}

export interface ProductCustomization {
  groupId: string;
  selections: {
    optionId: string;
    quantity: number;
  }[];
}

export interface CartItem extends Product {
  quantity: number;
  customizations?: ProductCustomization[];
  observations?: string;
}

export interface CartContextType {
  items: CartItem[];
  addItem: (product: Product, customizations?: ProductCustomization[], observations?: string) => void;
  removeItem: (productId: string) => void;
  updateQuantity: (productId: string, quantity: number) => void;
  clearCart: () => void;
  getTotalItems: () => number;
  getTotalPrice: () => number;
}