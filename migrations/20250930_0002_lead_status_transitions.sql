-- Lead status transitions (normalized audit trail)
create table if not exists public.lead_status_transitions (
	id uuid primary key default gen_random_uuid(),
	lead_id uuid not null,
	subject_id uuid null,
	actor_id uuid not null,
	event_type text not null default 'status_change',
	status_from text null,
	status_to text not null,
	override_flag boolean not null default false,
	override_reason text null,
	idempotency_key text null,
	metadata jsonb null,
	created_at timestamptz not null default now()
);

-- Uniqueness for idempotency when provided
create unique index if not exists uq_lead_status_transitions_idempotency on public.lead_status_transitions(idempotency_key) where idempotency_key is not null;

-- FKs (if leads/subjects exist), ignore if already present
do $$ begin
	if not exists (
		select 1 from pg_constraint where conname = 'lead_status_transitions_lead_fkey'
	) then
		alter table public.lead_status_transitions
			add constraint lead_status_transitions_lead_fkey foreign key (lead_id) references public.leads(id) on delete cascade;
	end if;
end $$;

do $$ begin
	if not exists (
		select 1 from pg_constraint where conname = 'lead_status_transitions_subject_fkey'
	) then
		alter table public.lead_status_transitions
			add constraint lead_status_transitions_subject_fkey foreign key (subject_id) references public.crm_subjects(id) on delete set null;
	end if;
end $$;

-- Helpful indexes
create index if not exists idx_lead_status_transitions_lead_time on public.lead_status_transitions(lead_id, created_at desc);
create index if not exists idx_lead_status_transitions_actor_time on public.lead_status_transitions(actor_id, created_at desc);
