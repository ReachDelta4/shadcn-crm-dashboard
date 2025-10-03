-- Invoice lines (snapshot economics)
create table if not exists public.invoice_lines (
	id uuid primary key default gen_random_uuid(),
	invoice_id uuid not null,
	product_id uuid not null,
	qty int not null check (qty >= 1),
	unit_price_minor bigint not null check (unit_price_minor >= 0),
	discount_type text null check (discount_type in ('percent','amount')),
	discount_value bigint null,
	tax_rate_bp int not null default 0 check (tax_rate_bp >= 0 and tax_rate_bp <= 10000),
	cogs_type text null check (cogs_type in ('percent','amount')),
	cogs_value bigint null,
	billing_type text not null check (billing_type in ('one_time','recurring')),
	billing_frequency text null check (billing_frequency in ('weekly','monthly','quarterly','semiannual','annual','custom_days')),
	billing_interval_days int null,
	currency text not null default 'USD',
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- FKs
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'invoice_lines_invoice_fkey'
	) THEN
		ALTER TABLE public.invoice_lines
			ADD CONSTRAINT invoice_lines_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'invoice_lines_product_fkey'
	) THEN
		ALTER TABLE public.invoice_lines
			ADD CONSTRAINT invoice_lines_product_fkey FOREIGN KEY (product_id) REFERENCES public.products(id) ON DELETE RESTRICT;
	END IF;
END $$;

create index if not exists idx_invoice_lines_invoice on public.invoice_lines(invoice_id);

-- Payment schedules (one-time with plans)
create table if not exists public.invoice_payment_schedules (
	id uuid primary key default gen_random_uuid(),
	invoice_id uuid not null,
	invoice_line_id uuid not null,
	due_at timestamptz not null,
	amount_minor bigint not null check (amount_minor >= 0),
	cogs_share_minor bigint not null default 0,
	status text not null default 'pending' check (status in ('pending','paid','failed','cancelled')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'invoice_payment_schedules_invoice_fkey'
	) THEN
		ALTER TABLE public.invoice_payment_schedules
			ADD CONSTRAINT invoice_payment_schedules_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'invoice_payment_schedules_line_fkey'
	) THEN
		ALTER TABLE public.invoice_payment_schedules
			ADD CONSTRAINT invoice_payment_schedules_line_fkey FOREIGN KEY (invoice_line_id) REFERENCES public.invoice_lines(id) ON DELETE CASCADE;
	END IF;
END $$;

create index if not exists idx_invoice_payment_due on public.invoice_payment_schedules(due_at);

-- Recurring revenue schedules (reporting)
create table if not exists public.recurring_revenue_schedules (
	id uuid primary key default gen_random_uuid(),
	invoice_id uuid not null,
	invoice_line_id uuid not null,
	occurrence_start_at timestamptz not null,
	occurrence_end_at timestamptz not null,
	amount_minor bigint not null,
	cogs_minor bigint not null default 0,
	currency text not null default 'USD',
	status text not null default 'projected' check (status in ('projected','cancelled')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'recurring_revenue_schedules_invoice_fkey'
	) THEN
		ALTER TABLE public.recurring_revenue_schedules
			ADD CONSTRAINT recurring_revenue_schedules_invoice_fkey FOREIGN KEY (invoice_id) REFERENCES public.invoices(id) ON DELETE CASCADE;
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'recurring_revenue_schedules_line_fkey'
	) THEN
		ALTER TABLE public.recurring_revenue_schedules
			ADD CONSTRAINT recurring_revenue_schedules_line_fkey FOREIGN KEY (invoice_line_id) REFERENCES public.invoice_lines(id) ON DELETE CASCADE;
	END IF;
END $$;

create index if not exists idx_recurring_revenue_occurrence on public.recurring_revenue_schedules(occurrence_start_at);
