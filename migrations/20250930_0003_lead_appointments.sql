-- Lead appointments (global calendar anchor)
create table if not exists public.lead_appointments (
	id uuid primary key default gen_random_uuid(),
	lead_id uuid not null,
	subject_id uuid null,
	provider text not null default 'none' check (provider in ('google','outlook','ics','none')),
	status text not null default 'scheduled' check (status in ('scheduled','cancelled','completed')),
	start_at_utc timestamptz not null,
	end_at_utc timestamptz not null,
	timezone text not null,
	provider_event_id text null,
	meeting_link text null,
	notes jsonb null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

-- FKs
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'lead_appointments_lead_fkey'
	) THEN
		ALTER TABLE public.lead_appointments
			ADD CONSTRAINT lead_appointments_lead_fkey FOREIGN KEY (lead_id) REFERENCES public.leads(id) ON DELETE CASCADE;
	END IF;
END $$;

DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'lead_appointments_subject_fkey'
	) THEN
		ALTER TABLE public.lead_appointments
			ADD CONSTRAINT lead_appointments_subject_fkey FOREIGN KEY (subject_id) REFERENCES public.crm_subjects(id) ON DELETE SET NULL;
	END IF;
END $$;

-- Indexes
create index if not exists idx_lead_appointments_lead_time on public.lead_appointments(lead_id, start_at_utc);
create index if not exists idx_lead_appointments_subject_time on public.lead_appointments(subject_id, start_at_utc);
