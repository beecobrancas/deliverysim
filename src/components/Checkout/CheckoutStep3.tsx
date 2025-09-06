"use client";

import React, { useState } from 'react';
import { Button } from '@/components/ui/button';
import { Bike, Clock, AlertTriangle } from 'lucide-react';
import { Card, CardContent } from '@/components/ui/card';
import * as fpixel from '@/lib/fpixel';

interface CheckoutStep3Props {
  onNext: () => void;
  onBack: () => void;
}

export function CheckoutStep3({ onNext, onBack }: CheckoutStep3Props) {
  const [selectedDelivery, setSelectedDelivery] = useState('standard');

  const handleNext = () => {
    // Disparar evento do Pixel
    fpixel.event('AddPaymentInfo');
    onNext();
  };

  return (
    <div className="space-y-6">
      <div className="text-center">
        <h3 className="text-lg font-semibold">Opções de Entrega</h3>
        <p className="text-sm text-gray-600">Etapa 3 de 4</p>
      </div>

      <div className="space-y-4">
        <Card 
          className={`cursor-pointer transition-all ${
            selectedDelivery === 'standard' 
              ? 'ring-2 ring-orange-500 bg-orange-50' 
              : 'hover:bg-gray-50'
          }`}
          onClick={() => setSelectedDelivery('standard')}
        >
          <CardContent className="p-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <div className={`w-4 h-4 rounded-full border-2 ${
                  selectedDelivery === 'standard' 
                    ? 'bg-orange-500 border-orange-500' 
                    : 'border-gray-300'
                }`} />
                <Bike className="w-6 h-6 text-orange-600" />
                <div>
                  <p className="font-medium">Entrega Padrão</p>
                  <div className="flex items-center gap-2 text-sm text-gray-600">
                    <Clock className="w-4 h-4" />
                    <span>30 a 50 minutos</span>
                  </div>
                </div>
              </div>
              <div className="text-right">
                <p className="font-semibold text-green-600 text-lg">Grátis</p>
                <p className="text-xs text-gray-500">Entrega gratuita</p>
              </div>
            </div>
          </CardContent>
        </Card>

        <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <div className="w-2 h-2 bg-blue-500 rounded-full mt-2 flex-shrink-0" />
            <div className="text-sm text-blue-800">
              <p className="font-medium mb-1">Informações importantes:</p>
              <ul className="space-y-1 text-blue-700">
                <li>• Entrega realizada de segunda a domingo.</li>
                <li>• Assim que a compra for finalizada, enviaremos o status do seu pedido por WhatsApp.</li>
              </ul>
            </div>
          </div>
        </div>

        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex items-start gap-3">
            <AlertTriangle className="w-5 h-5 text-red-600 flex-shrink-0" />
            <div className="text-sm text-red-800">
              <p className="font-medium">Devido à alta demanda, só estamos trabalhando com pagamento antecipado.</p>
            </div>
          </div>
        </div>
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
          onClick={handleNext}
          className="bg-orange-500 hover:bg-orange-600"
          size="lg"
        >
          Continuar para Pagamento
        </Button>
      </div>
    </div>
  );
}