-- Ensure customers.owner_id is always set and readable by owner
begin;

create or replace function public.set_owner_id_customers()
returns trigger language plpgsql as $$
begin
  if new.owner_id is null then
    new.owner_id := auth.uid();
  end if;
  return new;
end $$;

drop trigger if exists trg_set_owner_id_customers on public.customers;
create trigger trg_set_owner_id_customers
before insert on public.customers
for each row execute function public.set_owner_id_customers();

-- RLS policies (idempotent)
do $$ begin
  begin
    create policy "customers_select_own"
    on public.customers for select
    using (owner_id = auth.uid());
  exception when duplicate_object then null; end;

  begin
    create policy "customers_insert_self"
    on public.customers for insert
    with check (owner_id = auth.uid());
  exception when duplicate_object then null; end;

  begin
    create policy "customers_update_own"
    on public.customers for update
    using (owner_id = auth.uid())
    with check (owner_id = auth.uid());
  exception when duplicate_object then null; end;
end $$;

commit;


