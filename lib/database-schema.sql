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
