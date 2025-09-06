"use client";

import React, { useState, useEffect } from 'react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { User, Mail, Phone } from 'lucide-react';

export interface Step1Data {
  name: string;
  email: string;
  whatsapp: string;
}

interface CheckoutStep1Props {
  onNext: (data: Step1Data) => void;
  initialData?: Step1Data;
}

export function CheckoutStep1({ onNext, initialData }: CheckoutStep1Props) {
  const [formData, setFormData] = useState<Step1Data>({
    name: '',
    email: '',
    whatsapp: '',
    ...initialData
  });

  const handleInputChange = (field: keyof Step1Data, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.name || !formData.email || !formData.whatsapp) {
      return;
    }

    // Salvar no localStorage
    if (typeof window !== 'undefined') {
      localStorage.setItem('checkout-step1', JSON.stringify(formData));
    }

    onNext(formData);
  };

  // Carregar dados do localStorage
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const saved = localStorage.getItem('checkout-step1');
      if (saved && !initialData) {
        setFormData(JSON.parse(saved));
      }
    }
  }, [initialData]);

  const formatWhatsApp = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    if (cleanValue.length <= 11) {
      return cleanValue.replace(/(\d{2})(\d{5})(\d{4})/, '($1) $2-$3');
    }
    return cleanValue.replace(/(\d{2})(\d{4})(\d{4})/, '($1) $2-$3');
  };

  const handleWhatsAppChange = (value: string) => {
    const cleanValue = value.replace(/\D/g, '');
    handleInputChange('whatsapp', cleanValue);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold text-gray-800">Dados Pessoais</h3>
        <p className="text-sm text-gray-500">Etapa 1 de 3</p>
      </div>

      <div className="space-y-4">
        <div>
          <Label htmlFor="name" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <User className="w-4 h-4" />
            Nome Completo *
          </Label>
          <Input
            id="name"
            type="text"
            placeholder="Seu nome completo"
            value={formData.name}
            onChange={(e) => handleInputChange('name', e.target.value)}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="email" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Mail className="w-4 h-4" />
            E-mail *
          </Label>
          <Input
            id="email"
            type="email"
            placeholder="seu@email.com"
            value={formData.email}
            onChange={(e) => handleInputChange('email', e.target.value)}
            className="mt-1"
            required
          />
        </div>

        <div>
          <Label htmlFor="whatsapp" className="text-sm font-medium text-gray-700 flex items-center gap-2">
            <Phone className="w-4 h-4" />
            WhatsApp *
          </Label>
          <Input
            id="whatsapp"
            type="tel"
            placeholder="(11) 99999-9999"
            value={formatWhatsApp(formData.whatsapp)}
            onChange={(e) => handleWhatsAppChange(e.target.value)}
            maxLength={15}
            className="mt-1"
            required
          />
        </div>
      </div>

      <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
        <div className="text-sm text-blue-800">
          <p className="font-medium mb-1">Seus dados estão seguros conosco!</p>
          <ul className="space-y-1 text-blue-700">
            <li>• Utilizamos seus dados apenas para processar seu pedido</li>
            <li>• Você receberá atualizações do pedido via WhatsApp</li>
          </ul>
        </div>
      </div>

      <div className="flex justify-end pt-4">
        <Button 
          type="submit"
          className="bg-orange-500 hover:bg-orange-600 h-12 px-8"
          size="lg"
          disabled={!formData.name || !formData.email || !formData.whatsapp}
        >
          Continuar
        </Button>
      </div>
    </form>
  );
}