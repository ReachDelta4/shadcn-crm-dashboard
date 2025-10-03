-- Add recurring product fields
alter table public.products add column if not exists recurring_interval text null check (recurring_interval in ('weekly','monthly','quarterly','semiannual','annual','custom_days'));
alter table public.products add column if not exists recurring_interval_days int null check (recurring_interval_days > 0);

-- Index for recurring products
create index if not exists idx_products_recurring on public.products(recurring_interval) where recurring_interval is not null;


