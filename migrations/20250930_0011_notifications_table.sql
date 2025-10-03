-- In-app notifications
create table if not exists public.notifications (
	id uuid primary key default gen_random_uuid(),
	user_id uuid not null,
	type text not null,
	title text not null,
	message text not null,
	entity_type text null,
	entity_id uuid null,
	metadata jsonb null,
	read boolean not null default false,
	created_at timestamptz not null default now()
);

-- Foreign key to auth.users (best-effort)
DO $$ BEGIN
	IF NOT EXISTS (
		SELECT 1 FROM pg_constraint WHERE conname = 'notifications_user_fkey'
	) THEN
		ALTER TABLE public.notifications
			ADD CONSTRAINT notifications_user_fkey FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;
	END IF;
END $$;

-- Indexes for performance
create index if not exists idx_notifications_user_read on public.notifications(user_id, read, created_at desc);
create index if not exists idx_notifications_type on public.notifications(type);
create index if not exists idx_notifications_entity on public.notifications(entity_type, entity_id);

-- RLS
alter table public.notifications enable row level security;

create policy "notifications_owner_policy" on public.notifications
	for all using (auth.uid() = user_id);
