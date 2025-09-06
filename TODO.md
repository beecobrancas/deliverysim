# TODO - Implement Database-Driven Payment Event Processing

## Problem
UTMify only marks sale as approved when user returns to site after payment. Mobile users who pay and close browser don't trigger the approved event.

## Solution
Save payment events in Supabase database and process them asynchronously via webhook, independent of browser state.

## Tasks
- [x] Create Supabase table for pending sale events
- [x] Create supabaseTables.ts with table schemas
- [x] Modify createPayment function to save data to DB
- [x] Create Mangofy webhook API route (/api/webhook/mangofy)
- [x] Implement async event processor (eventProcessor.ts)
- [ ] Create Supabase table via SQL
- [ ] Test webhook endpoint with Mangofy
- [ ] Test async processing of events
- [ ] Verify UTMify events are sent for mobile users
- [ ] Optional: Simplify CheckoutStep4.tsx to remove browser-dependent logic

## Supabase Table Creation SQL
```sql
CREATE TABLE pending_payment_events (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  paymentId TEXT NOT NULL UNIQUE,
  status TEXT NOT NULL,
  customerData JSONB NOT NULL,
  products JSONB NOT NULL,
  totalAmount DECIMAL(10,2) NOT NULL,
  createdAt TIMESTAMP WITH TIME ZONE NOT NULL,
  approvedAt TIMESTAMP WITH TIME ZONE,
  updatedAt TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  trackingParameters JSONB NOT NULL
);

-- Create index for faster lookups
CREATE INDEX idx_pending_payment_events_paymentId ON pending_payment_events(paymentId);
CREATE INDEX idx_pending_payment_events_status ON pending_payment_events(status);
CREATE INDEX idx_pending_payment_events_createdAt ON pending_payment_events(createdAt);
```

## Status
Implementation Complete - Ready for Testing
