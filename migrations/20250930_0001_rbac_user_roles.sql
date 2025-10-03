-- RBAC roles table (additive, backward-compatible)
create table if not exists public.user_roles (
	user_id uuid not null,
	org_id uuid null,
	team_id uuid null,
	role text not null check (role in ('rep','lead','manager','executive','god')),
	created_at timestamptz not null default now(),
	constraint user_roles_pkey primary key (user_id)
);

-- Helpful indexes
create index if not exists idx_user_roles_org on public.user_roles(org_id);
create index if not exists idx_user_roles_team on public.user_roles(team_id);
create index if not exists idx_user_roles_role on public.user_roles(role);

-- Note: RLS policies can be added later; admin-only management initially.
