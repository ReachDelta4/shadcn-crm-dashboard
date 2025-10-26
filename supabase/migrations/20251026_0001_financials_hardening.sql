-- Idempotent DB hardening for invoices + schedules + idempotency + RLS
begin;

-- external_id for invoice idempotency (per-owner)
alter table if exists public.invoices add column if not exists external_id text;
create unique index if not exists unique_invoice_external_id_per_owner on public.invoices(owner_id, external_id) where external_id is not null;

-- Invoice number generator + uniqueness (per-owner)
create sequence if not exists invoice_number_seq;
create or replace function public.generate_invoice_number() returns text language plpgsql as $$
declare seq bigint;
begin
  select nextval('invoice_number_seq') into seq;
  return 'INV-' || to_char(now(),'YYYYMMDD') || '-' || lpad(seq::text, 6, '0');
end $$;

create or replace function public.set_invoice_number_default() returns trigger language plpgsql as $$
begin
  if new.invoice_number is null or length(trim(new.invoice_number)) = 0 then
    new.invoice_number := public.generate_invoice_number();
  end if;
  return new;
end $$;

drop trigger if exists trg_set_invoice_number_default on public.invoices;
create trigger trg_set_invoice_number_default before insert on public.invoices for each row execute function public.set_invoice_number_default();

create unique index if not exists unique_invoice_number_per_owner on public.invoices(owner_id, invoice_number);

-- RPC: atomically mark schedule paid and cascade invoice status when all paid
create or replace function public.mark_schedule_paid_cascade(p_schedule_id uuid, p_paid_at timestamptz)
returns table (schedule_id uuid, invoice_id uuid, invoice_paid boolean)
language plpgsql as $$
declare inv_id uuid;
begin
  update public.invoice_payment_schedules
  set status='paid', paid_at = coalesce(p_paid_at, now())
  where id = p_schedule_id and status in ('pending','overdue')
  returning invoice_id into inv_id;

  if inv_id is null then
    select invoice_id into inv_id from public.invoice_payment_schedules where id = p_schedule_id;
  end if;

  if inv_id is not null then
    update public.invoices
    set status = 'paid', paid_at = coalesce(p_paid_at, now())
    where id = inv_id
      and status <> 'paid'
      and not exists (
        select 1 from public.invoice_payment_schedules s
        where s.invoice_id = inv_id and s.status in ('pending','overdue','failed','cancelled')
      );
  end if;

  return query
    select p_schedule_id, inv_id, exists(
      select 1 from public.invoices i where i.id = inv_id and i.status = 'paid'
    );
end $$;

grant execute on function public.mark_schedule_paid_cascade(uuid, timestamptz) to anon, authenticated, service_role;

-- RLS enable + policies (idempotent)
do $$ begin
  begin execute 'alter table public.invoices enable row level security'; exception when others then null; end;
  begin execute 'alter table public.invoice_lines enable row level security'; exception when others then null; end;
  begin execute 'alter table public.invoice_payment_schedules enable row level security'; exception when others then null; end;
  begin execute 'alter table public.recurring_revenue_schedules enable row level security'; exception when others then null; end;
  begin execute 'alter table public.leads enable row level security'; exception when others then null; end;
end $$;

do $$ begin
  begin create policy invoices_select_own on public.invoices for select using (owner_id = auth.uid()); exception when duplicate_object then null; end;
  begin create policy invoices_insert_own on public.invoices for insert with check (owner_id = auth.uid()); exception when duplicate_object then null; end;
  begin create policy invoices_update_own on public.invoices for update using (owner_id = auth.uid()) with check (owner_id = auth.uid()); exception when duplicate_object then null; end;
  begin create policy invoices_delete_own on public.invoices for delete using (owner_id = auth.uid()); exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin create policy invoice_lines_rw_own on public.invoice_lines for select using (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
  begin create policy invoice_lines_ins_own on public.invoice_lines for insert with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
  begin create policy invoice_lines_upd_own on public.invoice_lines for update using (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())) with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
  begin create policy invoice_lines_del_own on public.invoice_lines for delete using (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin create policy payment_schedules_rw_own on public.invoice_payment_schedules for select using (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
  begin create policy payment_schedules_ins_own on public.invoice_payment_schedules for insert with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
  begin create policy payment_schedules_upd_own on public.invoice_payment_schedules for update using (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())) with check (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
  begin create policy payment_schedules_del_own on public.invoice_payment_schedules for delete using (exists (select 1 from public.invoices i where i.id = invoice_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin create policy recurring_schedules_rw_own on public.recurring_revenue_schedules for select using (exists (select 1 from public.invoice_lines l join public.invoices i on i.id = l.invoice_id where l.id = invoice_line_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
  begin create policy recurring_schedules_ins_own on public.recurring_revenue_schedules for insert with check (exists (select 1 from public.invoice_lines l join public.invoices i on i.id = l.invoice_id where l.id = invoice_line_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
  begin create policy recurring_schedules_upd_own on public.recurring_revenue_schedules for update using (exists (select 1 from public.invoice_lines l join public.invoices i on i.id = l.invoice_id where l.id = invoice_line_id and i.owner_id = auth.uid())) with check (exists (select 1 from public.invoice_lines l join public.invoices i on i.id = l.invoice_id where l.id = invoice_line_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
  begin create policy recurring_schedules_del_own on public.recurring_revenue_schedules for delete using (exists (select 1 from public.invoice_lines l join public.invoices i on i.id = l.invoice_id where l.id = invoice_line_id and i.owner_id = auth.uid())); exception when duplicate_object then null; end;
end $$;

do $$ begin
  begin create policy leads_select_own on public.leads for select using (owner_id = auth.uid()); exception when duplicate_object then null; end;
  begin create policy leads_insert_own on public.leads for insert with check (owner_id = auth.uid()); exception when duplicate_object then null; end;
  begin create policy leads_update_own on public.leads for update using (owner_id = auth.uid()) with check (owner_id = auth.uid()); exception when duplicate_object then null; end;
  begin create policy leads_delete_own on public.leads for delete using (owner_id = auth.uid()); exception when duplicate_object then null; end;
end $$;

-- State transition enforcement
create or replace function public.enforce_payment_schedule_state() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if old.status in ('paid','cancelled') and new.status <> old.status then
      raise exception 'Invalid state transition for payment schedule: % -> %', old.status, new.status;
    end if;
    if old.status = 'pending' and not (new.status in ('paid','overdue','cancelled')) then
      raise exception 'Invalid state transition for payment schedule: % -> %', old.status, new.status;
    end if;
    if old.status = 'overdue' and not (new.status in ('paid','cancelled')) then
      raise exception 'Invalid state transition for payment schedule: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_enforce_payment_schedule_state on public.invoice_payment_schedules;
create trigger trg_enforce_payment_schedule_state before update on public.invoice_payment_schedules for each row execute function public.enforce_payment_schedule_state();

create or replace function public.enforce_recurring_schedule_state() returns trigger language plpgsql as $$
begin
  if tg_op = 'UPDATE' then
    if old.status in ('billed','cancelled') and new.status <> old.status then
      raise exception 'Invalid state transition for recurring schedule: % -> %', old.status, new.status;
    end if;
    if old.status = 'scheduled' and not (new.status in ('billed','cancelled')) then
      raise exception 'Invalid state transition for recurring schedule: % -> %', old.status, new.status;
    end if;
  end if;
  return new;
end $$;

drop trigger if exists trg_enforce_recurring_schedule_state on public.recurring_revenue_schedules;
create trigger trg_enforce_recurring_schedule_state before update on public.recurring_revenue_schedules for each row execute function public.enforce_recurring_schedule_state();

commit;

