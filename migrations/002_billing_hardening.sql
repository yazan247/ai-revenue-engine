-- Billing hardening migration for Neon/PostgreSQL.
-- Safe to run once after the original billing schema.

create extension if not exists pgcrypto;

alter table billing_events add column if not exists event_type text;
alter table billing_events add column if not exists external_event_id text;
alter table billing_events add column if not exists amount_cents integer;
alter table billing_events add column if not exists currency text;
alter table billing_events add column if not exists payload jsonb not null default '{}'::jsonb;
alter table billing_events add column if not exists provider_reference text;
alter table billing_events add column if not exists reviewed_by text;
alter table billing_events add column if not exists reviewed_at timestamptz;

create unique index if not exists billing_events_external_event_id_uq on billing_events(external_event_id) where external_event_id is not null;
create index if not exists billing_events_pending_idx on billing_events(status, created_at) where status = 'pending_payment';
create index if not exists billing_events_account_idx on billing_events(account_id, created_at desc);

alter table subscriptions add column if not exists status text not null default 'active';
alter table subscriptions add column if not exists updated_at timestamptz not null default now();

-- Prevent more than one subscription row per account.
create unique index if not exists subscriptions_account_uq on subscriptions(account_id);
