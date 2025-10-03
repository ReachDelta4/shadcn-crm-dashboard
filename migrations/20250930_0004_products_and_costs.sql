-- Products catalog
create table if not exists public.products (
	id uuid primary key default gen_random_uuid(),
	owner_id uuid not null,
	name text not null,
	sku text null,
	currency text not null default 'USD',
	price_minor bigint not null check (price_minor >= 0),
	tax_rate_bp int not null default 0 check (tax_rate_bp >= 0 and tax_rate_bp <= 10000),
	cogs_type text null check (cogs_type in ('percent','amount')),
	cogs_value bigint null,
	discount_type text null check (discount_type in ('percent','amount')),
	discount_value bigint null,
	active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_products_owner on public.products(owner_id);
create index if not exists idx_products_active on public.products(active);

-- Additional costs per product
create table if not exists public.product_additional_costs (
	id uuid primary key default gen_random_uuid(),
	product_id uuid not null,
	name text not null,
	type text not null check (type in ('percent','amount')),
	value bigint not null,
	position int not null default 0
);

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'product_additional_costs_product_fkey'
	) THEN
		ALTER TABLE public.product_additional_costs
			ADD CONSTRAINT product_additional_costs_product_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
	END IF;
END $$;

create index if not exists idx_product_costs_product on public.product_additional_costs(product_id, position);
