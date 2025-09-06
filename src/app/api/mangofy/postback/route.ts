// src/app/api/mangofy/postback/route.ts
import { NextRequest, NextResponse } from 'next/server';

const UTMIFY_ENDPOINT = 'https://api.utmify.com.br/api-credentials/orders';
const UTMIFY_TOKEN = 'M4qxPRbUoEhE4M97ymcGupDgEKn2c2PFmGcX'; // <- seu token da UTMify

// Date -> 'YYYY-MM-DD HH:MM:SS' (UTC)
function toUtmifyDate(d: Date | string | number | null | undefined) {
  if (!d) return null;
  const iso = new Date(d).toISOString();
  return iso.replace('T', ' ').substring(0, 19);
}

// Mapeia status Mangofy -> Utmify
function mapStatus(s?: string) {
  if (s === 'waiting_payment') return 'waiting_payment';
  if (s === 'approved')        return 'paid';
  if (s === 'reproved' || s === 'canceled' || s === 'expired') return 'refused';
  return null;
}

export async function POST(req: NextRequest) {
  try {
    const body = await req.json();
    console.log('Postback Mangofy recebido:', body);

    const utmStatus = mapStatus(body?.payment_status);
    if (!utmStatus) {
      console.warn('Status não mapeado:', body?.payment_status);
      return NextResponse.json({ ok: true }); // 200 pra não gerar retry infinito
    }

    // Ler UTMs da querystring (foram colocados no createPayment)
    const url = new URL(req.url);
    const trackingParameters = {
      src:          url.searchParams.get('src'),
      sck:          url.searchParams.get('sck'),
      utm_source:   url.searchParams.get('utm_source'),
      utm_campaign: url.searchParams.get('utm_campaign'),
      utm_medium:   url.searchParams.get('utm_medium'),
      utm_content:  url.searchParams.get('utm_content'),
      utm_term:     url.searchParams.get('utm_term'),
    };

    // Cliente
    const customer = {
      name:     body?.customer?.name || '',
      email:    body?.customer?.email || '',
      phone:    body?.customer?.phone || null,
      document: body?.customer?.document || null,
      country:  'BR',
      ip:       body?.customer?.ip || null,
    };

    // Produtos
    const products = (body?.items || []).map((i: any) => ({
      id:           i?.code,
      name:         i?.name,
      planId:       null,
      planName:     null,
      quantity:     i?.total && i?.amount ? Math.max(1, Math.round(i.total / i.amount)) : 1,
      priceInCents: i?.amount || 0,
    }));

    const createdAt    = toUtmifyDate(body?.created_at || Date.now());
    const approvedDate = utmStatus === 'paid' ? toUtmifyDate(Date.now()) : null;
    const totalInCents = body?.payment_amount || 0;

    // Payload no formato da UTMify (conforme doc que você mandou)
    const utmifyPayload = {
      orderId:       body?.payment_code,        // ID do pedido (Mangofy)
      platform:      'Mangofy',
      paymentMethod: 'pix',
      status:        utmStatus,                 // waiting_payment | paid | refused
      createdAt,
      approvedDate,
      refundedAt:    null,
      customer,
      products,
      trackingParameters,
      commission: {
        totalPriceInCents: totalInCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: totalInCents,
        currency: 'BRL',
      },
      isTest: false,
    };

    const res = await fetch(UTMIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_TOKEN,
      },
      body: JSON.stringify(utmifyPayload),
    });

    if (!res.ok) {
      const errTxt = await res.text();
      console.error('UTMify ERRO:', errTxt);
      // Mesmo com erro, retornamos 200 para a Mangofy
    } else {
      console.log('UTMify OK');
    }

    return NextResponse.json({ ok: true });
  } catch (e) {
    console.error('Erro no postback:', e);
    return NextResponse.json({ ok: false }, { status: 200 });
  }
}
