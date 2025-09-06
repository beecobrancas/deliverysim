"use client";

import React, { useState, useEffect } from 'react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { useAdmin } from '@/contexts/AdminContext';
import { useReviews } from '@/contexts/ReviewsContext';
import { useUser } from '@/contexts/UserContext';
import { useAuth } from '@/contexts/AuthContext';
import { Product, Review } from '@/types/product';
import { toast } from 'sonner';
import { LogOut, RefreshCw } from 'lucide-react';

// Importar componentes modulares
import { ProductsList } from './Admin/ProductsList';
import { ProductEditor } from './Admin/ProductEditor';
import { ReviewsList } from './Admin/ReviewsList';
import { ReviewEditor } from './Admin/ReviewEditor';
import { UsersList } from './Admin/UsersList';
import { GeneralSettings } from './Admin/GeneralSettings';
import { CategoriesList } from './Admin/CategoriesList';

interface AdminPanelProps {
  isOpen: boolean;
  onClose: () => void;
}

export function AdminPanel({ isOpen, onClose }: AdminPanelProps) {
  const { products, updateProduct, addProduct, deleteProduct, reorderProducts, resetProducts } = useAdmin();
  const { reviews, updateReview, addReview, deleteReview, reorderReviews, resetReviews } = useReviews();
  const { getAllUsers } = useUser();
  const { logout } = useAuth();
  
  // Estados para controle de edição
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [isAddingProduct, setIsAddingProduct] = useState(false);
  const [isAddingReview, setIsAddingReview] = useState(false);
  const [activeTab, setActiveTab] = useState('products');

  // Reset activeTab quando o modal abrir
  useEffect(() => {
    if (isOpen) {
      setActiveTab('products');
    }
  }, [isOpen]);

  const users = getAllUsers();

  // Handlers para produtos
  const handleAddProduct = () => {
    setIsAddingProduct(true);
    setEditingProduct(null);
    setActiveTab('editor');
  };

  const handleEditProduct = (product: Product) => {
    setEditingProduct(product);
    setIsAddingProduct(false);
    setActiveTab('editor');
  };

  const handleSaveProduct = (data: Partial<Product>) => {
    if (editingProduct) {
      updateProduct(editingProduct.id, data);
    } else if (isAddingProduct) {
      addProduct(data as Omit<Product, 'id'>);
    }
    
    setEditingProduct(null);
    setIsAddingProduct(false);
    setActiveTab('products');
  };

  const handleCancelProductEdit = () => {
    setEditingProduct(null);
    setIsAddingProduct(false);
    setActiveTab('products');
  };

  const handleDeleteProduct = (id: string) => {
    deleteProduct(id);
    toast.success('Produto excluído com sucesso!');
  };

  const handleMoveProduct = (index: number, direction: 'up' | 'down') => {
    const newProducts = [...products];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newProducts.length) {
      [newProducts[index], newProducts[targetIndex]] = [newProducts[targetIndex], newProducts[index]];
      reorderProducts(newProducts);
      toast.success('Ordem dos produtos atualizada!');
    }
  };

  // Handlers para avaliações
  const handleAddReview = () => {
    setIsAddingReview(true);
    setEditingReview(null);
    setActiveTab('reviews-editor');
  };

  const handleEditReview = (review: Review) => {
    setEditingReview(review);
    setIsAddingReview(false);
    setActiveTab('reviews-editor');
  };

  const handleSaveReview = (data: Omit<Review, 'id' | 'created_at'>) => {
    if (editingReview) {
      updateReview(editingReview.id, data);
    } else if (isAddingReview) {
      addReview(data);
    }
    
    setEditingReview(null);
    setIsAddingReview(false);
    setActiveTab('reviews');
  };

  const handleCancelReviewEdit = () => {
    setEditingReview(null);
    setIsAddingReview(false);
    setActiveTab('reviews');
  };

  const handleDeleteReview = (id: string) => {
    deleteReview(id);
    toast.success('Avaliação excluída com sucesso!');
  };

  const handleMoveReview = (index: number, direction: 'up' | 'down') => {
    const newReviews = [...reviews];
    const targetIndex = direction === 'up' ? index - 1 : index + 1;
    
    if (targetIndex >= 0 && targetIndex < newReviews.length) {
      [newReviews[index], newReviews[targetIndex]] = [newReviews[targetIndex], newReviews[index]];
      reorderReviews(newReviews);
      toast.success('Ordem das avaliações atualizada!');
    }
  };

  // Handlers gerais
  const handleLogout = () => {
    logout();
    onClose();
    toast.success('Logout realizado com sucesso!');
  };

  const handleReset = () => {
    if (window.confirm('Tem certeza que deseja resetar todos os dados para o padrão?')) {
      resetProducts();
      resetReviews();
      toast.success('Dados resetados para o padrão!');
    }
  };

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <div className="flex justify-between items-center">
            <DialogTitle>Painel Administrativo - Rei das Coxinhas</DialogTitle>
            <div className="flex gap-2">
              <Button
                variant="outline"
                size="sm"
                onClick={handleReset}
                className="text-orange-600 hover:bg-orange-50"
              >
                <RefreshCw className="w-4 h-4 mr-2" />
                Resetar
              </Button>
              <Button
                variant="outline"
                size="sm"
                onClick={handleLogout}
                className="text-red-600 hover:bg-red-50"
              >
                <LogOut className="w-4 h-4 mr-2" />
                Sair
              </Button>
            </div>
          </div>
        </DialogHeader>

        <Tabs value={activeTab} onValueChange={setActiveTab} className="w-full">
          <TabsList className="grid w-full grid-cols-5">
            <TabsTrigger value="products">Produtos</TabsTrigger>
            <TabsTrigger value="reviews">Avaliações</TabsTrigger>
            <TabsTrigger value="categories">Categorias</TabsTrigger>
            <TabsTrigger value="users">Usuários</TabsTrigger>
            <TabsTrigger value="settings">Configurações</TabsTrigger>
          </TabsList>

          <TabsContent value="products" className="space-y-4">
            <ProductsList
              products={products}
              onAdd={handleAddProduct}
              onEdit={handleEditProduct}
              onDelete={handleDeleteProduct}
              onMove={handleMoveProduct}
            />
          </TabsContent>

          <TabsContent value="editor" className="space-y-4">
            <ProductEditor
              product={editingProduct}
              isAdding={isAddingProduct}
              onSave={handleSaveProduct}
              onCancel={handleCancelProductEdit}
            />
          </TabsContent>

          <TabsContent value="reviews" className="space-y-4">
            <ReviewsList
              reviews={reviews}
              onAdd={handleAddReview}
              onEdit={handleEditReview}
              onDelete={handleDeleteReview}
              onMove={handleMoveReview}
            />
          </TabsContent>
          
          <TabsContent value="reviews-editor" className="space-y-4">
            <ReviewEditor
              review={editingReview}
              isAdding={isAddingReview}
              onSave={handleSaveReview}
              onCancel={handleCancelReviewEdit}
            />
          </TabsContent>

          <TabsContent value="categories">
            <CategoriesList />
          </TabsContent>

          <TabsContent value="users" className="space-y-4">
            <UsersList users={users} />
          </TabsContent>

          <TabsContent value="settings" className="space-y-4">
            <GeneralSettings />
          </TabsContent>
        </Tabs>
      </DialogContent>
    </Dialog>
  );
}