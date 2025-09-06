"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Copy, Check, ChevronDown, ChevronUp, Shield, Smartphone, CreditCard, CheckCircle } from 'lucide-react';
import { useCart } from '@/contexts/CartContext';
import { Step1Data } from './CheckoutStep1';
import { Step2Data } from './CheckoutStep2';
import { toast } from 'sonner';
import * as fpixel from '@/lib/fpixel';
import { createPayment } from '@/lib/mangofyApi';
import { Collapsible, CollapsibleContent, CollapsibleTrigger } from '@/components/ui/collapsible';

interface CheckoutStep4Props {
  onFinish: () => void;
  onBack: () => void;
  personalData: Step1Data;
  deliveryData: Step2Data;
  cpf: string;
}

export function CheckoutStep4({ onFinish, onBack, personalData, deliveryData, cpf }: CheckoutStep4Props) {
  const [pixCode, setPixCode] = useState('');
  const [timeLeft, setTimeLeft] = useState(10 * 60); // 10 minutos em segundos
  const [copied, setCopied] = useState(false);
  const [isGenerating, setIsGenerating] = useState(true);
  const [paymentId, setPaymentId] = useState('');
  const [detailsOpen, setDetailsOpen] = useState(false);
  const { items, getTotalItems, getTotalPrice } = useCart();

  // Gerar PIX real via Mangofy
  useEffect(() => {
    const generateRealPix = async () => {
      setIsGenerating(true);
      
      try {
        const customerData = {
          name: personalData.name,
          email: personalData.email,
          cpf: cpf,
          phone: personalData.whatsapp
        };

        const cartItems = items.map(item => ({
          id: item.id,
          name: item.name,
          price: item.price,
          quantity: item.quantity
        }));

        const trackingParameters = {
          utm_source: '',
          utm_medium: '',
          utm_campaign: '',
          utm_term: '',
          utm_content: '',
          gclid: '',
          fbclid: '',
          user_agent: navigator.userAgent,
          ip_address: '',
          src: '',
          sck: ''
        };

        const result = await createPayment(
          getTotalPrice(),
          customerData,
          cartItems,
          deliveryData,
          trackingParameters
        );

        if (result.success && result.pixCopyPaste) {
          setPixCode(result.pixCopyPaste);
          setPaymentId(result.paymentId || '');
          
          // Disparar evento do Pixel
          fpixel.event('Purchase', {
            value: getTotalPrice(),
            currency: 'BRL',
            content_ids: items.map(item => item.id),
            content_type: 'product',
            num_items: items.reduce((sum, item) => sum + item.quantity, 0)
          });
        } else {
          toast.error('Erro ao gerar PIX: ' + (result.error || 'Erro desconhecido'));
        }
      } catch (error) {
        console.error('Erro ao gerar PIX:', error);
        toast.error('Erro ao gerar PIX. Tente novamente.');
      } finally {
        setIsGenerating(false);
      }
    };

    generateRealPix();
    
    return () => {};
  }, [items, getTotalPrice, personalData, deliveryData, cpf]);

  // Timer countdown
  useEffect(() => {
    if (timeLeft > 0 && !isGenerating) {
      const timer = setTimeout(() => setTimeLeft(timeLeft - 1), 1000);
      return () => clearTimeout(timer);
    }
    
    return () => {};
  }, [timeLeft, isGenerating]);

  const formatTime = (seconds: number): string => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const copyToClipboard = async (): Promise<void> => {
    try {
      await navigator.clipboard.writeText(pixCode);
      setCopied(true);
      toast.success('Código PIX copiado!');
      setTimeout(() => setCopied(false), 2000);
    } catch (err) {
      toast.error('Erro ao copiar código');
    }
  };

  const total = getTotalPrice();

  if (isGenerating) {
    return (
      <div className="space-y-6 p-6">
        <div className="text-center">
          <h3 className="text-lg font-semibold text-gray-800 mb-2">Gerando seu PIX</h3>
          <p className="text-sm text-gray-500">Aguarde um momento...</p>
        </div>

        <div className="flex justify-center items-center py-12">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-orange-500"></div>
        </div>

        <div className="text-center">
          <p className="text-sm text-gray-600">Estamos processando seu pedido</p>
        </div>
      </div>
    );
  }

  return (
    <div className="space-y-6 p-6 bg-gray-50">
      {/* Título */}
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-700 mb-4">
          Falta pouco! Para finalizar a compra, efetue o pagamento com PIX!
        </h3>
      </div>

      {/* Timer */}
      <div className="text-center">
        <p className="text-sm text-gray-600">
          O código expira em: <span className="text-red-500 font-semibold">{formatTime(timeLeft)}</span>
        </p>
      </div>

      {/* Instruções de cópia */}
      <div className="text-center">
        <p className="text-sm text-gray-600 mb-4">
          Copie a chave abaixo e utilize a<br />
          opção <strong>PIX Copia e Cola:</strong>
        </p>
      </div>

      {/* Campo do código PIX */}
      <div className="space-y-3">
        <div className="bg-white border rounded-lg p-3">
          <input
            type="text"
            value={pixCode}
            readOnly
            className="w-full text-sm text-gray-700 bg-transparent border-none outline-none"
          />
        </div>
        
        <Button
          onClick={copyToClipboard}
          className="w-full bg-green-500 hover:bg-green-600 text-white font-semibold py-3 rounded-lg flex items-center justify-center gap-2"
        >
          {copied ? (
            <>
              <Check className="w-4 h-4" />
              CÓDIGO COPIADO
            </>
          ) : (
            <>
              <Copy className="w-4 h-4" />
              COPIAR CÓDIGO
            </>
          )}
        </Button>
      </div>

      {/* Valor a ser pago */}
      <div className="text-center py-4">
        <p className="text-sm text-gray-600">Valor a ser pago:</p>
        <p className="text-2xl font-bold text-green-600">
          R$ {total.toFixed(2).replace('.', ',')}
        </p>
      </div>

      {/* Instruções para pagamento - sempre abertas */}
      <div className="bg-white rounded-lg border">
        <div className="p-4 border-b">
          <span className="text-sm font-medium text-gray-700">Instruções para pagamento</span>
        </div>
        <div className="p-4 space-y-3">
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <Smartphone className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">
              Após copiar o código, abra seu aplicativo de pagamento onde você utiliza o Pix.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CreditCard className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">
              Escolha a opção <strong>PIX Copia e Cola</strong> e insira o código copiado.
            </p>
          </div>
          
          <div className="flex items-start gap-3">
            <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center flex-shrink-0">
              <CheckCircle className="w-4 h-4 text-green-600" />
            </div>
            <p className="text-sm text-gray-600">
              Confirme as informações e finalize sua compra.
            </p>
          </div>
        </div>
      </div>

      {/* Detalhes da compra */}
      <Collapsible open={detailsOpen} onOpenChange={setDetailsOpen}>
        <CollapsibleTrigger className="w-full">
          <div className="flex items-center justify-between p-4 bg-white rounded-lg border">
            <span className="text-sm font-medium text-gray-700">Detalhes da compra:</span>
            {detailsOpen ? (
              <ChevronUp className="w-4 h-4 text-gray-500" />
            ) : (
              <ChevronDown className="w-4 h-4 text-gray-500" />
            )}
          </div>
        </CollapsibleTrigger>
        <CollapsibleContent>
          <div className="bg-white border-t-0 rounded-b-lg p-4">
            <div className="space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600">Cliente:</span>
                <span className="text-gray-800">{personalData.name}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">WhatsApp:</span>
                <span className="text-gray-800">{personalData.whatsapp}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Entrega:</span>
                <span className="text-gray-800">{deliveryData.endereco}, {deliveryData.numero}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600">Bairro:</span>
                <span className="text-gray-800">{deliveryData.bairro}</span>
              </div>
              {cpf && (
                <div className="flex justify-between">
                  <span className="text-gray-600">CPF:</span>
                  <span className="text-gray-800">{cpf.replace(/(\d{3})(\d{3})(\d{3})(\d{2})/, '$1.$2.$3-$4')}</span>
                </div>
              )}
              <div className="flex justify-between">
                <span className="text-gray-600">Itens:</span>
                <span className="text-gray-800">{getTotalItems()}</span>
              </div>
              <div className="flex justify-between font-semibold border-t pt-2">
                <span className="text-gray-700">Total:</span>
                <span className="text-gray-800">R$ {total.toFixed(2).replace('.', ',')}</span>
              </div>
            </div>
          </div>
        </CollapsibleContent>
      </Collapsible>

      {/* Rodapé apenas com ambiente seguro */}
      <div className="flex items-center justify-center py-4">
        <div className="flex items-center gap-2">
          <Shield className="w-5 h-5 text-gray-400" />
          <span className="text-xs text-gray-500">Ambiente<br />seguro</span>
        </div>
      </div>
    </div>
  );
}