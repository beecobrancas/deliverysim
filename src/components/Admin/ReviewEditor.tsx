"use client";

import React, { useState, useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Review } from '@/types/product';
import { ImageUploader } from './ImageUploader';
import { Save, X } from 'lucide-react';
import { toast } from 'sonner';

const reviewSchema = z.object({
  name: z.string().min(1, "Nome é obrigatório"),
  rating: z.number().min(1).max(5, "Avaliação deve ser entre 1 e 5"),
  text: z.string().min(1, "Texto da avaliação é obrigatório"),
  image: z.string().optional(),
});

type ReviewFormData = z.infer<typeof reviewSchema>;

interface ReviewEditorProps {
  review: Review | null;
  isAdding: boolean;
  onSave: (data: Omit<Review, 'id' | 'created_at'>) => void;
  onCancel: () => void;
}

export function ReviewEditor({ review, isAdding, onSave, onCancel }: ReviewEditorProps) {
  const [imagePreview, setImagePreview] = useState<string>('');

  const form = useForm<ReviewFormData>({
    resolver: zodResolver(reviewSchema),
    defaultValues: {
      name: "",
      rating: 5,
      text: "",
      image: "",
    },
  });

  useEffect(() => {
    if (review) {
      setImagePreview(review.image || '');
      form.reset({
        name: review.name,
        rating: review.rating,
        text: review.text,
        image: review.image || "",
      });
    } else if (isAdding) {
      setImagePreview('');
      form.reset({
        name: "",
        rating: 5,
        text: "",
        image: "",
      });
    }
  }, [review, isAdding, form]);

  const onSubmit = (data: ReviewFormData) => {
    const reviewData = {
      name: data.name,
      rating: data.rating,
      text: data.text,
      image: data.image || "/images/prova1.png",
    };

    try {
      onSave(reviewData);
      toast.success(review ? 'Avaliação atualizada com sucesso!' : 'Avaliação adicionada com sucesso!');
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        toast.error('Limite de armazenamento excedido! Use URLs para imagens ou remova algumas avaliações.');
      } else {
        toast.error('Erro ao salvar a avaliação. Tente novamente.');
      }
      console.error('Erro ao salvar avaliação:', error);
    }
  };

  if (!review && !isAdding) {
    return (
      <div className="text-center py-8">
        <p className="text-gray-500 mb-4">Selecione uma avaliação para editar ou adicione uma nova</p>
      </div>
    );
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>
          {review ? 'Editar Avaliação' : 'Adicionar Nova Avaliação'}
        </CardTitle>
      </CardHeader>
      <CardContent>
        <Form {...form}>
          <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField
                control={form.control}
                name="name"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Nome do Cliente</FormLabel>
                    <FormControl>
                      <Input {...field} />
                    </FormControl>
                    <FormMessage />
                  </FormItem>
                )}
              />

              <FormField
                control={form.control}
                name="rating"
                render={({ field }) => (
                  <FormItem>
                    <FormLabel>Avaliação (1-5 estrelas)</FormLabel>
                    <Select onValueChange={(value) => field.onChange(parseInt(value))} value={field.value.toString()}>
                      <FormControl>
                        <SelectTrigger>
                          <SelectValue placeholder="Selecione a avaliação" />
                        </SelectTrigger>
                      </FormControl>
                      <SelectContent>
                        <SelectItem value="1">⭐ 1 estrela</SelectItem>
                        <SelectItem value="2">⭐⭐ 2 estrelas</SelectItem>
                        <SelectItem value="3">⭐⭐⭐ 3 estrelas</SelectItem>
                        <SelectItem value="4">⭐⭐⭐⭐ 4 estrelas</SelectItem>
                        <SelectItem value="5">⭐⭐⭐⭐⭐ 5 estrelas</SelectItem>
                      </SelectContent>
                    </Select>
                    <FormMessage />
                  </FormItem>
                )}
              />
            </div>

            <FormField
              control={form.control}
              name="text"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Texto da Avaliação</FormLabel>
                  <FormControl>
                    <Textarea {...field} rows={3} placeholder="Digite o comentário do cliente..." />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="image"
              render={({ field }) => (
                <FormItem>
                  <FormControl>
                    <ImageUploader
                      value={field.value || ''}
                      onChange={field.onChange}
                      preview={imagePreview}
                      onPreviewChange={setImagePreview}
                      label="Foto do Cliente"
                      placeholder="https://exemplo.com/foto.jpg"
                      previewClassName="w-16 h-16 object-cover rounded-full border-2 border-orange-200"
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <div className="flex justify-between">
              <Button 
                type="button"
                variant="outline"
                onClick={onCancel}
              >
                <X className="w-4 h-4 mr-2" />
                Cancelar
              </Button>
              
              <Button 
                type="submit"
                className="bg-blue-500 hover:bg-blue-600"
              >
                <Save className="w-4 h-4 mr-2" />
                {review ? 'Atualizar' : 'Adicionar'}
              </Button>
            </div>
          </form>
        </Form>
      </CardContent>
    </Card>
  );
}