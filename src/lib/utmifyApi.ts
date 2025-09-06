"use server";

const UTMIFY_API_URL = 'https://api.utmify.com.br/api-credentials/orders';
const UTMIFY_API_TOKEN = process.env.UTMIFY_API_TOKEN || 'kBtIjt8obJBP9KRtrwZUHgrY3eJgAlG9xGaY';

interface UtmifyCustomer {
  name: string;
  email: string;
  phone: string | null;
  document: string | null;
  country?: string;
  ip?: string;
}

interface UtmifyProduct {
  id: string;
  name: string;
  planId: string | null;
  planName: string | null;
  quantity: number;
  priceInCents: number;
}

export interface UtmifyTrackingParameters {
  src: string | null;
  sck: string | null;
  utm_source: string | null;
  utm_campaign: string | null;
  utm_medium: string | null;
  utm_content: string | null;
  utm_term: string | null;
}

interface UtmifyCommission {
  totalPriceInCents: number;
  gatewayFeeInCents: number;
  userCommissionInCents: number;
  currency?: 'BRL' | 'USD' | 'EUR' | 'GBP' | 'ARS' | 'CAD';
}

interface UtmifyOrderPayload {
  orderId: string;
  platform: string;
  paymentMethod: 'pix';
  status: 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback';
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: UtmifyCustomer;
  products: UtmifyProduct[];
  trackingParameters: UtmifyTrackingParameters;
  commission: UtmifyCommission;
  isTest?: boolean;
}

/**
 * Converte data para formato UTC exigido pela UTMify
 */
function formatDateToUTC(date: Date): string {
  return date.toISOString().replace("T", " ").substring(0, 19);
}

/**
 * Envia dados de venda para a UTMify
 */
export async function sendToUtmify(
  orderId: string,
  status: 'waiting_payment' | 'paid',
  customerData: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  },
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>,
  totalAmount: number,
  createdAt: Date,
  trackingParameters: UtmifyTrackingParameters,
  approvedDate?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const utmifyProducts: UtmifyProduct[] = products.map(product => ({
      id: product.id,
      name: product.name,
      planId: null,
      planName: null,
      quantity: product.quantity,
      priceInCents: Math.round(product.price * 100),
    }));

    const customer: UtmifyCustomer = {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone.replace(/\D/g, '') || null,
      document: customerData.cpf.replace(/\D/g, '') || null,
      country: 'BR',
      ip: '127.0.0.1', // TODO: em produção, capturar IP real
    };

    const totalPriceInCents = Math.round(totalAmount * 100);
    const gatewayFeeInCents = Math.round(totalPriceInCents * 0.02); // taxa estimada
    const userCommissionInCents = totalPriceInCents - gatewayFeeInCents;

    const commission: UtmifyCommission = {
      totalPriceInCents,
      gatewayFeeInCents,
      userCommissionInCents,
    };

    const payload: UtmifyOrderPayload = {
      orderId,
      platform: 'Deliverfy', // 🔹 padronizei como Deliverfy
      paymentMethod: 'pix',
      status,
      createdAt: formatDateToUTC(createdAt),
      approvedDate: approvedDate ? formatDateToUTC(approvedDate) : null,
      refundedAt: null,
      customer,
      products: utmifyProducts,
      trackingParameters,
      commission,
      isTest: false,
    };

    console.log("Payload enviado para UTMify:", payload);

    const response = await fetch(UTMIFY_API_URL, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_API_TOKEN,
      },
      body: JSON.stringify(payload),
    });

    if (!response.ok) {
      const errorText = await response.text();
      console.error("Erro no envio para UTMify - Payload:", payload);
      throw new Error(`UTMify API error: ${response.status} - ${errorText}`);
    }

    console.log(`Venda enviada para UTMify: ${orderId} - Status: ${status}`);
    return { success: true };

  } catch (error) {
    console.error('Erro ao enviar para UTMify:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMessage };
  }
}
