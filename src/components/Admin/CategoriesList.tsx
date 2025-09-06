"use client";

import React, { useState } from 'react';
import { useCategory } from '@/contexts/CategoryContext';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Plus, Edit, Trash2, Save, X } from 'lucide-react';
import { Skeleton } from '@/components/ui/skeleton';

export function CategoriesList() {
  const { categories, addCategory, updateCategory, deleteCategory, loading } = useCategory();
  const [newCategoryName, setNewCategoryName] = useState('');
  const [editingCategory, setEditingCategory] = useState<{ id: string; name: string } | null>(null);

  const handleAddCategory = async () => {
    if (newCategoryName.trim()) {
      await addCategory(newCategoryName.trim());
      setNewCategoryName('');
    }
  };

  const handleUpdateCategory = async () => {
    if (editingCategory && editingCategory.name.trim()) {
      await updateCategory(editingCategory.id, editingCategory.name.trim());
      setEditingCategory(null);
    }
  };

  const handleDeleteCategory = (id: string) => {
    if (window.confirm('Tem certeza que deseja excluir esta categoria? Isso pode afetar produtos existentes.')) {
      deleteCategory(id);
    }
  };

  if (loading) {
    return (
      <Card>
        <CardHeader><CardTitle>Gerenciar Categorias</CardTitle></CardHeader>
        <CardContent className="space-y-2">
          {[...Array(3)].map((_, i) => <Skeleton key={i} className="h-10 w-full" />)}
        </CardContent>
      </Card>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Gerenciar Categorias</CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <div className="flex gap-2">
          <Input
            value={newCategoryName}
            onChange={(e) => setNewCategoryName(e.target.value)}
            placeholder="Nome da nova categoria"
          />
          <Button onClick={handleAddCategory} className="bg-orange-500 hover:bg-orange-600">
            <Plus className="w-4 h-4 mr-2" />
            Adicionar
          </Button>
        </div>

        <div className="space-y-2">
          {categories.map((category) => (
            <div key={category.id} className="flex items-center justify-between p-2 border rounded-lg">
              {editingCategory?.id === category.id ? (
                <Input
                  value={editingCategory.name}
                  onChange={(e) => setEditingCategory({ ...editingCategory, name: e.target.value })}
                  className="h-9"
                />
              ) : (
                <span>{category.name}</span>
              )}
              <div className="flex gap-1">
                {editingCategory?.id === category.id ? (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-green-600" onClick={handleUpdateCategory}>
                      <Save className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCategory(null)}>
                      <X className="w-4 h-4" />
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="ghost" size="icon" className="h-8 w-8" onClick={() => setEditingCategory({ id: category.id, name: category.name })}>
                      <Edit className="w-4 h-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="h-8 w-8 text-red-600" onClick={() => handleDeleteCategory(category.id)}>
                      <Trash2 className="w-4 h-4" />
                    </Button>
                  </>
                )}
              </div>
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}