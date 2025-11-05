begin;

create or replace function public.ensure_paying_customer_for_invoice(p_invoice_id uuid)
returns uuid
language plpgsql
as $$
declare v_inv record; v_cust_id uuid; v_email text; v_owner uuid; v_lead uuid; v_name text;
begin
  select id, owner_id, customer_id, email, lead_id, customer_name into v_inv
  from public.invoices where id = p_invoice_id;
  if not found then return null; end if;
  v_cust_id := v_inv.customer_id; v_email := v_inv.email; v_owner := v_inv.owner_id; v_lead := v_inv.lead_id; v_name := coalesce(v_inv.customer_name, v_inv.email);

  if v_cust_id is null then
    if v_lead is not null then
      -- use existing conversion path (idempotent on unique owner+email)
      select public.convert_lead_to_customer_v2(v_lead, 'active') into v_cust_id;
    end if;
  end if;

  if v_cust_id is null and v_email is not null then
    select id into v_cust_id from public.customers where owner_id = v_owner and lower(email)=lower(v_email) limit 1;
    if v_cust_id is null then
      insert into public.customers(owner_id, full_name, email, status, customer_number)
      values (v_owner, v_name, v_email, 'active', 'CUST-' || floor(extract(epoch from now())*1000)::bigint::text)
      returning id into v_cust_id;
    end if;
  end if;

  if v_cust_id is not null then
    update public.invoices set customer_id = v_cust_id where id = p_invoice_id and customer_id is null;
  end if;
  return v_cust_id;
end;
$$;

-- Wrapper trigger function to call the invariant function
create or replace function public.trg_ensure_paying_customer()
returns trigger
language plpgsql as $$
begin
  perform public.ensure_paying_customer_for_invoice(new.id);
  return new;
end $$;

drop trigger if exists trg_invoice_paid_customer on public.invoices;
create trigger trg_invoice_paid_customer
after update of status on public.invoices
for each row
when (new.status = 'paid')
execute function public.trg_ensure_paying_customer();

commit;
