"use server";

import { cookies } from 'next/headers';
import { sendToUtmify, UtmifyTrackingParameters } from './utmifyApi';

interface SimplifiedCartItem {
  id: string;
  name: string;
  price: number;
  quantity: number;
}

const MANGOFY_API_URL = 'https://checkout.mangofy.com.br/api/v1';
const MANGOFY_STORE_CODE = '0c6100515856c26a627d94893fd70c06';
const MANGOFY_API_KEY = '2c70f78c3739d896b840990fa68804759umetqhztqk73uozgfelk91yzlefysb';

interface MangofyPaymentRequest {
  store_code: string;
  external_code: string | null;
  payment_method: string;
  payment_format: string;
  installments: number;
  payment_amount: number;
  shipping_amount: number | null;
  postback_url: string;
  items: Array<{ code: string; name: string; amount: number; total: number; }> | null;
  customer: { email: string; name: string; document: string; phone: string; ip: string; };
  pix: { expires_in_days: number; };
  shipping?: {
    street: string; street_number: string; complement: string; neighborhood: string;
    city: string; state: string; zip_code: string; country: string;
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

export async function createPayment(
  amount: number,
  customerData: { name: string; email: string; cpf: string; phone: string; },
  cartItems: SimplifiedCartItem[],
  deliveryAddress: {
    cep: string; endereco: string; numero: string; complemento?: string; bairro: string; cidade: string; estado: string;
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

    // Lê UTMs de cookies + fallback nos parâmetros recebidos
    const cookieStore = await cookies();
    const utmTrackingParameters: UtmifyTrackingParameters = {
      src: cookieStore.get('src')?.value || trackingParameters.src,
      sck: cookieStore.get('sck')?.value || trackingParameters.sck,
      utm_source: cookieStore.get('utm_source')?.value || trackingParameters.utm_source,
      utm_campaign: cookieStore.get('utm_campaign')?.value || trackingParameters.utm_campaign,
      utm_medium: cookieStore.get('utm_medium')?.value || trackingParameters.utm_medium,
      utm_content: cookieStore.get('utm_content')?.value || trackingParameters.utm_content,
      utm_term: cookieStore.get('utm_term')?.value || trackingParameters.utm_term,
    };

    // MONTA A postback_url COM UTMs NA QUERYSTRING
    const basePostbackUrl = 'https://reidascoxinhas.com/api/mangofy/postback';
    const qs = new URLSearchParams({
      src: utmTrackingParameters.src || '',
      sck: utmTrackingParameters.sck || '',
      utm_source: utmTrackingParameters.utm_source || '',
      utm_campaign: utmTrackingParameters.utm_campaign || '',
      utm_medium: utmTrackingParameters.utm_medium || '',
      utm_content: utmTrackingParameters.utm_content || '',
      utm_term: utmTrackingParameters.utm_term || '',
    }).toString();
    const postbackUrlWithUtm = `${basePostbackUrl}?${qs}`;

    const payload: MangofyPaymentRequest = {
      store_code: MANGOFY_STORE_CODE,
      external_code: externalId,
      payment_method: "pix",
      payment_format: "regular",
      installments: 1,
      payment_amount: Math.round(amount * 100),
      shipping_amount: 0,
      postback_url: postbackUrlWithUtm,
      items: items.length > 0 ? items : null,
      customer: {
        email: customerData.email,
        name: customerData.name,
        document: customerData.cpf.replace(/\D/g, ''),
        phone: customerData.phone.replace(/\D/g, ''),
        ip: "127.0.0.1"
      },
      pix: { expires_in_days: 1 },
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

    // Cria pagamento
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

    // Busca detalhes (QR code, etc)
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

    // (Opcional) mandar "waiting_payment" para a UTMify na hora que gerar PIX
    try {
      await sendToUtmify(
        paymentId,
        'waiting_payment',
        customerData,
        cartItems.map(ci => ({ id: ci.id, name: ci.name, price: ci.price, quantity: ci.quantity })),
        amount,
        new Date(),
        utmTrackingParameters
      );
    } catch (utmifyError) {
      console.error('Erro ao enviar para UTMify (PIX gerado):', utmifyError);
    }

    return {
      success: true,
      paymentId,
      status: paymentStatus,
      qrCodeImage,
      pixCopyPaste,
      expiresAt
    };

  } catch (error) {
    console.error('Erro no createPayment:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: `Falha na comunicação com Mangofy: ${errorMessage}` };
  }
}

export async function checkPaymentStatus(
  paymentCode: string,
  customerData: { name: string; email: string; cpf: string; phone: string; },
  cartItems: SimplifiedCartItem[],
  totalAmount: number,
  createdAt: Date,
  trackingParameters: UtmifyTrackingParameters
): Promise<{ success: boolean; paid?: boolean; status?: string; error?: string; }> {
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

    // Lê UTMs (cookies + fallback)
    const cookieStore = await cookies();
    const utmTrackingParameters: UtmifyTrackingParameters = {
      src: cookieStore.get('src')?.value || trackingParameters.src,
      sck: cookieStore.get('sck')?.value || trackingParameters.sck,
      utm_source: cookieStore.get('utm_source')?.value || trackingParameters.utm_source,
      utm_campaign: cookieStore.get('utm_campaign')?.value || trackingParameters.utm_campaign,
      utm_medium: cookieStore.get('utm_medium')?.value || trackingParameters.utm_medium,
      utm_content: cookieStore.get('utm_content')?.value || trackingParameters.utm_content,
      utm_term: cookieStore.get('utm_term')?.value || trackingParameters.utm_term,
    };

    if (isPaid) {
      try {
        await sendToUtmify(
          paymentCode,
          'paid',
          customerData,
          cartItems.map(ci => ({ id: ci.id, name: ci.name, price: ci.price, quantity: ci.quantity })),
          totalAmount,
          createdAt,
          utmTrackingParameters,
          new Date()
        );
      } catch (utmifyError) {
        console.error('Erro ao enviar para UTMify (PIX pago):', utmifyError);
      }
    }

    return { success: true, paid: isPaid, status: paymentStatus };
  } catch (error) {
    console.error('Erro ao verificar status:', error);
    const errorMessage = error instanceof Error ? error.message : 'Erro desconhecido';
    return { success: false, error: errorMessage };
  }
}
