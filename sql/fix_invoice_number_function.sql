-- Ensure a sequence exists for generating human-friendly invoice numbers
create sequence if not exists public.invoice_number_seq;

-- Create or replace the invoice transition function to populate invoice_number
create or replace function public.fn_transition_with_invoice(
  p_lead_id uuid,
  p_target_status text,
  p_payload jsonb,
  p_idempotency_key text
) returns jsonb as $$
declare
  v_lead record;
  v_invoice_id uuid;
  v_transition_id uuid;
  v_status text;
  v_total_minor bigint := 0;
  v_items int := 0;
  v_line jsonb;
  v_invoice_number text;
begin
  select * into v_lead from public.leads where id = p_lead_id and deleted_at is null;
  if not found then
    raise exception 'lead not found' using errcode = 'P0002';
  end if;

  v_status := coalesce(p_payload->>'status', case when p_target_status = 'won' then 'paid' else 'pending' end);

  -- compute summary from provided lines (expect minor units)
  for v_line in select * from jsonb_array_elements(coalesce(p_payload->'line_items','[]'::jsonb)) loop
    v_total_minor := v_total_minor + coalesce((v_line->>'total_minor')::bigint,0);
    v_items := v_items + 1;
  end loop;

  -- generate invoice number (e.g. INV-000001)
  v_invoice_number := 'INV-' || lpad(nextval('public.invoice_number_seq')::text, 6, '0');

  insert into public.invoices(
    invoice_number,
    owner_id, customer_name, email, amount, status, date, due_date, items,
    lead_id, subject_id
  ) values (
    v_invoice_number,
    v_lead.owner_id,
    coalesce(p_payload->>'customer_name', v_lead.full_name),
    coalesce(p_payload->>'email', v_lead.email),
    (v_total_minor::numeric) / 100.0,
    v_status,
    coalesce((p_payload->>'date')::timestamptz, now()),
    (p_payload->>'due_date')::timestamptz,
    v_items,
    p_lead_id,
    v_lead.subject_id
  ) returning id into v_invoice_id;

  -- insert lines if provided
  if jsonb_typeof(p_payload->'line_items') = 'array' then
    insert into public.invoice_lines(
      invoice_id, product_id, qty, unit_price_minor, discount_type, discount_value, tax_rate_bp, cogs_type, cogs_value, billing_type, billing_frequency, billing_interval_days, currency
    )
    select v_invoice_id,
           (v->>'product_id')::uuid,
           coalesce((v->>'quantity')::int,1),
           coalesce((v->>'unit_price_minor')::bigint,0),
           nullif(v->>'discount_type',''),
           nullif(v->>'discount_value','')::bigint,
           0,
           null,
           null,
           coalesce(nullif(v->>'billing_type',''),'one_time'),
           nullif(v->>'billing_frequency',''),
           nullif(v->>'billing_interval_days','')::int,
           coalesce(nullif(v->>'currency',''),'USD')
    from jsonb_array_elements(p_payload->'line_items') as v;
  end if;

  -- log transition idempotently
  v_transition_id := public._create_transition_idem(
    p_lead_id,
    v_lead.subject_id,
    v_lead.owner_id,
    'status_change',
    v_lead.status,
    p_target_status,
    false,
    null,
    p_idempotency_key,
    jsonb_build_object('invoice_id', v_invoice_id)
  );

  -- update lead status (+value if won)
  update public.leads
    set status = p_target_status,
        value = case when p_target_status = 'won' then greatest(coalesce(value,0), (v_total_minor::numeric)/100.0) else value end,
        updated_at = now()
    where id = p_lead_id;

  return jsonb_build_object('invoice_id', v_invoice_id, 'transition_id', v_transition_id);
end;
$$ language plpgsql;


