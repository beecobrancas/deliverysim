import type { NextApiRequest, NextApiResponse } from 'next';

const UTMIFY_ENDPOINT = 'https://api.utmify.com.br/api-credentials/orders';
const UTMIFY_TOKEN = 'M4qxPRbUoEhE4M97ymcGupDgEKn2c2PFmGcX'; // seu token

function toUtmifyDate(d: Date | string | number | null | undefined) {
  if (!d) return null as any;
  const iso = new Date(d).toISOString();
  return iso.replace('T', ' ').substring(0, 19);
}

function mapStatus(s?: string | null) {
  if (s === 'waiting_payment') return 'waiting_payment';
  if (s === 'approved')        return 'paid';
  if (s === 'reproved' || s === 'canceled' || s === 'expired') return 'refused';
  return null;
}

export default async function handler(req: NextApiRequest, res: NextApiResponse) {
  // Healthcheck via GET no navegador
  if (req.method === 'GET') {
    return res.status(200).json({ ok: true, route: '/api/mangofy/postback' });
  }

  if (req.method !== 'POST') {
    return res.status(405).json({ ok: false, error: 'Method Not Allowed' });
  }

  try {
    const body = req.body || {};
    console.log('Postback Mangofy recebido:', body);

    const utmStatus = mapStatus(body?.payment_status);
    if (!utmStatus) {
      console.warn('Status não mapeado:', body?.payment_status);
      return res.status(200).json({ ok: true });
    }

    // Lê UTMs da querystring (vindas do createPayment)
    const {
      src = null,
      sck = null,
      utm_source = null,
      utm_campaign = null,
      utm_medium = null,
      utm_content = null,
      utm_term = null,
      createdAt: createdAtQS = null,
    } = req.query as Record<string, string | null>;

    // Datas
    const createdAt    = toUtmifyDate(createdAtQS || body?.created_at || Date.now());
    const approvedAt   = body?.approved_at || body?.paid_at || null;
    const approvedDate = utmStatus === 'paid' ? toUtmifyDate(approvedAt || Date.now()) : null;

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

    const totalInCents = body?.payment_amount || 0;

    const utmifyPayload = {
      orderId:       body?.payment_code,
      platform:      'Mangofy',
      paymentMethod: 'pix',
      status:        utmStatus, // waiting_payment | paid | refused
      createdAt,
      approvedDate,
      refundedAt:    null,
      customer,
      products,
      trackingParameters: {
        src, sck, utm_source, utm_campaign, utm_medium, utm_content, utm_term,
      },
      commission: {
        totalPriceInCents: totalInCents,
        gatewayFeeInCents: 0,
        userCommissionInCents: totalInCents,
        currency: 'BRL',
      },
      isTest: false,
    };

    const resp = await fetch(UTMIFY_ENDPOINT, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'x-api-token': UTMIFY_TOKEN,
      },
      body: JSON.stringify(utmifyPayload),
    });

    if (!resp.ok) {
      const txt = await resp.text();
      console.error('UTMify ERRO:', txt);
      // Mesmo com erro, retornamos 200 pra Mangofy não ficar re-tentando
      return res.status(200).json({ ok: true, utmify: 'error' });
    }

    console.log('UTMify OK');
    return res.status(200).json({ ok: true });
  } catch (e) {
    console.error('Erro no postback:', e);
    // Retorne 200 para não causar retries agressivos
    return res.status(200).json({ ok: false });
  }
}
