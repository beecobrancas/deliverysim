"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { Edit, Check } from 'lucide-react';
import { toast } from 'sonner';

export interface Step2Data {
  cep: string;
  endereco: string;
  numero: string;
  complemento: string;
  bairro: string;
  cidade: string;
  estado: string;
  deliveryOption: 'standard';
}

interface CheckoutStep2Props {
  onNext: (data: Step2Data) => void;
  onBack: () => void;
  initialData?: Step2Data;
}

export function CheckoutStep2({ onNext, onBack, initialData }: CheckoutStep2Props) {
  const [step, setStep] = useState<'cep' | 'address' | 'delivery'>('cep');
  const [formData, setFormData] = useState<Step2Data>({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    deliveryOption: 'standard',
    ...initialData
  });

  const [isLoadingCep, setIsLoadingCep] = useState(false);

  const handleInputChange = (field: keyof Step2Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const fetchAddressByCep = async (cep: string) => {
    if (cep.length !== 8) return;
    
    setIsLoadingCep(true);
    try {
      const response = await fetch(`https://viacep.com.br/ws/${cep}/json/`);
      const data = await response.json();
      
      if (data.erro) {
        toast.error('CEP não encontrado');
        return;
      }

      setFormData(prev => ({
        ...prev,
        endereco: data.logradouro || '',
        bairro: data.bairro || '',
        cidade: data.localidade || '',
        estado: data.uf || ''
      }));

      // Ir automaticamente para a próxima etapa
      setTimeout(() => {
        setStep('address');
      }, 500);
    } catch (error) {
      toast.error('Erro ao buscar CEP');
    } finally {
      setIsLoadingCep(false);
    }
  };

  // Buscar CEP automaticamente quando tiver 8 dígitos
  useEffect(() => {
    if (formData.cep.length === 8 && !isLoadingCep) {
      fetchAddressByCep(formData.cep);
    }
  }, [formData.cep]);

  const handleAddressSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.endereco || !formData.numero || !formData.bairro || !formData.cidade) {
      toast.error('Preencha todos os campos obrigatórios');
      return;
    }

    setStep('delivery');
  };

  const handleDeliverySubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('checkout-step2', JSON.stringify(formData));
    }

    onNext(formData);
  };

  const formatCep = (cep: string) => {
    return cep.replace(/(\d{5})(\d{3})/, '$1-$2');
  };

  // Carregar dados do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('checkout-step2');
      if (saved && !initialData) {
        const data = JSON.parse(saved);
        setFormData(data);
        if (data.cep && data.endereco) {
          setStep('delivery');
        } else if (data.cep) {
          setStep('address');
        }
      }
    }
  }, [initialData]);

  // Etapa 1: Apenas CEP
  if (step === 'cep') {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Entrega</h3>
          <p className="text-sm text-gray-500">Para quem devemos enviar o pedido?</p>
        </div>

        <div className="space-y-4">
          <div>
            <Label htmlFor="cep" className="text-sm font-medium text-gray-700">CEP</Label>
            <div className="relative mt-1">
              <Input
                id="cep"
                type="text"
                placeholder="00000-000"
                value={formData.cep}
                onChange={(e) => {
                  const cleanCep = e.target.value.replace(/\D/g, '');
                  handleInputChange('cep', cleanCep);
                }}
                maxLength={8}
                disabled={isLoadingCep}
                className="pr-10"
              />
              {formData.cep.length === 8 && !isLoadingCep && (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
            {isLoadingCep && (
              <p className="text-xs text-gray-500 mt-1">Buscando endereço...</p>
            )}
          </div>
        </div>

        <div className="flex justify-between pt-6">
          <Button 
            type="button"
            variant="outline" 
            onClick={onBack}
            className="h-12 px-8"
          >
            Voltar
          </Button>
          
          <div className="w-32"></div> {/* Espaçador para manter o botão voltar alinhado */}
        </div>
      </div>
    );
  }

  // Etapa 2: Endereço completo
  if (step === 'address') {
    return (
      <div className="space-y-6 p-6">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Entrega</h3>
          <p className="text-sm text-gray-500">Para quem devemos enviar o pedido?</p>
        </div>

        <form onSubmit={handleAddressSubmit} className="space-y-4">
          {/* CEP com check */}
          <div>
            <Label className="text-sm font-medium text-gray-700">CEP</Label>
            <div className="flex items-center gap-2 mt-1">
              <div className="flex-1 bg-gray-50 border rounded-md px-3 py-2 text-sm">
                {formatCep(formData.cep)}
              </div>
              <Check className="w-4 h-4 text-green-500" />
              <span className="text-xs text-gray-500">{formData.cidade}/{formData.estado}</span>
            </div>
          </div>

          {/* Endereço */}
          <div>
            <Label htmlFor="endereco" className="text-sm font-medium text-gray-700">Endereço/Rua</Label>
            <div className="relative mt-1">
              <Input
                id="endereco"
                type="text"
                value={formData.endereco}
                onChange={(e) => handleInputChange('endereco', e.target.value)}
                className="pr-10"
              />
              {formData.endereco && (
                <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
              )}
            </div>
          </div>

          {/* Número e Bairro */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label htmlFor="numero" className="text-sm font-medium text-gray-700">Número</Label>
              <div className="relative mt-1">
                <Input
                  id="numero"
                  type="text"
                  value={formData.numero}
                  onChange={(e) => handleInputChange('numero', e.target.value)}
                  className="pr-10"
                />
                {formData.numero && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
            
            <div>
              <Label htmlFor="bairro" className="text-sm font-medium text-gray-700">Bairro</Label>
              <div className="relative mt-1">
                <Input
                  id="bairro"
                  type="text"
                  value={formData.bairro}
                  onChange={(e) => handleInputChange('bairro', e.target.value)}
                  className="pr-10"
                />
                {formData.bairro && (
                  <Check className="absolute right-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-green-500" />
                )}
              </div>
            </div>
          </div>

          {/* Complemento */}
          <div>
            <Label htmlFor="complemento" className="text-sm font-medium text-gray-700">Complemento (Opcional)</Label>
            <Input
              id="complemento"
              type="text"
              value={formData.complemento}
              onChange={(e) => handleInputChange('complemento', e.target.value)}
              className="mt-1"
            />
          </div>

          <div className="flex justify-between items-center pt-6">
            <Button 
              type="button"
              variant="outline" 
              onClick={() => setStep('cep')}
              className="h-12 px-8"
            >
              Voltar
            </Button>
            
            <Button 
              type="submit"
              className="bg-orange-500 hover:bg-orange-600 h-12 px-8"
            >
              Continuar
            </Button>
          </div>
        </form>
      </div>
    );
  }

  // Etapa 3: Opções de entrega (apenas entrega padrão)
  return (
    <div className="space-y-6 p-6">
      <div className="flex items-center justify-between">
        <div>
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Entrega</h3>
          <p className="text-sm text-gray-500">Para quem devemos enviar o pedido?</p>
        </div>
        <Button
          variant="ghost"
          size="icon"
          onClick={() => setStep('address')}
          className="text-gray-400 hover:text-gray-600"
        >
          <Edit className="w-4 h-4" />
        </Button>
      </div>

      {/* Endereço resumido */}
      <div className="text-sm text-gray-700">
        <p className="font-medium">{formData.endereco}, {formData.numero}</p>
        <p>{formData.bairro}, {formData.cidade}/{formData.estado}</p>
        <p>{formatCep(formData.cep)}</p>
      </div>

      <form onSubmit={handleDeliverySubmit} className="space-y-6">
        <div>
          <h4 className="text-md font-medium text-gray-800 mb-4">Escolha uma forma de entrega:</h4>
          
          {/* Apenas Entrega Padrão - sem ícone */}
          <Card className="border-2 border-orange-500 bg-orange-50">
            <CardContent className="p-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-4">
                  <div className="w-4 h-4 rounded-full bg-orange-500 border-orange-500" />
                  <span className="font-medium text-gray-800">Entrega Padrão</span>
                </div>
                <div className="text-right">
                  <p className="font-semibold text-green-600">Grátis</p>
                </div>
              </div>
              <p className="text-sm text-gray-600 ml-8 mt-1">30 a 50 min</p>
            </CardContent>
          </Card>
        </div>

        <div className="flex justify-between items-center pt-8">
          <Button 
            type="button"
            variant="outline" 
            onClick={() => setStep('address')}
            className="h-12 px-8"
          >
            Voltar
          </Button>
          
          <Button 
            type="submit"
            className="bg-orange-500 hover:bg-orange-600 h-12 px-8"
          >
            Ir Para Pagamento →
          </Button>
        </div>
      </form>
    </div>
  );
};