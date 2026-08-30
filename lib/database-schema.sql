-- InvoicePilot production database schema
create table if not exists accounts (
  id uuid primary key,
  email text not null unique,
  name text not null,
  password_hash text not null,
  created_at timestamptz not null default now()
);

create table if not exists invoices (
  id uuid primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  customer_name text not null,
  customer_email text not null,
  invoice_number text not null,
  amount numeric(12,2) not null check (amount > 0),
  currency char(3) not null default 'USD',
  due_date date not null,
  status text not null check (status in ('overdue','due_soon','paid')),
  created_at timestamptz not null default now(),
  unique(account_id, invoice_number)
);
create index if not exists invoices_account_id_idx on invoices(account_id);
create index if not exists invoices_due_date_idx on invoices(account_id, due_date);

create table if not exists auth_sessions (
  id uuid primary key,
  account_id uuid not null references accounts(id) on delete cascade,
  token_hash text not null unique,
  expires_at timestamptz not null,
  created_at timestamptz not null default now()
);
create index if not exists auth_sessions_account_idx on auth_sessions(account_id);
create index if not exists auth_sessions_expiry_idx on auth_sessions(expires_at);

create table if not exists reminder_deliveries (
  id uuid primary key,
  invoice_id uuid not null references invoices(id) on delete cascade,
  stage text not null check (stage in ('upcoming','due_today','3_days_overdue','7_days_overdue','14_days_overdue')),
  scheduled_for date not null,
  status text not null check (status in ('pending','sent','failed')),
  provider_id text,
  error text,
  created_at timestamptz not null default now(),
  sent_at timestamptz,
  unique(invoice_id, stage, scheduled_for)
);
create index if not exists reminder_deliveries_invoice_idx on reminder_deliveries(invoice_id);
create index if not exists reminder_deliveries_status_idx on reminder_deliveries(status, scheduled_for);

-- Billing is provider-neutral. A paid subscription is only activated by a verified provider event.
create table if not exists subscriptions (
  id uuid primary key,
  account_id uuid not null unique references accounts(id) on delete cascade,
  plan text not null default 'free' check (plan in ('free','pro','business')),
  status text not null default 'active' check (status in ('active','trialing','past_due','canceled','incomplete')),
  provider text,
  provider_customer_id text,
  provider_subscription_id text,
  current_period_start timestamptz,
  current_period_end timestamptz,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);
create unique index if not exists subscriptions_provider_subscription_idx on subscriptions(provider, provider_subscription_id) where provider_subscription_id is not null;
create index if not exists subscriptions_status_idx on subscriptions(status);

create table if not exists billing_events (
  id uuid primary key,
  provider text not null,
  provider_event_id text not null,
  event_type text not null,
  account_id uuid references accounts(id) on delete set null,
  payload jsonb not null default '{}'::jsonb,
  processed_at timestamptz,
  created_at timestamptz not null default now(),
  unique(provider, provider_event_id)
);
create index if not exists billing_events_account_idx on billing_events(account_id, created_at desc);

-- Seed only the plan catalog; no user receives a paid plan from this migration.
create table if not exists plan_catalog (
  plan text primary key check (plan in ('free','pro','business')),
  monthly_price_cents integer not null check (monthly_price_cents >= 0),
  invoice_limit integer,
  reminder_limit integer,
  features jsonb not null default '{}'::jsonb,
  active boolean not null default true,
  created_at timestamptz not null default now()
);

insert into plan_catalog (plan, monthly_price_cents, invoice_limit, reminder_limit, features)
values
  ('free', 0, 5, 5, '{"automatic_reminders": false, "email_delivery": true}'::jsonb),
  ('pro', 900, 100, 100, '{"automatic_reminders": true, "email_delivery": true}'::jsonb),
  ('business', 1900, null, null, '{"automatic_reminders": true, "email_delivery": true, "priority_support": true}'::jsonb)
on conflict (plan) do update set
  monthly_price_cents = excluded.monthly_price_cents,
  invoice_limit = excluded.invoice_limit,
  reminder_limit = excluded.reminder_limit,
  features = excluded.features,
  active = true;

-- Existing and newly-created accounts start on Free. This never upgrades anyone.
insert into subscriptions (id, account_id, plan, status)
select gen_random_uuid(), a.id, 'free', 'active'
from accounts a
where not exists (select 1 from subscriptions s where s.account_id = a.id);

create or replace function touch_subscription_updated_at()
returns trigger language plpgsql as $$
begin
  new.updated_at = now();
  return new;
end;
$$;

drop trigger if exists subscriptions_updated_at on subscriptions;
create trigger subscriptions_updated_at
before update on subscriptions
for each row execute function touch_subscription_updated_at();
