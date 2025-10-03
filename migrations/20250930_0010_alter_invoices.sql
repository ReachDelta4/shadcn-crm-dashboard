-- Align invoices schema with API usage
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema='public' AND table_name='invoices' AND column_name='date'
	) THEN
		ALTER TABLE public.invoices ADD COLUMN date timestamptz null;
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema='public' AND table_name='invoices' AND column_name='customer_name'
	) THEN
		ALTER TABLE public.invoices ADD COLUMN customer_name text null;
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema='public' AND table_name='invoices' AND column_name='email'
	) THEN
		ALTER TABLE public.invoices ADD COLUMN email text null;
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema='public' AND table_name='invoices' AND column_name='items'
	) THEN
		ALTER TABLE public.invoices ADD COLUMN items int null;
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema='public' AND table_name='invoices' AND column_name='payment_method'
	) THEN
		ALTER TABLE public.invoices ADD COLUMN payment_method text null;
	END IF;
END $$;

-- Optional links to lead/subject for lifecycle tracking
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema='public' AND table_name='invoices' AND column_name='lead_id'
	) THEN
		ALTER TABLE public.invoices ADD COLUMN lead_id uuid null;
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM information_schema.columns 
		WHERE table_schema='public' AND table_name='invoices' AND column_name='subject_id'
	) THEN
		ALTER TABLE public.invoices ADD COLUMN subject_id uuid null;
	END IF;
END $$;

-- Widen status check to include 'draft'
DO $$ BEGIN
	IF EXISTS (
		SELECT 1 FROM pg_constraint 
		WHERE conrelid = 'public.invoices'::regclass 
		AND contype = 'c' 
		AND conname = 'invoices_status_check'
	) THEN
		ALTER TABLE public.invoices DROP CONSTRAINT invoices_status_check;
	END IF;
END $$;

ALTER TABLE public.invoices 
	ADD CONSTRAINT invoices_status_check CHECK (status in ('draft','pending','paid','overdue','cancelled'));

-- Helpful indexes
CREATE INDEX IF NOT EXISTS idx_invoices_date ON public.invoices(date);
CREATE INDEX IF NOT EXISTS idx_invoices_email ON public.invoices(email);


