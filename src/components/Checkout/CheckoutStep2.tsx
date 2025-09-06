"use client";

import React, { useState } from 'react';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import * as z from 'zod';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { buscarCep, formatarCep } from '@/lib/viacep';
import { toast } from 'sonner';
import { Loader2 } from 'lucide-react';

const formSchema = z.object({
  cep: z.string().min(8, "CEP deve ter 8 dígitos").max(9, "CEP inválido"),
  endereco: z.string().min(5, "Endereço é obrigatório"),
  numero: z.string().min(1, "Número é obrigatório"),
  complemento: z.string().optional(),
  bairro: z.string().min(2, "Bairro é obrigatório"),
  cidade: z.string().min(2, "Cidade é obrigatória"),
  estado: z.string().length(2, "Estado deve ter 2 caracteres"),
});

export type Step2Data = z.infer<typeof formSchema>;

interface CheckoutStep2Props {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  initialData?: Partial<Step2Data>;
}

export function CheckoutStep2({ onNext, onBack, initialData }: CheckoutStep2Props) {
  const [loadingCep, setLoadingCep] = useState(false);
  
  const form = useForm<Step2Data>({
    resolver: zodResolver(formSchema),
    defaultValues: {
      cep: initialData?.cep || "",
      endereco: initialData?.endereco || "",
      numero: initialData?.numero || "",
      complemento: initialData?.complemento || "",
      bairro: initialData?.bairro || "",
      cidade: initialData?.cidade || "",
      estado: initialData?.estado || "",
    },
  });

  const handleCepBlur = async (cep: string) => {
    const cleanCep = cep.replace(/\D/g, '');
    
    if (cleanCep.length !== 8) {
      return;
    }

    setLoadingCep(true);
    
    try {
      const result = await buscarCep(cleanCep);
      
      if (result.success && result.data) {
        const { logradouro, bairro, localidade, uf } = result.data;
        
        // Preencher os campos automaticamente
        form.setValue('endereco', logradouro);
        form.setValue('bairro', bairro);
        form.setValue('cidade', localidade);
        form.setValue('estado', uf);
        
        toast.success('Endereço encontrado!');
        
        // Focar no campo número
        setTimeout(() => {
          const numeroField = document.querySelector('input[name="numero"]') as HTMLInputElement;
          if (numeroField) {
            numeroField.focus();
          }
        }, 100);
      } else {
        toast.error(result.error || 'CEP não encontrado');
      }
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setLoadingCep(false);
    }
  };

  const formatCepInput = (value: string) => {
    const numbers = value.replace(/\D/g, '');
    return formatarCep(numbers);
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Dados de Entrega</h3>
        <p className="text-sm text-gray-600">Etapa 2 de 4</p>
      </div>

      <Form {...form}>
        <form onSubmit={form.handleSubmit(onNext)} className="space-y-4">
          <FormField
            control={form.control}
            name="cep"
            render={({ field }) => (
              <FormItem>
                <FormLabel>CEP *</FormLabel>
                <FormControl>
                  <div className="relative">
                    <Input 
                      placeholder="00000-000"
                      {...field}
                      onChange={(e) => {
                        const formatted = formatCepInput(e.target.value);
                        field.onChange(formatted);
                      }}
                      onBlur={(e) => handleCepBlur(e.target.value)}
                      maxLength={9}
                    />
                    {loadingCep && (
                      <Loader2 className="absolute right-3 top-3 h-4 w-4 animate-spin text-gray-400" />
                    )}
                  </div>
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <FormField
            control={form.control}
            name="endereco"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Endereço *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Rua, Avenida, etc."
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="numero"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Número *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="123"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="complemento"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Complemento</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Apto, Bloco, etc."
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <FormField
            control={form.control}
            name="bairro"
            render={({ field }) => (
              <FormItem>
                <FormLabel>Bairro *</FormLabel>
                <FormControl>
                  <Input 
                    placeholder="Nome do bairro"
                    {...field}
                  />
                </FormControl>
                <FormMessage />
              </FormItem>
            )}
          />

          <div className="grid grid-cols-2 gap-4">
            <FormField
              control={form.control}
              name="cidade"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Cidade *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="Nome da cidade"
                      {...field}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />

            <FormField
              control={form.control}
              name="estado"
              render={({ field }) => (
                <FormItem>
                  <FormLabel>Estado *</FormLabel>
                  <FormControl>
                    <Input 
                      placeholder="SP"
                      {...field}
                      maxLength={2}
                      style={{ textTransform: 'uppercase' }}
                      onChange={(e) => {
                        field.onChange(e.target.value.toUpperCase());
                      }}
                    />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </div>

          <div className="flex justify-between pt-4">
            <Button 
              type="button"
              variant="outline" 
              onClick={onBack}
              size="lg"
            >
              Voltar
            </Button>
            
            <Button 
              type="submit" 
              className="bg-orange-500 hover:bg-orange-600"
              size="lg"
            >
              Continuar para Entrega
            </Button>
          </div>
        </form>
      </Form>
    </div>
  );
}