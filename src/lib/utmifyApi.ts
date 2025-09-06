"use server";

const UTMIFY_API_URL = 'https://api.utmify.com.br/api-credentials/orders';
const UTMIFY_API_TOKEN = 'M4qxPRbUoEhE4M97ymcGupDgEKn2c2PFmGcX'; // seu token

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
  currency?: string;
}

interface UtmifyOrderPayload {
  orderId: string;
  platform: string;
  paymentMethod: 'pix';
  status: 'waiting_payment' | 'paid' | 'refused' | 'refunded';
  createdAt: string;
  approvedDate: string | null;
  refundedAt: string | null;
  customer: UtmifyCustomer;
  products: UtmifyProduct[];
  trackingParameters: UtmifyTrackingParameters;
  commission: UtmifyCommission;
  isTest?: boolean;
}

function formatDateToUTC(date: Date): string {
  return date.toISOString().replace('T', ' ').substring(0, 19);
}

export async function sendToUtmify(
  orderId: string,
  status: 'waiting_payment' | 'paid',
  customerData: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  },
  products: Array<{ id: string; name: string; price: number; quantity: number; }>,
  totalAmount: number,
  createdAt: Date,
  trackingParameters: UtmifyTrackingParameters,
  approvedDate?: Date
): Promise<{ success: boolean; error?: string }> {
  try {
    const utmifyProducts: UtmifyProduct[] = products.map(p => ({
      id: p.id,
      name: p.name,
      planId: null,
      planName: null,
      quantity: p.quantity,
      priceInCents: Math.round(p.price * 100),
    }));

    const customer: UtmifyCustomer = {
      name: customerData.name,
      email: customerData.email,
      phone: customerData.phone?.replace(/\D/g, '') || null,
      document: customerData.cpf?.replace(/\D/g, '') || null,
      country: 'BR',
      ip: '127.0.0.1',
    };

    const totalPriceInCents = Math.round(totalAmount * 100);
    const gatewayFeeInCents = 0; // sem taxa, pode ajustar
    const userCommissionInCents = totalPriceInCents - gatewayFeeInCents;

    const commission: UtmifyCommission = {
      totalPriceInCents,
      gatewayFeeInCents,
      userCommissionInCents,
      currency: 'BRL',
    };

    const payload: UtmifyOrderPayload = {
      orderId,
      platform: 'Mangofy',
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
      throw new Error(`UTMify API error: ${response.status} - ${errorText}`);
    }

    console.log(`UTMify OK: ${orderId} - ${status}`);
    return { success: true };
  } catch (error) {
    console.error('Erro ao enviar para UTMify:', error);
    const msg = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: msg };
  }
}
