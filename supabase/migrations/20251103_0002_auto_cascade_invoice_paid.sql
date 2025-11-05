-- Auto-cascade invoices to 'paid' when all schedules for the invoice are paid
-- Idempotent: creates or replaces function and drops/creates trigger safely
begin;

create or replace function public.trg_set_invoice_paid_when_all_schedules_paid()
returns trigger
language plpgsql
as $$
declare inv_id uuid;
begin
  -- Only act on transitions to 'paid'
  if (tg_op = 'UPDATE') then
    if (new.status <> 'paid') then
      return new;
    end if;
    inv_id := new.invoice_id;
  else
    return new;
  end if;

  -- Mark invoice paid if no pending/overdue/failed/cancelled schedules remain
  update public.invoices i
     set status = 'paid',
         paid_at = coalesce(i.paid_at, now())
   where i.id = inv_id
     and i.status <> 'paid'
     and not exists (
       select 1 from public.invoice_payment_schedules s
        where s.invoice_id = inv_id
          and s.status in ('pending','overdue','failed','cancelled')
     );

  return new;
end;
$$;

drop trigger if exists trg_auto_cascade_invoice_paid on public.invoice_payment_schedules;
create trigger trg_auto_cascade_invoice_paid
after update of status on public.invoice_payment_schedules
for each row
when (new.status = 'paid' and (old.status is distinct from new.status))
execute function public.trg_set_invoice_paid_when_all_schedules_paid();

commit;

