-- FINAL PRODUCTION BILLING MIGRATION
-- Additive only: preserves existing billing data and existing provider_event_id.
-- Run this file once on the verified Production Neon database.

create extension if not exists pgcrypto;

alter table billing_events
  add column if not exists status text not null default 'received',
  add column if not exists amount_cents integer,
  add column if not exists currency text,
  add column if not exists provider_reference text,
  add column if not exists reviewed_by text,
  add column if not exists reviewed_at timestamptz;

create index if not exists billing_events_pending_payment_idx
  on billing_events(status, created_at)
  where status = 'pending_payment';

-- Keep the existing (provider, provider_event_id) uniqueness intact.
-- No duplicate external-event index is created.

alter table subscriptions
  add column if not exists updated_at timestamptz not null default now();

create unique index if not exists subscriptions_account_uq
  on subscriptions(account_id);
