-- DEV-ONLY schema alignment for CRM app expectations
-- Safe/idempotent: uses IF EXISTS / IF NOT EXISTS and constraint drops guarded by IF EXISTS
-- Apply in Supabase SQL editor

-- =========================
-- Leads: add date column + index; expand status values
-- =========================
alter table if exists public.leads
  add column if not exists date timestamptz not null default timezone('utc', now());

create index if not exists idx_leads_date on public.leads(date);

-- Expand allowed lead status values to include 'unqualified' and 'converted' (keep 'lost' for compatibility)
alter table if exists public.leads drop constraint if exists leads_status_check;
alter table if exists public.leads
  add constraint leads_status_check
  check (status in ('new','contacted','qualified','unqualified','converted','lost'));

-- =========================
-- Orders: add date column + index
-- =========================
alter table if exists public.orders
  add column if not exists date timestamptz not null default timezone('utc', now());

create index if not exists idx_orders_date on public.orders(date);

-- =========================
-- Invoices: add date column + index; make status include 'draft' and set default to 'draft'
-- =========================
alter table if exists public.invoices
  add column if not exists date timestamptz not null default timezone('utc', now());

create index if not exists idx_invoices_date on public.invoices(date);

-- Include 'draft' in allowed statuses and set default accordingly
alter table if exists public.invoices alter column status set default 'draft';
alter table if exists public.invoices drop constraint if exists invoices_status_check;
alter table if exists public.invoices
  add constraint invoices_status_check
  check (status in ('draft','pending','paid','overdue','cancelled'));

-- =========================
-- Helpful indexes (no-ops if they already exist)
-- =========================
create index if not exists idx_customers_owner on public.customers(owner_id);
create index if not exists idx_leads_owner on public.leads(owner_id);
create index if not exists idx_orders_owner on public.orders(owner_id);
create index if not exists idx_invoices_owner on public.invoices(owner_id);
create index if not exists idx_activity_logs_owner on public.activity_logs(owner_id);