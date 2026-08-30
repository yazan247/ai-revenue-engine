-- Add only columns missing from the verified Production Neon schema.
-- No existing rows are deleted or rewritten.

alter table billing_events add column if not exists status text not null default 'received';
alter table billing_events add column if not exists amount_cents integer;
alter table billing_events add column if not exists currency text;
alter table billing_events add column if not exists provider_reference text;
alter table billing_events add column if not exists reviewed_by text;
alter table billing_events add column if not exists reviewed_at timestamptz;

create index if not exists billing_events_pending_payment_idx
  on billing_events(status, created_at)
  where status = 'pending_payment';
