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
