/**
 * Supabase table schemas and helper functions for payment event storage
 */

export interface PendingPaymentEvent {
  id?: string; // UUID primary key
  paymentId: string;
  status: 'waiting_payment' | 'paid' | 'refused' | 'refunded' | 'chargedback' | 'pending';
  customerData: {
    name: string;
    email: string;
    cpf: string;
    phone: string;
  };
  products: Array<{
    id: string;
    name: string;
    price: number;
    quantity: number;
  }>;
  totalAmount: number;
  createdAt: string; // ISO string
  approvedAt?: string | null; // ISO string or null
  updatedAt?: string; // ISO string
  trackingParameters: {
    src: string | null;
    sck: string | null;
    utm_source: string | null;
    utm_campaign: string | null;
    utm_medium: string | null;
    utm_content: string | null;
    utm_term: string | null;
  };
}

/**
 * Table name for pending payment events
 */
export const PENDING_PAYMENT_EVENTS_TABLE = 'pending_payment_events';
