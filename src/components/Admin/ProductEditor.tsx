"use client";

import React, { useState, useEffect } from 'react';
import { useForm, useFieldArray } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Product, ProductCustomizationGroup } from '@/types/product';
import { ImageUploader } from './ImageUploader';
import { Save, X, Plus, Trash2 } from 'lucide-react';
import { toast } from 'sonner';
import { Switch } from '@/components/ui/switch';
import { useCategory } from '@/contexts/CategoryContext';

const optionSchema = z.object({
  id: z.string().default(() => `opt_${Date.now()}_${Math.random()}`),
  name: z.string().min(1, "Nome da opção é obrigatório"),
  description: z.string().optional(),
  price: z.number().default(0),
  maxQuantity: z.number().min(1).default(1),
  tag: z.string().optional(),
});

const customizationGroupSchema = z.object({
  id: z.string().default(() => `grp_${Date.now()}_${Math.random()}`),
  title: z.string().min(1, "Título do grupo é obrigatório"),
  description: z.string().optional(),
  required: z.boolean().default(false),
  minSelections: z.number().min(0).default(0),
  maxSelections: z.number().min(1).default(1),
  options: z.array(optionSchema).default([]),
});

const productSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  description: z.string().min(1, "Descrição é obrigatória"),
  price: z.number().min(0, "Preço deve ser positivo"),
  originalPrice: z.union([z.number(), z.string()]).optional(),
  image: z.string().optional(),
  category: z.string().min(1, "Categoria é obrigatória"),
  tag: z.enum(['NOVIDADE', 'MAIS VENDIDO', 'none']).optional(),
  stockLimit: z.union([z.number(), z.string()]).optional(),
  customizationGroups: z.array(customizationGroupSchema).optional(),
});

type ProductFormData = z.infer<typeof productSchema>;

interface ProductEditorProps {
  product: Product | null;
  isAdding: boolean;
  onSave: (data: Partial<Product>) => void;
  onCancel: () => void;
}

export function ProductEditor({ product, isAdding, onSave, onCancel }: ProductEditorProps) {
  const [imagePreview, setImagePreview] = useState<string>('');
  const { categories } = useCategory();

  const form = useForm<ProductFormData>({
    resolver: zodResolver(productSchema),
    defaultValues: {
      name: "",
      description: "",
      price: 0,
      originalPrice: '',
      image: "",
      category: "",
      tag: "none",
      stockLimit: '',
      customizationGroups: [],
    },
  });

  const { fields: groupFields, append: appendGroup, remove: removeGroup } = useFieldArray({
    control: form.control,
    name: "customizationGroups",
  });

  useEffect(() => {
    if (product) {
      setImagePreview(product.image || '');
      form.reset({
        name: product.name || "",
        description: product.description || "",
        price: product.price || 0,
        originalPrice: product.originalPrice ?? '',
        image: product.image || "",
        category: product.category as any,
        tag: product.tag || "none",
        stockLimit: product.stockLimit ?? '',
        customizationGroups: product.customizationGroups || [],
      });
    } else if (isAdding) {
      setImagePreview('');
      form.reset({
        name: "",
        description: "",
        price: 0,
        originalPrice: '',
        image: "/imagemprodutos.png",
        category: categories.length > 0 ? categories[0].name : "",
        tag: "none",
        stockLimit: '',
        customizationGroups: [],
      });
    }
  }, [product, isAdding, form, categories]);

  const onSubmit = (data: ProductFormData) => {
    const productData: Partial<Product> = {
      ...data,
      price: Number(data.price) || 0,
      originalPrice: Number(data.originalPrice) || undefined,
      image: data.image || "/imagemprodutos.png",
      tag: data.tag === "none" ? undefined : data.tag as any,
      stockLimit: Number(data.stockLimit) || undefined,
    };

    try {
      onSave(productData);
      toast.success(product ? 'Produto atualizado com sucesso!' : 'Produto adicionado com sucesso!');
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        toast.error('Limite de armazenamento excedido! Use URLs para imagens ou remova alguns produtos.');
      } else {
        toast.error('Erro ao salvar o produto. Tente novamente.');
      }
      console.error('Erro ao salvar produto:', error);
    }
  };

  if (!product && !isAdding) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Selecione um produto para editar ou adicione um novo</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {product ? 'Editar Produto' : 'Adicionar Novo Produto'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
            {/* Campos básicos do produto */}
            <div className="space-y-4 p-4 border rounded-lg">
              <FormField name="name" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
              <FormField name="description" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Textarea {...field} rows={3} /></FormControl><FormMessage /></FormItem> )} />
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <FormField name="price" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Preço (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={(e) => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="originalPrice" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Preço Original (R$)</FormLabel><FormControl><Input type="number" step="0.01" {...field} /></FormControl><FormMessage /></FormItem> )} />
                <FormField name="stockLimit" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Limite de Estoque</FormLabel><FormControl><Input type="number" {...field} /></FormControl><FormMessage /></FormItem> )} />
              </div>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <FormField name="category" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Categoria</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue placeholder="Selecione uma categoria" /></SelectTrigger></FormControl><SelectContent>{categories.map(cat => <SelectItem key={cat.id} value={cat.name}>{cat.name}</SelectItem>)}</SelectContent></Select><FormMessage /></FormItem> )} />
                <FormField name="tag" control={form.control} render={({ field }) => ( <FormItem><FormLabel>Tag Especial</FormLabel><Select onValueChange={field.onChange} value={field.value}><FormControl><SelectTrigger><SelectValue /></SelectTrigger></FormControl><SelectContent><SelectItem value="none">Nenhuma</SelectItem><SelectItem value="NOVIDADE">🔥 NOVIDADE</SelectItem><SelectItem value="MAIS VENDIDO">💜 MAIS VENDIDO</SelectItem></SelectContent></Select><FormMessage /></FormItem> )} />
              </div>
              <FormField name="image" control={form.control} render={({ field }) => ( <FormItem><FormControl><ImageUploader value={field.value || ''} onChange={field.onChange} preview={imagePreview} onPreviewChange={setImagePreview} label="Imagem do Produto" /></FormControl><FormMessage /></FormItem> )} />
            </div>

            {/* Grupos de Personalização */}
            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Grupos de Personalização</h3>
              {groupFields.map((group, groupIndex) => (
                <div key={group.id} className="p-4 border rounded-lg space-y-4 bg-gray-50">
                  <div className="flex justify-between items-center">
                    <h4 className="font-medium">Grupo {groupIndex + 1}</h4>
                    <Button type="button" variant="destructive" size="sm" onClick={() => removeGroup(groupIndex)}>Remover Grupo</Button>
                  </div>
                  <FormField name={`customizationGroups.${groupIndex}.title`} control={form.control} render={({ field }) => ( <FormItem><FormLabel>Título do Grupo</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
                  <FormField name={`customizationGroups.${groupIndex}.description`} control={form.control} render={({ field }) => ( <FormItem><FormLabel>Descrição</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl><FormMessage /></FormItem> )} />
                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
                    <FormField name={`customizationGroups.${groupIndex}.minSelections`} control={form.control} render={({ field }) => ( <FormItem><FormLabel>Mínimo</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField name={`customizationGroups.${groupIndex}.maxSelections`} control={form.control} render={({ field }) => ( <FormItem><FormLabel>Máximo</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value))} /></FormControl><FormMessage /></FormItem> )} />
                    <FormField name={`customizationGroups.${groupIndex}.required`} control={form.control} render={({ field }) => ( <FormItem className="flex flex-col"><FormLabel>Obrigatório</FormLabel><FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl></FormItem> )} />
                  </div>
                  
                  <OptionsArray groupIndex={groupIndex} control={form.control} />
                </div>
              ))}
              <Button type="button" variant="outline" onClick={() => appendGroup({ id: `grp_${Date.now()}`, title: '', description: '', required: false, minSelections: 0, maxSelections: 1, options: [] })}>
                <Plus className="w-4 h-4 mr-2" /> Adicionar Grupo de Personalização
              </Button>
            </div>

            <div className="flex justify-between pt-6 border-t">
              <Button type="button" variant="outline" onClick={onCancel}><X className="w-4 h-4 mr-2" />Cancelar</Button>
              <Button type="submit" className="bg-orange-500 hover:bg-orange-600"><Save className="w-4 h-4 mr-2" />{product ? 'Atualizar' : 'Adicionar'}</Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}

function OptionsArray({ groupIndex, control }: { groupIndex: number, control: any }) {
  const { fields, append, remove } = useFieldArray({
    control,
    name: `customizationGroups.${groupIndex}.options`,
  });

  return (
    <div className="space-y-3 pl-4 border-l-2">
      <h5 className="font-medium">Opções</h5>
      {fields.map((option, optionIndex) => (
        <div key={option.id} className="p-3 border rounded-md bg-white">
          <div className="flex justify-between items-center mb-2">
            <p className="text-sm font-semibold">Opção {optionIndex + 1}</p>
            <Button type="button" variant="ghost" size="icon" className="h-6 w-6" onClick={() => remove(optionIndex)}><Trash2 className="w-4 h-4 text-red-500" /></Button>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-2">
            <FormField name={`customizationGroups.${groupIndex}.options.${optionIndex}.name`} control={control} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Nome</FormLabel><FormControl><Input {...field} /></FormControl><FormMessage /></FormItem> )} />
            <FormField name={`customizationGroups.${groupIndex}.options.${optionIndex}.price`} control={control} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Preço Adicional</FormLabel><FormControl><Input type="number" step="0.01" {...field} onChange={e => field.onChange(parseFloat(e.target.value) || 0)} /></FormControl><FormMessage /></FormItem> )} />
            <FormField name={`customizationGroups.${groupIndex}.options.${optionIndex}.maxQuantity`} control={control} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Qtd. Máx</FormLabel><FormControl><Input type="number" {...field} onChange={e => field.onChange(parseInt(e.target.value) || 1)} /></FormControl><FormMessage /></FormItem> )} />
            <FormField name={`customizationGroups.${groupIndex}.options.${optionIndex}.tag`} control={control} render={({ field }) => ( <FormItem><FormLabel className="text-xs">Tag (Opcional)</FormLabel><FormControl><Input {...field} value={field.value || ''} placeholder="Ex: Grátis no 1° Pedido" /></FormControl><FormMessage /></FormItem> )} />
          </div>
        </div>
      ))}
      <Button type="button" size="sm" variant="secondary" onClick={() => append({ id: `opt_${Date.now()}`, name: '', price: 0, maxQuantity: 1, tag: '' })}>
        <Plus className="w-3 h-3 mr-1" /> Adicionar Opção
      </Button>
    </div>
  );
}