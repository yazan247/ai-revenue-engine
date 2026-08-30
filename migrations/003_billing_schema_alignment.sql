-- Align the billing implementation with the existing Neon schema.
-- This migration is additive: it does not rename or delete existing columns.

alter table billing_events add column if not exists external_event_id text;
alter table billing_events add column if not exists amount_cents integer;
alter table billing_events add column if not exists currency text;
alter table billing_events add column if not exists provider_reference text;
alter table billing_events add column if not exists reviewed_by text;
alter table billing_events add column if not exists reviewed_at timestamptz;

-- Backfill the new external id from the existing provider event id where available.
update billing_events
set external_event_id = provider_event_id
where external_event_id is null and provider_event_id is not null;

create unique index if not exists billing_events_external_event_id_uq
  on billing_events(external_event_id)
  where external_event_id is not null;

create index if not exists billing_events_pending_idx
  on billing_events(status, created_at)
  where status = 'pending_payment';

create index if not exists billing_events_account_idx
  on billing_events(account_id, created_at desc);

create unique index if not exists subscriptions_account_uq
  on subscriptions(account_id);
