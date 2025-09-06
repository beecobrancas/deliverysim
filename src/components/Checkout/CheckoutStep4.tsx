"use client";

import React, { useState, useEffect, useRef } from 'react';
import { Button } from '@/components/ui/button';
import { Copy, Check, AlertTriangle, Loader2, RefreshCw, Smartphone, ScanLine, CheckCircle, Lock } from 'lucide-react';
import { toast } from 'sonner';
import { useCart } from '@/contexts/CartContext';
import { createPayment, checkPaymentStatus } from '@/lib/mangofyApi';
import { Step1Data } from './CheckoutStep1';
import { Step2Data } from './CheckoutStep2';
import * as fpixel from '@/lib/fpixel';
import { useIsMobile } from '@/hooks/use-mobile';
import { PixCountdown } from './PixCountdown';
import { UtmifyTrackingParameters, sendToUtmify } from '@/lib/utmifyApi';

interface CheckoutStep4Props {
  onFinish: () => void;
  onBack: () => void;
  personalData: Step1Data;
  deliveryData: Step2Data;
}

export function CheckoutStep4({ onFinish, onBack, personalData, deliveryData }: CheckoutStep4Props) {
  const { items, getTotalPrice, clearCart } = useCart();
  const [loading, setLoading] = useState(true);
  const [pixData, setPixData] = useState<{
    paymentId: string;
    status: string;
    qrCodeImage: string;
    pixCopyPaste: string;
    expiresAt: string;
  } | null>(null);
  const [paymentStatus, setPaymentStatus] = useState<'pending' | 'checking' | 'paid' | 'expired'>('pending');
  const [error, setError] = useState<string | null>(null);
  const [isCopied, setIsCopied] = useState(false);
  const [pixGenerated, setPixGenerated] = useState(false);
  const [paymentCreatedAt, setPaymentCreatedAt] = useState<Date | null>(null);
  const [autoCheckCount, setAutoCheckCount] = useState(0);
  const [utmifyEventSent, setUtmifyEventSent] = useState(false);
  const textAreaRef = useRef<HTMLTextAreaElement>(null);
  const isMobile = useIsMobile();

  const getTrackingParametersFromURL = (): UtmifyTrackingParameters => {
    if (typeof window === 'undefined') {
      return { src: null, sck: null, utm_source: null, utm_campaign: null, utm_medium: null, utm_content: null, utm_term: null };
    }
    const params = new URLSearchParams(window.location.search);
    return {
      src: params.get('src'),
      sck: params.get('sck'),
      utm_source: params.get('utm_source'),
      utm_campaign: params.get('utm_campaign'),
      utm_medium: params.get('utm_medium'),
      utm_content: params.get('utm_content'),
      utm_term: params.get('utm_term'),
    };
  };

  const formatPrice = (price: number) => {
    return new Intl.NumberFormat('pt-BR', {
      style: 'currency',
      currency: 'BRL',
    }).format(price);
  };

  useEffect(() => {
    const generatePayment = async () => {
      setLoading(true);
      setError(null);
      
      try {
        const totalAmount = getTotalPrice();
        const simplifiedItems = items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity }));
        
        const customerPayload = {
          name: personalData.name,
          email: personalData.email,
          cpf: personalData.cpf,
          phone: personalData.whatsapp,
        };

        const trackingParams = getTrackingParametersFromURL();
        const result = await createPayment(totalAmount, customerPayload, simplifiedItems, deliveryData, trackingParams);

        if (result.success && result.pixCopyPaste && result.paymentId && result.expiresAt) {
          setPixData({
            paymentId: result.paymentId,
            status: result.status || 'pending',
            qrCodeImage: result.qrCodeImage || '',
            pixCopyPaste: result.pixCopyPaste,
            expiresAt: result.expiresAt,
          });
          setPixGenerated(true);
          setPaymentCreatedAt(new Date());
          setLoading(false);
          
          toast.success("PIX gerado com sucesso! Efetue o pagamento para finalizar seu pedido.");
        } else {
          setError(result.error || "Não foi possível obter os dados do PIX.");
          setLoading(false);
        }
      } catch (err) {
        setError("Erro ao processar pagamento.");
        setLoading(false);
      }
    };

    if (items.length > 0) {
      generatePayment();
    } else {
      setError("Seu carrinho está vazio. Não é possível gerar um pagamento.");
      setLoading(false);
    }
  }, [personalData, deliveryData, items, getTotalPrice]);

  const handleCheckStatus = async (isAutoCheck = false) => {
    if (!pixData?.paymentId || !paymentCreatedAt) return;
    
    if (!isAutoCheck) {
      setPaymentStatus('checking');
    }
    
    try {
      const trackingParams = getTrackingParametersFromURL();
      const result = await checkPaymentStatus(
        pixData.paymentId,
        {
          name: personalData.name,
          email: personalData.email,
          cpf: personalData.cpf,
          phone: personalData.whatsapp,
        },
        items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
        getTotalPrice(),
        paymentCreatedAt,
        trackingParams
      );
      
      if (result.success) {
        if (result.paid) {
          setPaymentStatus('paid');
          
          if (!isAutoCheck) {
            toast.success("🎉 Pagamento confirmado! Seu pedido está sendo preparado.");
          } else {
            toast.success("🎉 Pagamento detectado automaticamente! Seu pedido está sendo preparado.");
          }
          
          fpixel.event('Purchase', { 
            value: getTotalPrice(), 
            currency: 'BRL', 
            content_ids: items.map(item => item.id), 
            content_type: 'product', 
            num_items: items.reduce((sum, item) => sum + item.quantity, 0) 
          });
          
          clearCart();

          // Armazenar dados do pagamento para enviar para UTMify na página de obrigado
          if (typeof window !== 'undefined') {
            const paymentData = {
              paymentId: pixData.paymentId,
              customerData: {
                name: personalData.name,
                email: personalData.email,
                cpf: personalData.cpf,
                phone: personalData.whatsapp,
              },
              products: items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
              totalAmount: getTotalPrice(),
              createdAt: paymentCreatedAt?.toISOString(),
              trackingParameters: getTrackingParametersFromURL()
            };
            localStorage.setItem('last_payment_data', JSON.stringify(paymentData));
          }

          // Redirecionar para página de obrigado após confirmação do pagamento
          setTimeout(() => {
            if (typeof window !== 'undefined') {
              window.location.href = '/obrigado';
            }
          }, 2000);
        } else {
          setPaymentStatus('pending');
          if (!isAutoCheck) {
            toast.info(`Status: ${result.status}`);
          }
        }
      } else {
        setPaymentStatus('pending');
        if (!isAutoCheck) {
          toast.error("Erro ao verificar status.");
        }
      }
    } catch (err) {
      setPaymentStatus('pending');
      if (!isAutoCheck) {
        toast.error("Erro ao verificar status do pagamento.");
      }
    }
  };

  useEffect(() => {
    if (!pixData?.paymentId || paymentStatus !== 'pending' || !paymentCreatedAt) return;

    const interval = setInterval(async () => {
      setAutoCheckCount(prev => prev + 1);
      await handleCheckStatus(true);
    }, 10000);

    return () => clearInterval(interval);
  }, [pixData?.paymentId, paymentStatus, paymentCreatedAt, autoCheckCount]);

  // New effect to send UTMify event immediately when paymentStatus changes to 'paid'
  useEffect(() => {
    if (paymentStatus !== 'paid' || !pixData || !paymentCreatedAt || utmifyEventSent) return;

    const sendUtmifyEvent = async () => {
      try {
        await sendToUtmify(
          pixData.paymentId,
          'paid',
          {
            name: personalData.name,
            email: personalData.email,
            cpf: personalData.cpf,
            phone: personalData.whatsapp,
          },
          items.map(item => ({ id: item.id, name: item.name, price: item.price, quantity: item.quantity })),
          getTotalPrice(),
          paymentCreatedAt,
          getTrackingParametersFromURL(),
          new Date() // approvedDate
        );
        console.log('UTMify venda aprovada enviada imediatamente após detecção de pagamento.');
        setUtmifyEventSent(true);
      } catch (error) {
        console.error('Erro ao enviar evento UTMify na detecção de pagamento:', error);
      }
    };

    sendUtmifyEvent();
  }, [paymentStatus, pixData, paymentCreatedAt, personalData, items, utmifyEventSent]);

  const handleCopy = () => {
    if (!pixData?.pixCopyPaste || !textAreaRef.current) return;
    textAreaRef.current.select();
    document.execCommand('copy');
    setIsCopied(true);
    toast.success("Código PIX copiado!");
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleExpire = () => {
    setPaymentStatus('expired');
    toast.error("O código PIX expirou. Por favor, reinicie o processo de compra.");
  };

  const renderLoading = () => (
    <div className="text-center py-10">
      <Loader2 className="w-12 h-12 mx-auto text-orange-500 animate-spin" />
      <p className="mt-4 text-gray-600">Gerando seu PIX, aguarde...</p>
    </div>
  );

  const renderError = () => (
    <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">
      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
      <p className="font-medium mb-2">{error}</p>
      <Button onClick={onBack} className="mt-2">Voltar e tentar novamente</Button>
    </div>
  );

  const renderPaid = () => (
    <div className="flex flex-col items-center justify-center bg-green-50 p-6 rounded-lg text-center">
      <div className="w-16 h-16 bg-green-100 rounded-full flex items-center justify-center mb-4">
        <Check className="w-8 h-8 text-green-600" />
      </div>
      <h4 className="text-lg font-medium text-green-700">Pagamento Confirmado!</h4>
      <p className="text-green-600 mt-2">Seu pedido está sendo preparado e logo estará a caminho.</p>
    </div>
  );

  const renderExpired = () => (
    <div className="bg-red-50 text-red-700 p-4 rounded-lg text-center">
      <AlertTriangle className="w-8 h-8 mx-auto mb-2" />
      <p className="font-medium mb-2">PIX Expirado</p>
      <p className="text-sm mb-4">O tempo para pagamento acabou. Por favor, reinicie o processo de compra.</p>
      <Button onClick={() => window.location.reload()} className="mt-2">Fazer Nova Compra</Button>
    </div>
  );

  const PaymentInstructions = () => (
    <div className="space-y-4">
      <h3 className="font-semibold text-gray-800">Instruções para pagamento</h3>
      <div className="flex items-start gap-4">
        <div className="bg-green-100 text-green-700 rounded-full p-2"><Smartphone className="w-5 h-5" /></div>
        <p className="text-sm text-gray-600">Abra o app do seu banco e entre no ambiente Pix.</p>
      </div>
      <div className="flex items-start gap-4">
        <div className="bg-green-100 text-green-700 rounded-full p-2"><ScanLine className="w-5 h-5" /></div>
        <p className="text-sm text-gray-600">{isMobile ? 'Escolha a opção PIX Copia e Cola e insira o código copiado.' : 'Escolha Pagar com QR Code e aponte a câmera para o código ao lado.'}</p>
      </div>
      <div className="flex items-start gap-4">
        <div className="bg-green-100 text-green-700 rounded-full p-2"><CheckCircle className="w-5 h-5" /></div>
        <p className="text-sm text-gray-600">Confirme as informações e finalize sua compra.</p>
      </div>
      <div className="bg-blue-50 border border-blue-200 rounded-lg p-3 mt-4">
        <p className="text-sm text-blue-800">
          <strong>💡 Dica:</strong> Após efetuar o pagamento, volte para esta tela. O sistema detectará automaticamente quando seu PIX for aprovado!
        </p>
      </div>
    </div>
  );

  const PurchaseDetails = () => (
    <div className="space-y-2">
      <h3 className="font-semibold text-gray-800">Detalhes da compra</h3>
      <div className="flex justify-between text-sm">
        <span className="text-gray-600">Valor total:</span>
        <span className="font-bold text-gray-800">{formatPrice(getTotalPrice())}</span>
      </div>
      {items.map((item, index) => (
        <div key={index} className="flex items-center gap-2 text-sm text-gray-500">
          <img src={item.image} alt={item.name} className="w-8 h-8 rounded-md object-cover" />
          <span>{item.quantity}x {item.name}</span>
        </div>
      ))}
    </div>
  );

  const renderPaymentArea = () => (
    <div className="space-y-6">
      <h2 className="text-xl font-bold text-center text-gray-800">
        {isMobile ? 'Falta pouco! Para finalizar a compra, efetue o pagamento com PIX!' : 'Falta pouco! Para finalizar a compra, escaneie o QR Code abaixo.'}
      </h2>
      
      <div className="bg-white border rounded-lg p-6 shadow-sm">
        <div className="grid md:grid-cols-2 md:gap-8">
          <div className="flex flex-col items-center space-y-4">
            {pixData && <PixCountdown expiresAt={pixData.expiresAt} onExpire={handleExpire} />}
            {!isMobile && pixData?.qrCodeImage && (
              <img src={pixData.qrCodeImage} alt="QR Code PIX" className="w-48 h-48 mx-auto" />
            )}
            <p className="text-sm text-gray-600 text-center">{isMobile ? 'Copie a chave abaixo e utilize a opção PIX Copia e Cola:' : 'Se preferir, pague com a opção PIX Copia e Cola:'}</p>
            <div className="w-full bg-gray-100 border rounded-md p-3 text-center">
              <p className="text-xs break-all text-gray-700 font-mono">{pixData?.pixCopyPaste}</p>
            </div>
            <textarea ref={textAreaRef} value={pixData?.pixCopyPaste || ''} readOnly className="sr-only" />
            <Button onClick={handleCopy} className="w-full bg-green-600 hover:bg-green-700 text-white">
              {isCopied ? <Check className="w-4 h-4 mr-2" /> : <Copy className="w-4 h-4 mr-2" />}
              {isCopied ? 'Copiado!' : 'Copiar Código'}
            </Button>
          </div>
          <div className="hidden md:block space-y-6">
            <PurchaseDetails />
            <div className="border-t pt-6">
              <PaymentInstructions />
            </div>
          </div>
        </div>
      </div>

      {isMobile && (
        <div className="w-full space-y-4">
          <div className="border rounded-lg bg-white p-4">
            <PurchaseDetails />
          </div>
          <div className="border rounded-lg bg-white p-4">
            <PaymentInstructions />
          </div>
        </div>
      )}

      <div className="flex items-center justify-center gap-4 text-gray-500 text-sm">
        <img src="https://upload.wikimedia.org/wikipedia/commons/thumb/a/a2/Logo_do_PIX.svg/1200px-Logo_do_PIX.svg.png" alt="PIX" className="h-5" />
        <div className="flex items-center gap-1"><Lock className="w-3 h-3" /> Ambiente seguro</div>
      </div>

      {autoCheckCount > 0 && paymentStatus === 'pending' && (
        <div className="text-center text-sm text-gray-500">
          <p>🔄 Verificando automaticamente... ({autoCheckCount} verificações)</p>
        </div>
      )}

      <div className="flex justify-center pt-4">
        <Button 
          onClick={() => handleCheckStatus(false)} 
          disabled={paymentStatus !== 'pending'} 
          className="bg-orange-500 hover:bg-orange-600"
        >
          {paymentStatus === 'checking' ? <Loader2 className="w-4 h-4 mr-2 animate-spin" /> : <RefreshCw className="w-4 h-4 mr-2" />}
          {paymentStatus === 'checking' ? 'Verificando...' : 'Já paguei, verificar agora'}
        </Button>
      </div>
    </div>
  );

  return (
    <div className="space-y-6">
      {loading && renderLoading()}
      {!loading && error && renderError()}
      {!loading && !error && pixData && (
        <>
          {paymentStatus === 'paid' && renderPaid()}
          {paymentStatus === 'expired' && renderExpired()}
          {(paymentStatus === 'pending' || paymentStatus === 'checking') && renderPaymentArea()}
        </>
      )}
    </div>
  );
}