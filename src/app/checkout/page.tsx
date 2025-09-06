"use client";

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { useCart } from '@/contexts/CartContext';
import { CheckoutStep1, Step1Data } from '@/components/Checkout/CheckoutStep1';
import { CheckoutStep2, Step2Data } from '@/components/Checkout/CheckoutStep2';
import { CheckoutStep3 } from '@/components/Checkout/CheckoutStep3';
import { CheckoutStep4 } from '@/components/Checkout/CheckoutStep4';
import { Progress } from '@/components/ui/progress';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import * as fpixel from '@/lib/fpixel';

export default function CheckoutPage() {
  const [step, setStep] = useState(1);
  const [personalData, setPersonalData] = useState<Step1Data>({
    name: '',
    email: '',
    whatsapp: ''
  });
  const [deliveryData, setDeliveryData] = useState<Step2Data>({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: '',
    deliveryOption: 'standard'
  });
  const [cpf, setCpf] = useState(''); // CPF agora é estado separado
  const { items, clearCart, getTotalPrice } = useCart();
  const router = useRouter();

  // Tracking do Facebook Pixel quando entra no checkout
  useEffect(() => {
    if (items.length > 0) {
      fpixel.event('InitiateCheckout', {
        value: getTotalPrice(),
        currency: 'BRL',
        content_ids: items.map(item => item.id),
        content_type: 'product',
        num_items: items.reduce((sum, item) => sum + item.quantity, 0)
      });
    }
  }, [items, getTotalPrice]);

  // Redirecionar se carrinho estiver vazio
  useEffect(() => {
    if (items.length === 0) {
      router.push('/');
    }
  }, [items, router]);

  const handleNextStep1 = (data: Step1Data) => {
    setPersonalData(data);
    setStep(2);
    
    // Tracking: Dados pessoais preenchidos
    fpixel.event('AddPaymentInfo', {
      value: getTotalPrice(),
      currency: 'BRL',
      content_ids: items.map(item => item.id)
    });
  };

  const handleNextStep2 = (data: Step2Data) => {
    setDeliveryData(data);
    setStep(3);
    
    // Tracking: Endereço preenchido
    fpixel.event('AddShippingInfo', {
      value: getTotalPrice(),
      currency: 'BRL',
      content_ids: items.map(item => item.id)
    });
  };

  const handleNextStep3 = (cpfData: string) => {
    setCpf(cpfData);
    setStep(4); // Vai para a tela do PIX (mas não aparece na progress bar)
    
    // Tracking: Iniciando processo de pagamento
    fpixel.event('Purchase', {
      value: getTotalPrice(),
      currency: 'BRL',
      content_ids: items.map(item => item.id),
      content_type: 'product',
      num_items: items.reduce((sum, item) => sum + item.quantity, 0)
    });
  };

  const handleFinishCheckout = () => {
    clearCheckoutCache();
    clearCart();
    
    // Tracking: Checkout finalizado
    fpixel.event('CompleteRegistration', {
      value: getTotalPrice(),
      currency: 'BRL'
    });
    
    router.push('/');
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const clearCheckoutCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('checkout-step1');
      localStorage.removeItem('checkout-step2');
      localStorage.removeItem('checkout-step3');
    }
  };

  // Progress bar mostra apenas 3 etapas, mesmo tendo 4 steps internos
  const getProgressValue = () => {
    if (step <= 3) {
      return (step / 3) * 100;
    }
    return 100; // Step 4 (PIX) mantém 100%
  };

  const renderStep = () => {
    switch (step) {
      case 1:
        return (
          <CheckoutStep1 
            onNext={handleNextStep1} 
            initialData={personalData}
          />
        );
      case 2:
        return (
          <CheckoutStep2 
            onNext={handleNextStep2} 
            onBack={handlePrevStep}
            initialData={deliveryData}
          />
        );
      case 3:
        return (
          <CheckoutStep3 
            onNext={handleNextStep3} 
            onBack={handlePrevStep}
            personalData={personalData}
            deliveryData={deliveryData}
          />
        );
      case 4:
        return (
          <CheckoutStep4 
            onFinish={handleFinishCheckout} 
            onBack={handlePrevStep}
            personalData={personalData}
            deliveryData={deliveryData}
            cpf={cpf}
          />
        );
      default:
        return (
          <CheckoutStep1 
            onNext={handleNextStep1}
            initialData={personalData}
          />
        );
    }
  };

  if (items.length === 0) {
    return null; // Ou um loading spinner
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <div className="max-w-4xl mx-auto py-8 px-4">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => router.push('/')}
            className="mb-4 text-gray-600 hover:text-gray-800"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Voltar para a loja
          </Button>
          
          <div className="bg-white rounded-lg shadow-sm p-6">
            <h1 className="text-2xl font-bold text-center text-gray-800 mb-4">
              Finalizar Pedido
            </h1>
            
            <div className="space-y-2">
              <Progress value={getProgressValue()} className="w-full" />
              <div className="flex justify-between text-xs text-gray-500">
                <span className={step >= 1 ? 'text-orange-600 font-medium' : ''}>
                  Dados Pessoais
                </span>
                <span className={step >= 2 ? 'text-orange-600 font-medium' : ''}>
                  Entrega
                </span>
                <span className={step >= 3 ? 'text-orange-600 font-medium' : ''}>
                  Pagamento
                </span>
              </div>
            </div>
          </div>
        </div>

        {/* Content */}
        <div className="bg-white rounded-lg shadow-sm">
          {renderStep()}
        </div>
      </div>
    </div>
  );
}