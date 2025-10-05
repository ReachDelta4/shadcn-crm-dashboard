-- Enable extensions and core indexes (idempotent)
create extension if not exists btree_gist;

-- Activity logs schema alignment for robust auditing
alter table if exists public.activity_logs
  add column if not exists description text,
  add column if not exists "user" text,
  add column if not exists entity text,
  add column if not exists details jsonb,
  add column if not exists "timestamp" timestamptz default now();

create index if not exists idx_activity_logs_timestamp on public.activity_logs("timestamp" desc);

-- Soft delete for leads
alter table if exists public.leads
  add column if not exists deleted_at timestamptz null;

-- Invoices lead FK for referential integrity
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'invoices_lead_fkey'
  ) then
    alter table public.invoices
      add constraint invoices_lead_fkey foreign key (lead_id) references public.leads(id) on delete set null;
  end if;
end $$;

-- Appointment outcome columns and verified session link
alter table if exists public.lead_appointments
  add column if not exists call_outcome text check (call_outcome in ('taken','missed')),
  add column if not exists call_verified_session_id uuid references public.sessions(id) on delete set null;

-- Prevent overlapping scheduled appointments per lead
do $$ begin
  if not exists (
    select 1 from pg_constraint where conname = 'lead_appt_no_overlap'
  ) then
    alter table public.lead_appointments
      add constraint lead_appt_no_overlap
      exclude using gist (
        lead_id with =,
        tstzrange(start_at_utc, end_at_utc, '[]') with &&
      ) where (status = 'scheduled');
  end if;
end $$;


