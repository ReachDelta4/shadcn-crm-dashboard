-- Add optional lead link to orders (idempotent)
ALTER TABLE IF EXISTS public.orders
	ADD COLUMN IF NOT EXISTS lead_id uuid;

-- Optional FK: ensure referential integrity without cascading deletes
DO $$
BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint 
		WHERE conname = 'orders_lead_id_fkey'
	) THEN
		ALTER TABLE public.orders
			ADD CONSTRAINT orders_lead_id_fkey
			FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE SET NULL;
	END IF;
END $$;

-- Index for filtering by lead
CREATE INDEX IF NOT EXISTS idx_orders_lead_id ON public.orders(lead_id);
