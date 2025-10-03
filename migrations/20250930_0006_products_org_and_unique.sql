-- Add org_id to products to support org-scoped catalogs
alter table public.products add column if not exists org_id uuid null;

-- Indexes for org visibility and filtering
create index if not exists idx_products_org on public.products(org_id);
create index if not exists idx_products_org_active on public.products(org_id, active);

-- Unique SKU per org (if sku provided)
create unique index if not exists uq_products_org_sku on public.products(org_id, sku) where sku is not null;
