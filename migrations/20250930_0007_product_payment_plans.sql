-- Product payment plans (org-scoped)
create table if not exists public.product_payment_plans (
	id uuid primary key default gen_random_uuid(),
	org_id uuid null,
	product_id uuid not null,
	name text not null,
	num_installments int not null check (num_installments >= 1),
	interval_type text not null check (interval_type in ('weekly','monthly','quarterly','semiannual','annual','custom_days')),
	interval_days int null,
	down_payment_minor bigint null default 0 check (down_payment_minor >= 0),
	active boolean not null default true,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- FKs
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'product_payment_plans_product_fkey'
	) THEN
		ALTER TABLE public.product_payment_plans
			ADD CONSTRAINT product_payment_plans_product_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE CASCADE;
	END IF;
END $$;

-- Indexes
create index if not exists idx_payment_plans_product_active on public.product_payment_plans(product_id, active);
create index if not exists idx_payment_plans_org_active on public.product_payment_plans(org_id, active);
