"use client";

import React, { useEffect } from 'react';
import { useForm } from 'react-hook-form';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from '@/components/ui/card';
import { Form, FormControl, FormField, FormItem, FormLabel, FormMessage } from '@/components/ui/form';
import { ImageUploader } from './ImageUploader';
import { Save, Facebook } from 'lucide-react';
import { toast } from 'sonner';
import { useSettings, SiteSettings } from '@/contexts/SettingsContext';
import { useAdmin } from '@/contexts/AdminContext';
import { useUser } from '@/contexts/UserContext';
import { Switch } from '@/components/ui/switch';
import { Skeleton } from '@/components/ui/skeleton';

export function GeneralSettings() {
  const { settings, updateSettings, loading: loadingSettings } = useSettings();
  const { products } = useAdmin();
  const { users } = useUser();

  const form = useForm<SiteSettings>({
    defaultValues: settings,
  });

  useEffect(() => {
    if (!loadingSettings) {
      form.reset(settings);
    }
  }, [settings, loadingSettings, form]);

  const onSubmit = async (data: SiteSettings) => {
    try {
      await updateSettings(data);
      document.documentElement.style.setProperty('--primary-color', data.primary_color);
      
      const logoElement = document.querySelector('img[alt="Rei das Coxinhas"]') as HTMLImageElement;
      if (logoElement) {
        logoElement.src = data.logo;
      }
    } catch (error) {
      if (error instanceof Error && error.message.includes('quota')) {
        toast.error('Limite de armazenamento excedido! Use URLs para imagens.');
      } else {
        toast.error('Erro ao salvar configurações. Tente novamente.');
      }
      console.error('Erro ao salvar configurações:', error);
    }
  };

  if (loadingSettings) {
    return (
      <div className="space-y-6">
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
              <Skeleton className="h-10 w-full" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardHeader><Skeleton className="h-8 w-1/2" /></CardHeader>
          <CardContent className="space-y-4">
            <Skeleton className="h-24 w-full" />
            <Skeleton className="h-10 w-full" />
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <Form {...form}>
      <form onSubmit={form.handleSubmit(onSubmit)} className="space-y-6">
        <Card>
          <CardHeader>
            <CardTitle>Conteúdo do Cabeçalho</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="header_title" render={({ field }) => (<FormItem><FormLabel>Título Principal</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="header_subtitle" render={({ field }) => (<FormItem><FormLabel>Subtítulo</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="min_order" render={({ field }) => (<FormItem><FormLabel>Pedido Mínimo</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="delivery_info" render={({ field }) => (<FormItem><FormLabel>Info de Entrega (Tempo/Custo)</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="distance" render={({ field }) => (<FormItem><FormLabel>Distância Padrão</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="rating" render={({ field }) => (<FormItem><FormLabel>Nota Média</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
              <FormField control={form.control} name="reviews_count" render={({ field }) => (<FormItem><FormLabel>Total de Avaliações</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Banner Promocional</CardTitle>
            <CardDescription>Personalize a faixa de promoção que aparece abaixo do cabeçalho.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-4">
            <FormField control={form.control} name="banner_text" render={({ field }) => (<FormItem><FormLabel>Texto do Banner</FormLabel><FormControl><Input {...field} value={field.value || ''} /></FormControl></FormItem>)} />
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormItem>
                <FormLabel>Cor de Fundo do Banner</FormLabel>
                <div className="flex items-center gap-2">
                  <FormField control={form.control} name="banner_bg_color" render={({ field }) => (<FormControl><Input type="color" {...field} value={field.value || '#dc2626'} className="w-12 h-10 p-1" /></FormControl>)} />
                  <FormField control={form.control} name="banner_bg_color" render={({ field }) => (<FormControl><Input type="text" {...field} value={field.value || ''} placeholder="#dc2626" /></FormControl>)} />
                </div>
              </FormItem>
              <FormItem>
                <FormLabel>Cor do Texto do Banner</FormLabel>
                <div className="flex items-center gap-2">
                  <FormField control={form.control} name="banner_text_color" render={({ field }) => (<FormControl><Input type="color" {...field} value={field.value || '#ffffff'} className="w-12 h-10 p-1" /></FormControl>)} />
                  <FormField control={form.control} name="banner_text_color" render={({ field }) => (<FormControl><Input type="text" {...field} value={field.value || ''} placeholder="#ffffff" /></FormControl>)} />
                </div>
              </FormItem>
            </div>
            <FormField
              control={form.control}
              name="show_banner"
              render={({ field }) => (
                <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm mt-4">
                  <div className="space-y-0.5">
                    <FormLabel>Exibir Banner Promocional</FormLabel>
                    <p className="text-sm text-muted-foreground">
                      Ative para mostrar a faixa de promoção no site.
                    </p>
                  </div>
                  <FormControl>
                    <Switch
                      checked={field.value}
                      onCheckedChange={field.onChange}
                    />
                  </FormControl>
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Marketing e Analytics</CardTitle>
            <CardDescription>Conecte suas ferramentas de marketing para rastrear eventos.</CardDescription>
          </CardHeader>
          <CardContent>
            <FormField
              control={form.control}
              name="facebook_pixel_id"
              render={({ field }) => (
                <FormItem>
                  <FormLabel className="flex items-center gap-2">
                    <Facebook className="w-4 h-4" />
                    ID do Pixel do Facebook
                  </FormLabel>
                  <FormControl>
                    <Input {...field} value={field.value || ''} placeholder="Cole seu ID do Pixel aqui" />
                  </FormControl>
                  <FormMessage />
                </FormItem>
              )}
            />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Aparência e Notificações</CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <FormField control={form.control} name="logo" render={({ field }) => (<FormItem><FormControl><ImageUploader value={field.value || ''} onChange={field.onChange} preview={field.value || ''} onPreviewChange={(p) => field.onChange(p)} label="Logo do Site" previewClassName="w-16 h-16 object-cover rounded-full border" /></FormControl></FormItem>)} />
              <FormField control={form.control} name="default_image" render={({ field }) => (<FormItem><FormControl><ImageUploader value={field.value || ''} onChange={field.onChange} preview={field.value || ''} onPreviewChange={(p) => field.onChange(p)} label="Imagem Padrão dos Produtos" previewClassName="w-32 h-32 object-cover rounded-lg border" /></FormControl></FormItem>)} />
            </div>
            <FormItem>
              <FormLabel>Cor de Fundo do Cabeçalho</FormLabel>
              <div className="flex items-center gap-2">
                <FormField control={form.control} name="header_bg_color" render={({ field }) => (<FormControl><Input type="color" {...field} value={field.value || '#f97316'} className="w-12 h-10 p-1" /></FormControl>)} />
                <FormField control={form.control} name="header_bg_color" render={({ field }) => (<FormControl><Input type="text" {...field} value={field.value || ''} placeholder="#f97316" /></FormControl>)} />
              </div>
            </FormItem>
            <FormField control={form.control} name="show_notifications" render={({ field }) => (
              <FormItem className="flex flex-row items-center justify-between rounded-lg border p-3 shadow-sm">
                <div className="space-y-0.5">
                  <FormLabel>Notificações</FormLabel>
                  <p className="text-sm text-muted-foreground">Ativar/desativar pop-ups como "Item adicionado".</p>
                </div>
                <FormControl><Switch checked={field.value} onCheckedChange={field.onChange} /></FormControl>
              </FormItem>
            )} />
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Estatísticas</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-center">
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-2xl font-bold text-orange-600">{products.length}</p><p className="text-sm text-gray-600">Produtos</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-2xl font-bold text-green-600">{products.filter(p => p.category === 'combos').length}</p><p className="text-sm text-gray-600">Combos</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-2xl font-bold text-blue-600">{users.length}</p><p className="text-sm text-gray-600">Usuários</p></div>
              <div className="bg-gray-50 p-3 rounded-lg"><p className="text-2xl font-bold text-purple-600">{products.filter(p => p.tag === 'MAIS VENDIDO').length}</p><p className="text-sm text-gray-600">Mais Vendidos</p></div>
            </div>
          </CardContent>
        </Card>

        <div className="flex justify-end pt-4 border-t">
          <Button type="submit" className="bg-green-600 hover:bg-green-700">
            <Save className="w-4 h-4 mr-2" />
            Salvar Todas as Configurações
          </Button>
        </div>
      </form>
    </Form>
  );
}