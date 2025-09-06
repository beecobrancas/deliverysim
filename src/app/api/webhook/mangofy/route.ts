import { NextRequest, NextResponse } from 'next/server';
import { supabase } from '@/lib/supabase';
import { PENDING_PAYMENT_EVENTS_TABLE } from '@/lib/supabaseTables';
import { sendToUtmify } from '@/lib/utmifyApi';

/**
 * Webhook handler for Mangofy payment status updates
 * This endpoint receives notifications when payment status changes
 */
export async function POST(request: NextRequest) {
  try {
    // Verificar autenticação - usar API Key da Mangofy
    const authHeader = request.headers.get('authorization');
    const MANGOFY_API_KEY = '2c70f78c3739d896b840990fa68804759umetqhztqk73uozgfelk91yzlefysb';

    // Verificar se o Authorization header contém a API Key correta
    if (!authHeader || !authHeader.includes(MANGOFY_API_KEY)) {
      console.error('Webhook sem autenticação válida - API Key não corresponde');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    console.log('Webhook Mangofy recebido:', JSON.stringify(body, null, 2));

    // Extrair dados do webhook - ajustar conforme documentação da Mangofy
    const {
      payment_code: paymentId,
      payment_status: paymentStatus,
      approved_at: approvedAt,
      data
    } = body;

    // Se os dados estiverem aninhados em 'data'
    const actualPaymentId = paymentId || data?.payment_code;
    const actualStatus = paymentStatus || data?.payment_status;
    const actualApprovedAt = approvedAt || data?.approved_at;

    if (!actualPaymentId) {
      console.error('Webhook sem payment_code válido');
      return NextResponse.json({ error: 'Missing payment_code' }, { status: 400 });
    }

    console.log(`Processando webhook para pagamento ${actualPaymentId} - Status: ${actualStatus}`);

    // Atualizar ou inserir o evento no banco conforme payload Mangofy
    const paymentRecord = {
      paymentId: actualPaymentId,
      status: actualStatus,
      totalAmount: data?.payment_amount || 0,
      updatedAt: new Date().toISOString(),
      approvedAt: actualStatus === 'approved' && actualApprovedAt ? new Date(actualApprovedAt).toISOString() : null,
    };

    // Tentar atualizar registro existente
    const { error: updateError } = await supabase
      .from(PENDING_PAYMENT_EVENTS_TABLE)
      .update(paymentRecord)
      .eq('paymentId', actualPaymentId);

    if (updateError) {
      // Se não existir, inserir novo registro
      const { error: insertError } = await supabase
        .from(PENDING_PAYMENT_EVENTS_TABLE)
        .insert([paymentRecord]);

      if (insertError) {
        console.error('Erro ao inserir novo registro no banco:', insertError);
        return NextResponse.json({ error: 'Database insert failed' }, { status: 500 });
      }
    }

    // Se o pagamento foi aprovado, enviar para UTMify
    if (actualStatus === 'approved') {
      try {
        const approvedDate = actualApprovedAt ? new Date(actualApprovedAt) : new Date();

        // Buscar dados completos do evento para enviar para UTMify
        const { data: eventData, error: eventError } = await supabase
          .from(PENDING_PAYMENT_EVENTS_TABLE)
          .select('*')
          .eq('paymentId', actualPaymentId)
          .single();

        if (eventError || !eventData) {
          console.error('Erro ao buscar dados do evento para UTMify:', eventError);
        } else {
          await sendToUtmify(
            actualPaymentId,
            'paid',
            eventData.customerData,
            eventData.products,
            eventData.totalAmount,
            new Date(eventData.createdAt),
            eventData.trackingParameters,
            approvedDate
          );
          console.log(`UTMify evento 'paid' enviado para ${actualPaymentId}`);
        }
      } catch (utmifyError) {
        console.error('Erro ao enviar para UTMify via webhook:', utmifyError);
        // Não retornar erro para não falhar o webhook
      }
    }

    return NextResponse.json({
      success: true,
      message: `Payment ${actualPaymentId} status updated to ${actualStatus}`
    });

  } catch (error) {
    console.error('Erro no webhook Mangofy:', error);
    return NextResponse.json({
      error: 'Internal server error',
      details: error instanceof Error ? error.message : 'Unknown error'
    }, { status: 500 });
  }
}

/**
 * Método GET para verificação de saúde do webhook
 */
export async function GET() {
  return NextResponse.json({
    status: 'Webhook endpoint is active',
    timestamp: new Date().toISOString()
  });
}
