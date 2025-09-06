"use client";

import React, { useEffect } from 'react';
import { CheckCircle, Truck, Clock } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import Link from 'next/link';
import { sendToUtmify, UtmifyTrackingParameters } from '@/lib/utmifyApi';

export default function ObrigadoPage() {
  useEffect(() => {
    // Verificar se há dados de pagamento armazenados para enviar para UTMify
    // O script UTMify já está carregado globalmente no layout.tsx
    if (typeof window !== 'undefined') {
      const paymentData = localStorage.getItem('last_payment_data');
      if (paymentData) {
        try {
          const data = JSON.parse(paymentData);
          // Enviar confirmação para UTMify na página de obrigado
          sendToUtmify(
            data.paymentId,
            'paid',
            data.customerData,
            data.products,
            data.totalAmount,
            new Date(data.createdAt),
            data.trackingParameters,
            new Date()
          ).then(result => {
            if (result.success) {
              console.log('Confirmação de venda enviada para UTMify da página de obrigado');
            } else {
              console.error('Erro ao enviar para UTMify:', result.error);
            }
          });

          // Limpar dados após envio
          localStorage.removeItem('last_payment_data');
        } catch (error) {
          console.error('Erro ao processar dados de pagamento:', error);
        }
      }
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50 flex items-center justify-center p-4">
      <Card className="max-w-2xl w-full">
        <CardHeader className="text-center">
          <div className="w-20 h-20 bg-orange-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <CheckCircle className="w-12 h-12 text-orange-600" />
          </div>
          <CardTitle className="text-3xl font-bold text-gray-800 mb-2">
            Pedido Confirmado!
          </CardTitle>
          <p className="text-gray-600">
            Obrigado por sua compra. Seu pedido foi confirmado e está sendo preparado.
          </p>
        </CardHeader>

        <CardContent className="space-y-6">
          <div className="grid md:grid-cols-3 gap-4">
            <div className="text-center p-4 bg-green-50 rounded-lg">
              <CheckCircle className="w-8 h-8 text-green-600 mx-auto mb-2" />
              <h3 className="font-semibold text-green-700">Pagamento Aprovado</h3>
              <p className="text-sm text-green-600">Seu PIX foi processado com sucesso</p>
            </div>

            <div className="text-center p-4 bg-orange-50 rounded-lg">
              <Clock className="w-8 h-8 text-orange-600 mx-auto mb-2" />
              <h3 className="font-semibold text-orange-700">Preparando Pedido</h3>
              <p className="text-sm text-orange-600">Em até 30 minutos</p>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg">
              <Truck className="w-8 h-8 text-gray-600 mx-auto mb-2" />
              <h3 className="font-semibold text-gray-700">Entrega</h3>
              <p className="text-sm text-gray-600">Em até 45 minutos</p>
            </div>
          </div>

          <div className="bg-gray-50 p-4 rounded-lg">
            <h4 className="font-semibold mb-2">O que acontece agora?</h4>
            <ul className="text-sm text-gray-600 space-y-1">
              <li>• Nossa equipe está preparando seu pedido com todo cuidado</li>
              <li>• O entregador sairá em breve com seus salgados quentinhos</li>
            </ul>
          </div>

          <div className="text-center space-y-4">
            <div className="flex gap-4 justify-center">
              <Button asChild>
                <Link href="/">Fazer Novo Pedido</Link>
              </Button>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
