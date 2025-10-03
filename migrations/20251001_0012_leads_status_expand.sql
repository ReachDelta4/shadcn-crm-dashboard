-- Expand leads.status to cover full lifecycle and legacy values
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
	ADD CONSTRAINT leads_status_check CHECK (status in (
		'new','contacted','qualified','unqualified',
		'demo_appointment','proposal_negotiation','invoice_sent',
		'won','lost','converted'
	));
