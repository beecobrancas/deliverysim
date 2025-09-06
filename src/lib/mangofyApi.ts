"use server";

import { cookies } from 'next/headers';
import { sendToUtmify, UtmifyTrackingParameters } from './utmifyApi';
import { supabase } from './supabase';
import { PendingPaymentEvent, PENDING_PAYMENT_EVENTS_TABLE } from './supabaseTables';

// Tipos
interface SimplifiedCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

// Configuração da API Mangofy
const MANGOFY_API_URL = 'https://checkout.mangofy.com.br/api/v1';
const MANGOFY_STORE_CODE = '0c6100515856c26a627d94893fd70c06';
const MANGOFY_API_KEY = '2c70f78c3739d896b840990fa68804759umetqhztqk73uozgfelk91yzlefysb';

// Tipos conforme documentação oficial da Mangofy
interface MangofyPaymentRequest {
  store_code: string;
  external_code: string | null;
  payment_method: string;
  payment_format: string;
  installments: number;
  payment_amount: number;
  shipping_amount: number | null;
  postback_url: string;
  items: Array<{
    code: string;
    name: string;
    amount: number;
    total: number;
  }> | null;
  customer: {
    email: string;
    name: string;
    document: string;
    phone: string;
    ip: string;
  };
  pix: {
    expires_in_days: number;
  };
  shipping?: {
    street: string;
    street_number: string;
    complement: string;
    neighborhood: string;
    city: string;
    state: string;
    zip_code: string;
    country: string;
  };
}

interface MangofyPaymentResponse {
  payment_code: string;
  payment_method: string;
  payment_status: string;
  payment_amount: number;
  sale_amount: number;
  shipping_amount: number;
  installments: number;
  installment_amount: number;
}

/**
 * Cria um pagamento PIX via Mangofy e busca os detalhes - SERVER ACTION
 */
export async function createPayment(
  amount: number,
  customerData: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  },
  cartItems: SimplifiedCartItem[],
  deliveryAddress: {
    cep: string;
    endereco: string;
    numero: string;
    complemento?: string;
    bairro: string;
    cidade: string;
    estado: string;
  },
  trackingParameters: UtmifyTrackingParameters
): Promise<{
  success: boolean;
  paymentId?: string;
  status?: string;
  qrCodeImage?: string;
  pixCopyPaste?: string;
  expiresAt?: string;
  error?: string;
}> {
  try {
    const externalId = `rei-coxinhas-${Date.now()}-${Math.random().toString(36).substring(2, 15)}`;

    const items = cartItems.map((item, index) => ({
      code: `item-${index + 1}`,
      name: item.name.substring(0, 100),
      amount: Math.round(item.price * 100),
      total: Math.round(item.price * item.quantity * 100)
    }));

    const payload: MangofyPaymentRequest = {
      store_code: MANGOFY_STORE_CODE,
      external_code: externalId,
      payment_method: "pix",
      payment_format: "regular",
      installments: 1,
      payment_amount: Math.round(amount * 100),
      shipping_amount: 0,
      postback_url: 'https://www.lasy.ai/postback',
      items: items.length > 0 ? items : null,
      customer: {
        email: customerData.email,
        name: customerData.name,
        document: customerData.cpf.replace(/\D/g, ''),
        phone: customerData.phone.replace(/\D/g, ''),
        ip: "127.0.0.1"
      },
      pix: {
        expires_in_days: 1
      },
      shipping: {
        street: deliveryAddress.endereco,
        street_number: deliveryAddress.numero,
        complement: deliveryAddress.complemento || 'Não informado',
        neighborhood: deliveryAddress.bairro,
        city: deliveryAddress.cidade,
        state: deliveryAddress.estado,
        zip_code: deliveryAddress.cep.replace(/\D/g, ''),
        country: "BR"
      }
    };

    const createResponse = await fetch(`${MANGOFY_API_URL}/payment`, {
      method: 'POST',
      headers: {
        'Authorization': MANGOFY_API_KEY,
        'Store-Code': MANGOFY_STORE_CODE,
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload)
    });

    if (!createResponse.ok) {
      const errorText = await createResponse.text();
      throw new Error(`POST falhou: ${createResponse.status} - ${errorText}`);
    }

    const paymentData: MangofyPaymentResponse = await createResponse.json();
    const detailsResponse = await fetch(`${MANGOFY_API_URL}/payment/${paymentData.payment_code}`, {
      method: 'GET',
      headers: {
        'Authorization': MANGOFY_API_KEY,
        'Store-Code': MANGOFY_STORE_CODE,
        'Accept': 'application/json',
      }
    });

    if (!detailsResponse.ok) {
      const errorText = await detailsResponse.text();
      throw new Error(`GET falhou: ${detailsResponse.status} - ${errorText}`);
    }

    const detailsData = await detailsResponse.json();
    const pixCopyPaste = detailsData.data?.pix?.pix_qrcode_text || '';
    const base64Image = detailsData.data?.pix?.pix_link || '';
    const qrCodeImage = base64Image ? `data:image/png;base64,${base64Image}` : '';
    const paymentStatus = detailsData.data?.payment_status || 'pending';
    const paymentId = detailsData.data?.payment_code || paymentData.payment_code;
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000).toISOString();

    // Ler UTM parameters dos cookies
    const cookieStore = await cookies();
    console.log("All cookies:", cookieStore.getAll());
    const utmTrackingParameters: UtmifyTrackingParameters = {
      src: cookieStore.get('src')?.value || trackingParameters.src,
      sck: cookieStore.get('sck')?.value || trackingParameters.sck,
      utm_source: cookieStore.get('utm_source')?.value || trackingParameters.utm_source,
      utm_campaign: cookieStore.get('utm_campaign')?.value || trackingParameters.utm_campaign,
      utm_medium: cookieStore.get('utm_medium')?.value || trackingParameters.utm_medium,
      utm_content: cookieStore.get('utm_content')?.value || trackingParameters.utm_content,
      utm_term: cookieStore.get('utm_term')?.value || trackingParameters.utm_term,
    };
    console.log("UTM Tracking Parameters lidos dos cookies (createPayment):", utmTrackingParameters);

    // Salvar dados do pagamento no banco de dados para processamento assíncrono
    try {
      const paymentEvent: PendingPaymentEvent = {
        paymentId: paymentId,
        status: 'waiting_payment',
        customerData: customerData,
        products: cartItems,
        totalAmount: amount,
        createdAt: new Date().toISOString(),
        approvedAt: null,
        trackingParameters: utmTrackingParameters
      };

      const { error: dbError } = await supabase
        .from(PENDING_PAYMENT_EVENTS_TABLE)
        .insert([paymentEvent]);

      if (dbError) {
        console.error('Erro ao salvar pagamento no banco:', dbError);
        // Não falha o pagamento se salvar no banco der erro
      } else {
        console.log('Pagamento salvo no banco para processamento assíncrono:', paymentId);
      }
    } catch (dbSaveError) {
      console.error('Erro ao salvar dados do pagamento:', dbSaveError);
      // Não falha o pagamento se salvar no banco der erro
    }

    // Enviar para UTMify quando PIX for gerado (status: waiting_payment)
    try {
      await sendToUtmify(
        paymentId,
        'waiting_payment',
        customerData,
        cartItems,
        amount,
        new Date(),
        utmTrackingParameters
      );
    } catch (utmifyError) {
      console.error('Erro ao enviar para UTMify (PIX gerado):', utmifyError);
      // Não falha o pagamento se UTMify der erro
    }

    return {
      success: true,
      paymentId: paymentId,
      status: paymentStatus,
      qrCodeImage: qrCodeImage,
      pixCopyPaste: pixCopyPaste,
      expiresAt: expiresAt
    };

  } catch (error) {
    console.error('Erro no createPayment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      error: `Falha na comunicação com Mangofy: ${errorMessage}`
    };
  }
}

export async function checkPaymentStatus(
  paymentCode: string,
  customerData: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  },
  cartItems: SimplifiedCartItem[],
  totalAmount: number,
  createdAt: Date,
  trackingParameters: UtmifyTrackingParameters
): Promise<{
  success: boolean;
  paid?: boolean;
  status?: string;
  error?: string;
}> {
  try {
    const response = await fetch(`${MANGOFY_API_URL}/payment/${paymentCode}`, {
      method: 'GET',
      headers: {
        'Authorization': MANGOFY_API_KEY,
        'Store-Code': MANGOFY_STORE_CODE,
        'Accept': 'application/json',
      }
    });

    if (!response.ok) {
      const errorText = await response.text();
      throw new Error(`Erro ${response.status}: ${errorText}`);
    }

    const data = await response.json();
    const paymentStatus = data.data?.payment_status || 'pending';
    const isPaid = paymentStatus === 'approved';

    // Ler UTM parameters dos cookies
    const cookieStore = await cookies();
    console.log("All cookies:", cookieStore.getAll());
    const utmTrackingParameters: UtmifyTrackingParameters = {
      src: cookieStore.get('src')?.value || trackingParameters.src,
      sck: cookieStore.get('sck')?.value || trackingParameters.sck,
      utm_source: cookieStore.get('utm_source')?.value || trackingParameters.utm_source,
      utm_campaign: cookieStore.get('utm_campaign')?.value || trackingParameters.utm_campaign,
      utm_medium: cookieStore.get('utm_medium')?.value || trackingParameters.utm_medium,
      utm_content: cookieStore.get('utm_content')?.value || trackingParameters.utm_content,
      utm_term: cookieStore.get('utm_term')?.value || trackingParameters.utm_term,
    };
    console.log("UTM Tracking Parameters lidos dos cookies (checkPaymentStatus):", utmTrackingParameters);

    // Se o pagamento foi aprovado e temos os dados necessários, enviar para UTMify
    if (isPaid) {
      try {
        await sendToUtmify(
          paymentCode,
          'paid',
          customerData,
          cartItems,
          totalAmount,
          createdAt,
          utmTrackingParameters,
          new Date() // Data de aprovação
        );
      } catch (utmifyError) {
        console.error('Erro ao enviar para UTMify (PIX pago):', utmifyError);
        // Não falha a verificação se UTMify der erro
      }
    }

    return {
      success: true,
      paid: isPaid,
      status: paymentStatus
    };
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return {
      success: false,
      error: errorMessage
    };
  }
}