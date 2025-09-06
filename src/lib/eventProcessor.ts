import { supabase } from './supabase';
import { PENDING_PAYMENT_EVENTS_TABLE, PendingPaymentEvent } from './supabaseTables';
import { sendToUtmify } from './utmifyApi';
import { checkPaymentStatus } from './mangofyApi';

/**
 * Processa eventos pendentes que podem ter sido perdidos
 * Útil para casos onde o webhook não foi chamado
 */
export async function processPendingEvents() {
  try {
    console.log('Iniciando processamento de eventos pendentes...');

    // Buscar eventos com status 'waiting_payment' ou 'pending' que são antigos
    const oneHourAgo = new Date(Date.now() - 60 * 60 * 1000).toISOString();

    const { data: pendingEvents, error } = await supabase
      .from(PENDING_PAYMENT_EVENTS_TABLE)
      .select('*')
      .in('status', ['waiting_payment', 'pending'])
      .lt('createdAt', oneHourAgo)
      .limit(50); // Processar em lotes

    if (error) {
      console.error('Erro ao buscar eventos pendentes:', error);
      return { success: false, error: error.message };
    }

    if (!pendingEvents || pendingEvents.length === 0) {
      console.log('Nenhum evento pendente encontrado para processamento.');
      return { success: true, processed: 0 };
    }

    console.log(`Encontrados ${pendingEvents.length} eventos pendentes para processamento.`);

    let processed = 0;
    let errors = 0;

    for (const event of pendingEvents) {
      try {
        // Verificar status atual com a Mangofy API
        const statusResult = await checkPaymentStatus(
          event.paymentId,
          event.customerData,
          event.products,
          event.totalAmount,
          new Date(event.createdAt),
          event.trackingParameters
        );

        if (statusResult.success && statusResult.paid) {
          // Atualizar status no banco
          await updatePendingEventStatus(event.paymentId, 'approved', new Date());

          // Enviar evento para UTMify
          await sendToUtmify(
            event.paymentId,
            'paid',
            event.customerData,
            event.products,
            event.totalAmount,
            new Date(event.createdAt),
            event.trackingParameters,
            new Date()
          );

          console.log(`Evento ${event.paymentId} processado e enviado para UTMify.`);
        } else {
          console.log(`Evento ${event.paymentId} ainda não pago.`);
        }

        processed++;
      } catch (eventError) {
        console.error(`Erro ao processar evento ${event.paymentId}:`, eventError);
        errors++;
      }
    }

    console.log(`Processamento concluído. Processados: ${processed}, Erros: ${errors}`);
    return { success: true, processed, errors };

  } catch (error) {
    console.error('Erro no processamento de eventos pendentes:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}

/**
 * Busca eventos por paymentId
 */
export async function getPendingEvent(paymentId: string): Promise<PendingPaymentEvent | null> {
  try {
    const { data, error } = await supabase
      .from(PENDING_PAYMENT_EVENTS_TABLE)
      .select('*')
      .eq('paymentId', paymentId)
      .single();

    if (error) {
      console.error('Erro ao buscar evento pendente:', error);
      return null;
    }

    return data;
  } catch (error) {
    console.error('Erro ao buscar evento pendente:', error);
    return null;
  }
}

/**
 * Atualiza status de um evento pendente
 */
export async function updatePendingEventStatus(
  paymentId: string,
  status: string,
  approvedAt?: Date
): Promise<boolean> {
  try {
    const updateData: any = {
      status,
      updatedAt: new Date().toISOString()
    };

    if (approvedAt) {
      updateData.approvedAt = approvedAt.toISOString();
    }

    const { error } = await supabase
      .from(PENDING_PAYMENT_EVENTS_TABLE)
      .update(updateData)
      .eq('paymentId', paymentId);

    if (error) {
      console.error('Erro ao atualizar status do evento:', error);
      return false;
    }

    return true;
  } catch (error) {
    console.error('Erro ao atualizar status do evento:', error);
    return false;
  }
}

/**
 * Remove eventos processados com mais de 30 dias
 */
export async function cleanupOldEvents() {
  try {
    const thirtyDaysAgo = new Date(Date.now() - 30 * 24 * 60 * 60 * 1000).toISOString();

    const { error } = await supabase
      .from(PENDING_PAYMENT_EVENTS_TABLE)
      .delete()
      .in('status', ['paid', 'refused', 'refunded', 'chargedback'])
      .lt('updatedAt', thirtyDaysAgo);

    if (error) {
      console.error('Erro ao limpar eventos antigos:', error);
      return { success: false, error: error.message };
    }

    console.log('Limpeza concluída. Eventos antigos removidos.');
    return { success: true, removed: 0 }; // Delete operations don't return count in Supabase

  } catch (error) {
    console.error('Erro na limpeza de eventos antigos:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error'
    };
  }
}
