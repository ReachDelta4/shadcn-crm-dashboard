-- Tighten leads.status to new model only (post-clean slate)
DO $$ BEGIN
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
  ADD CONSTRAINT leads_status_check CHECK (status in ('new','contacted','qualified','disqualified','converted'));


