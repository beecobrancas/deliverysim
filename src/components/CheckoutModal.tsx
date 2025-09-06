"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';
import { CheckoutStep1, Step1Data } from '@/components/Checkout/CheckoutStep1';
import { CheckoutStep2, Step2Data } from '@/components/Checkout/CheckoutStep2';
import { CheckoutStep3 } from '@/components/Checkout/CheckoutStep3';
import { CheckoutStep4 } from '@/components/Checkout/CheckoutStep4';
import { Progress } from '@/components/ui/progress';
import { useCart } from '@/contexts/CartContext';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
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
  const [cpf, setCpf] = useState('');
  const { clearCart } = useCart();

  const handleNextStep1 = (data: Step1Data) => {
    setPersonalData(data);
    setStep(2);
  };

  const handleNextStep2 = (data: Step2Data) => {
    setDeliveryData(data);
    setStep(3);
  };

  const handleNextStep3 = (cpfData?: string) => {
    if (cpfData) {
      setCpf(cpfData);
    }
    setStep(4);
  };

  const handleFinishCheckout = () => {
    clearCheckoutCache();
    clearCart();
    onClose();
    // Reset para step 1 quando fechar
    setStep(1);
    // Reset dos dados
    setPersonalData({ name: '', email: '', whatsapp: '' });
    setDeliveryData({
      cep: '',
      endereco: '',
      numero: '',
      complemento: '',
      bairro: '',
      cidade: '',
      estado: '',
      deliveryOption: 'standard'
    });
    setCpf('');
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

  const getProgressValue = () => {
    if (step <= 3) {
      return (step / 3) * 100;
    }
    return 100;
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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto p-0">
        <div className="p-6 border-b">
          <h2 className="text-xl font-bold text-center text-gray-800 mb-4">
            Finalizar Pedido
          </h2>
          
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

        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}