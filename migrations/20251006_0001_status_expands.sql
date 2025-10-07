-- Expand statuses for invoices, customers, and leads (compat mode)
DO $$ BEGIN
  -- Invoices: include 'sent'
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
  ADD CONSTRAINT invoices_status_check CHECK (status in ('draft','sent','pending','paid','overdue','cancelled'));

DO $$ BEGIN
  -- Customers: include 'churned'
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.customers'::regclass 
      AND contype = 'c' 
      AND conname = 'customers_status_check'
  ) THEN
    ALTER TABLE public.customers DROP CONSTRAINT customers_status_check;
  END IF;
END $$;

ALTER TABLE public.customers
  ADD CONSTRAINT customers_status_check CHECK (status in ('active','inactive','pending','churned'));

DO $$ BEGIN
  -- Leads: include 'disqualified' but keep legacy values for rollout compatibility
  IF EXISTS (
    SELECT 1 FROM pg_constraint 
    WHERE conrelid = 'public.leads'::regclass 
      AND contype = 'c' 
      AND conname = 'leads_status_check'
  ) THEN
    ALTER TABLE public.leads DROP CONSTRAINT leads_status_check;
  END IF;
END $$;

ALTER TABLE public.leads
  ADD CONSTRAINT leads_status_check CHECK (status in (
    'new','contacted','qualified','disqualified','converted',
    -- legacy (kept temporarily for backward compatibility)
    'unqualified','demo_appointment','proposal_negotiation','invoice_sent','won','lost'
  ));



