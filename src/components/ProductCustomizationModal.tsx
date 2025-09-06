"use client";

import React, { useState, useEffect } from 'react';
import { X, Plus, Minus } from 'lucide-react';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import { Textarea } from '@/components/ui/textarea';
import { Label } from '@/components/ui/label';
import { Badge } from '@/components/ui/badge';
import { Product, ProductCustomization, ProductCustomizationGroup } from '@/types/product';
import { useCart } from '@/contexts/CartContext';
import { useSettings } from '@/contexts/SettingsContext';
import { toast } from 'sonner';
import * as fpixel from '@/lib/fpixel';

interface ProductCustomizationModalProps {
  product: Product | null;
  isOpen: boolean;
  onClose: () => void;
}

export function ProductCustomizationModal({ product, isOpen, onClose }: ProductCustomizationModalProps) {
  const { addItem } = useCart();
  const { settings } = useSettings();
  const [customizations, setCustomizations] = useState<ProductCustomization[]>([]);
  const [observations, setObservations] = useState('');
  const [totalPrice, setTotalPrice] = useState(0);

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  // Disparar evento ViewContent quando o modal abre
  useEffect(() => {
    if (isOpen && product) {
      fpixel.event('ViewContent', {
        content_ids: [product.id],
        content_name: product.name,
        content_type: 'product',
        value: product.price,
        currency: 'BRL',
      });
    }
  }, [isOpen, product]);

  // Recalcula o preço total sempre que as customizações mudam
  useEffect(() => {
    if (!product) return;

    let currentTotal = product.price;

    customizations.forEach(groupCust => {
      const groupInfo = product.customizationGroups?.find(g => g.id === groupCust.groupId);
      if (groupInfo) {
        groupCust.selections.forEach(selection => {
          const optionInfo = groupInfo.options.find(o => o.id === selection.optionId);
          if (optionInfo) {
            currentTotal += (optionInfo.price || 0) * selection.quantity;
          }
        });
      }
    });

    setTotalPrice(currentTotal);
  }, [product, customizations]);

  // Reseta o estado quando o modal abre com um novo produto
  useEffect(() => {
    if (isOpen && product) {
      setTotalPrice(product.price);
      setCustomizations([]);
      setObservations('');
    }
  }, [isOpen, product]);

  const updateCustomization = (groupId: string, optionId: string, newQuantity: number) => {
    setCustomizations(prev => {
      const otherGroups = prev.filter(c => c.groupId !== groupId);
      const currentGroup = prev.find(c => c.groupId === groupId);
      
      let newSelections = currentGroup ? [...currentGroup.selections] : [];
      const existingSelectionIndex = newSelections.findIndex(s => s.optionId === optionId);

      if (newQuantity > 0) {
        if (existingSelectionIndex > -1) {
          newSelections[existingSelectionIndex] = { ...newSelections[existingSelectionIndex], quantity: newQuantity };
        } else {
          newSelections.push({ optionId, quantity: newQuantity });
        }
      } else {
        newSelections = newSelections.filter(s => s.optionId !== optionId);
      }

      if (newSelections.length > 0) {
        return [...otherGroups, { groupId, selections: newSelections }];
      } else {
        return otherGroups;
      }
    });
  };

  const getSelectionQuantity = (groupId: string, optionId: string): number => {
    const group = customizations.find(c => c.groupId === groupId);
    const selection = group?.selections.find(s => s.optionId === optionId);
    return selection?.quantity || 0;
  };

  const getTotalSelections = (groupId: string): number => {
    const group = customizations.find(c => c.groupId === groupId);
    return group?.selections.reduce((total, s) => total + s.quantity, 0) || 0;
  };

  const isGroupValid = (group: ProductCustomizationGroup): boolean => {
    const totalSelections = getTotalSelections(group.id);
    if (group.required) {
      return totalSelections >= group.minSelections && totalSelections <= group.maxSelections;
    }
    return totalSelections <= group.maxSelections;
  };

  const canAddToCart = (): boolean => {
    if (!product?.customizationGroups) return true;
    return product.customizationGroups.every(isGroupValid);
  };

  const handleAddToCart = () => {
    if (!product) return;
    
    if (!canAddToCart()) {
      toast.error('Por favor, complete as seleções obrigatórias corretamente.');
      return;
    }
    
    addItem(product, customizations, observations);
    if (settings.show_notifications) {
      toast.success(`${product.name} adicionado ao carrinho!`);
    }
    onClose();
  };

  if (!product) return null;

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] flex flex-col">
        <DialogHeader>
          <DialogTitle className="text-left">Personalize seu pedido</DialogTitle>
        </DialogHeader>

        <div className="flex-1 overflow-y-auto pr-2 space-y-6">
          {/* Informações do produto */}
          <div className="flex gap-4">
            <img src={product.image || settings.default_image} alt={product.name} className="w-24 h-24 object-cover rounded-lg" />
            <div className="flex-1">
              <h3 className="font-bold text-lg text-gray-800">{product.name}</h3>
              <p className="text-gray-600 text-sm mb-2">{product.description}</p>
            </div>
          </div>

          {/* Grupos de customização */}
          {product.customizationGroups?.map((group) => (
            <div key={group.id} className="border rounded-lg p-4">
              <div className="flex justify-between items-start mb-4">
                <div>
                  <h4 className="font-semibold text-lg">{group.title}</h4>
                  <p className="text-gray-600 text-sm">{group.description}</p>
                  <p className="text-xs text-gray-500">
                    {group.required ? `Escolha de ${group.minSelections} a ${group.maxSelections} opções.` : `Escolha até ${group.maxSelections} opções.`}
                  </p>
                </div>
                <div className="text-right flex-shrink-0">
                  <Badge variant={isGroupValid(group) ? "default" : "destructive"}>
                    {getTotalSelections(group.id)}/{group.maxSelections}
                  </Badge>
                  {group.required && (
                    <p className="text-xs text-orange-600 mt-1">OBRIGATÓRIO</p>
                  )}
                </div>
              </div>

              <div className="space-y-3">
                {group.options.map((option) => {
                  const currentQty = getSelectionQuantity(group.id, option.id);
                  const totalSelectionsInGroup = getTotalSelections(group.id);
                  const isMaxInGroup = totalSelectionsInGroup >= group.maxSelections;
                  const isMaxForOption = option.maxQuantity ? currentQty >= option.maxQuantity : false;

                  return (
                    <div key={option.id} className="flex items-center justify-between p-3 bg-gray-50 rounded-lg">
                      <div className="flex-1">
                        <div className="flex items-center gap-2">
                          <h5 className="font-medium">{option.name}</h5>
                          {option.tag && (
                            <Badge variant="secondary" className="bg-green-100 text-green-700 text-xs font-semibold">
                              {option.tag}
                            </Badge>
                          )}
                        </div>
                        {option.description && <p className="text-gray-600 text-sm">{option.description}</p>}
                        {option.price > 0 && <p className="text-green-600 font-medium">+ {formatPrice(option.price)}</p>}
                      </div>
                      
                      <div className="flex items-center space-x-2">
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCustomization(group.id, option.id, currentQty - 1)} disabled={currentQty === 0}>
                          <Minus className="h-3 w-3" />
                        </Button>
                        <span className="w-8 text-center font-medium">{currentQty}</span>
                        <Button variant="outline" size="icon" className="h-8 w-8" onClick={() => updateCustomization(group.id, option.id, currentQty + 1)} disabled={isMaxInGroup || isMaxForOption}>
                          <Plus className="h-3 w-3" />
                        </Button>
                      </div>
                    </div>
                  );
                })}
              </div>
            </div>
          ))}

          {/* Observações */}
          <div className="space-y-2">
            <Label htmlFor="observations">Observações do produto</Label>
            <Textarea id="observations" placeholder="Ex: Sem cebola, ponto da carne, Coca Cola Zero..." value={observations} onChange={(e) => setObservations(e.target.value)} className="resize-none" rows={3} maxLength={140} />
            <p className="text-xs text-gray-500 text-right">{observations.length}/140</p>
          </div>
        </div>

        {/* Footer com botão de adicionar */}
        <div className="flex justify-between items-center pt-4 border-t mt-auto">
          <div>
            <p className="text-lg font-bold text-green-600">Total: {formatPrice(totalPrice)}</p>
          </div>
          <Button onClick={handleAddToCart} disabled={!canAddToCart()} className="bg-orange-500 hover:bg-orange-600 text-white px-8" size="lg">
            <Plus className="w-4 h-4 mr-2" /> Adicionar ao Carrinho
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
}