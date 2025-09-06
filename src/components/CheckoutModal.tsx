"use client";

import React, { useState } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { useCart } from '@/contexts/CartContext';
import { CheckoutStep1, Step1Data } from './Checkout/CheckoutStep1';
import { CheckoutStep2, Step2Data } from './Checkout/CheckoutStep2';
import { CheckoutStep3 } from './Checkout/CheckoutStep3';
import { CheckoutStep4 } from './Checkout/CheckoutStep4';
import { Progress } from '@/components/ui/progress';

interface CheckoutModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export function CheckoutModal({ isOpen, onClose }: CheckoutModalProps) {
  const [step, setStep] = useState(1);
  const [personalData, setPersonalData] = useState<Step1Data>({
    name: '',
    email: '',
    cpf: '',
    whatsapp: ''
  });
  const [deliveryData, setDeliveryData] = useState<Step2Data>({
    cep: '',
    endereco: '',
    numero: '',
    complemento: '',
    bairro: '',
    cidade: '',
    estado: ''
  });
  const { clearCart } = useCart();

  const handleNextStep1 = (data: Step1Data) => {
    setPersonalData(data);
    setStep(2);
  };

  const handleNextStep2 = (data: Step2Data) => {
    setDeliveryData(data);
    setStep(3);
  };

  const handleNextStep3 = () => {
    setStep(4);
  };

  const handlePrevStep = () => {
    setStep(step - 1);
  };

  const handleFinish = () => {
    // Aqui você pode adicionar lógica adicional como enviar dados para backend
    console.log("Pedido finalizado:", { personalData, deliveryData });
    setStep(1); // Reset para próximo uso
    
    // Limpar cache do checkout quando finalizar
    clearCheckoutCache();
    
    onClose();
  };

  const clearCheckoutCache = () => {
    if (typeof window !== 'undefined') {
      localStorage.removeItem('checkout-step1');
      localStorage.removeItem('checkout-step2');
      localStorage.removeItem('checkout-step3');
    }
  };

  const handleClose = () => {
    // Limpar cache do checkout quando fechar o modal
    clearCheckoutCache();
    
    // Reset apenas se não estiver no meio do pagamento
    if (step < 4) {
      setStep(1);
    }
    onClose();
  };

  const getProgressValue = () => {
    return (step / 4) * 100;
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
          />
        );
      case 4:
        return (
          <CheckoutStep4 
            onFinish={handleFinish} 
            onBack={handlePrevStep}
            personalData={personalData}
            deliveryData={deliveryData}
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
    <Dialog open={isOpen} onOpenChange={handleClose}>
      <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Finalizar Pedido</DialogTitle>
          <div className="space-y-2">
            <Progress value={getProgressValue()} className="w-full" />
          </div>
        </DialogHeader>
        {renderStep()}
      </DialogContent>
    </Dialog>
  );
}