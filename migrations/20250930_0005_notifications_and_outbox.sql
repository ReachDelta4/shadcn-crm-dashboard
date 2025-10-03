-- Notification settings per user
create table if not exists public.notification_settings (
	id uuid primary key default gen_random_uuid(),
	owner_id uuid not null,
	inapp boolean not null default true,
	email boolean not null default false,
	push boolean not null default false,
	reminder_24h boolean not null default true,
	reminder_1h boolean not null default true,
	calendar_provider text not null default 'none' check (calendar_provider in ('google','outlook','none')),
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_notification_settings_owner on public.notification_settings(owner_id);

-- Outbox jobs for async provider sync
create table if not exists public.outbox_jobs (
	id uuid primary key default gen_random_uuid(),
	job_type text not null,
	payload jsonb not null,
	status text not null default 'pending' check (status in ('pending','retrying','failed','done')),
	attempts int not null default 0,
	next_run_at timestamptz null,
	last_error text null,
	created_at timestamptz not null default now(),
	updated_at timestamptz not null default now()
);

create index if not exists idx_outbox_jobs_next on public.outbox_jobs(status, next_run_at);
