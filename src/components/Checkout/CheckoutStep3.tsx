"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent } from '@/components/ui/card';
import { QrCode, Lock, Info } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Step1Data } from './CheckoutStep1';
import { Step2Data } from './CheckoutStep2';
import * as fpixel from '@/lib/fpixel';

interface CheckoutStep3Props {
  onNext: (cpf: string) => void; // Agora passa o CPF para o próximo step
  onBack: () => void;
  personalData: Step1Data;
  deliveryData: Step2Data;
}

export function CheckoutStep3({ onNext, onBack, personalData, deliveryData }: CheckoutStep3Props) {
  const [isProcessing, setIsProcessing] = useState(false);
  const [cpf, setCpf] = useState('');
  const { items, getTotalPrice } = useCart();

  const handleFinalizePurchase = async () => {
    if (!cpf || cpf.length < 11) {
      return;
    }

    setIsProcessing(true);
    
    try {
      // Disparar evento do Pixel
      fpixel.event('InitiateCheckout', {
        value: getTotalPrice(),
        currency: 'BRL',
        content_ids: items.map(item => item.id),
        content_type: 'product',
        num_items: items.reduce((sum, item) => sum + item.quantity, 0)
      });

      // Simular processamento
      await new Promise(resolve => setTimeout(resolve, 1500));
      
      console.log('Iniciando geração do PIX:', {
        personalData,
        deliveryData,
        items,
        total: getTotalPrice(),
        cpf
      });

      // Ir para a próxima etapa (geração do PIX) passando o CPF
      onNext(cpf);
    } catch (error) {
      console.error('Erro ao processar pedido:', error);
    } finally {
      setIsProcessing(false);
    }
  };

  // Como só temos entrega padrão (grátis), o total é sempre o valor dos produtos
  const total = getTotalPrice();

  const formatCpf = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    return cleanValue.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4');
  };

  const handleCpfChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    setCpf(cleanValue);
  };

  return (
    <div className="space-y-6 p-6">
      <div>
        <h3 className="text-lg font-semibold text-gray-800 mb-2">Opção de pagamento</h3>
        <p className="text-sm text-gray-500">Escolha uma forma de pagamento</p>
      </div>

      {/* PIX Option */}
      <Card className="border-2 border-gray-800">
        <CardContent className="p-6">
          <div className="flex items-center gap-3 mb-4">
            <div className="w-4 h-4 rounded-full bg-gray-800" />
            <QrCode className="w-5 h-5 text-gray-800" />
            <span className="font-semibold text-gray-800">PIX</span>
          </div>

          <div className="space-y-4">
            <div>
              <h4 className="font-medium text-gray-800 mb-2">A confirmação do seu pagamento é mais rápida</h4>
              <p className="text-sm text-gray-600 leading-relaxed">
                Após clicar em 'Finalizar compra' você terá 30 minutos para pagar com Pix usando QR Code ou código que será exibido. A confirmação é instantânea.
              </p>
            </div>

            <div className="space-y-2">
              <div className="flex items-center gap-2">
                <Label htmlFor="cpf" className="text-sm font-medium text-gray-700">CPF</Label>
                <Info className="w-3 h-3 text-gray-400" />
              </div>
              <Input
                id="cpf"
                type="text"
                placeholder="000.000.000-00"
                value={formatCpf(cpf)}
                onChange={(e) => handleCpfChange(e.target.value)}
                maxLength={14}
                className="w-full"
              />
            </div>

            <div className="bg-orange-50 border border-orange-200 rounded-lg p-4">
              <p className="text-lg font-bold text-orange-600">
                Valor no Pix: R$ {total.toFixed(2).replace('.', ',')}
              </p>
            </div>
          </div>
        </CardContent>
      </Card>

      <div className="flex justify-between pt-4">
        <Button 
          type="button"
          variant="outline" 
          onClick={onBack}
          className="h-12 px-8"
        >
          Voltar
        </Button>
        
        <Button 
          onClick={handleFinalizePurchase}
          className="bg-orange-500 hover:bg-orange-600 h-12 px-8 text-white font-semibold flex items-center gap-2"
          disabled={isProcessing || !cpf || cpf.length < 11}
        >
          {isProcessing ? (
            <>
              <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
              Processando...
            </>
          ) : (
            <>
              <Lock className="w-4 h-4" />
              Finalizar Compra
            </>
          )}
        </Button>
      </div>
    </div>
  );
}