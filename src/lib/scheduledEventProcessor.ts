import { processPendingEvents, cleanupOldEvents } from './eventProcessor';

/**
 * Scheduled job to process pending payment events and clean old events.
 * This can be triggered by a cron job or serverless function scheduler.
 */
export async function scheduledEventProcessingJob() {
  console.log('Iniciando job agendado para processar eventos pendentes e limpar eventos antigos.');

  const processResult = await processPendingEvents();
  if (!processResult.success) {
    console.error('Erro ao processar eventos pendentes:', processResult.error);
  } else {
    console.log(`Eventos pendentes processados: ${processResult.processed}, erros: ${processResult.errors || 0}`);
  }

  const cleanupResult = await cleanupOldEvents();
  if (!cleanupResult.success) {
    console.error('Erro ao limpar eventos antigos:', cleanupResult.error);
  } else {
    console.log('Eventos antigos limpos com sucesso.');
  }

  console.log('Job agendado concluído.');
}
