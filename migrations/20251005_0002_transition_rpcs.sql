-- Transactional RPCs for lifecycle transitions
-- Note: rely on RLS (auth context) for ownership; no SECURITY DEFINER

-- Create a helper to upsert transition idempotently
create or replace function public._create_transition_idem(
  p_lead_id uuid,
  p_subject_id uuid,
  p_actor_id uuid,
  p_event_type text,
  p_status_from text,
  p_status_to text,
  p_override boolean,
  p_override_reason text,
  p_idempotency_key text,
  p_metadata jsonb
) returns uuid as $$
declare
  v_id uuid;
begin
  if p_idempotency_key is not null then
    -- try find existing by idempotency
    select id into v_id from public.lead_status_transitions where idempotency_key = p_idempotency_key;
    if v_id is not null then
      return v_id;
    end if;
  end if;

  insert into public.lead_status_transitions(
    lead_id, subject_id, actor_id, event_type, status_from, status_to,
    override_flag, override_reason, idempotency_key, metadata
  ) values (
    p_lead_id, p_subject_id, p_actor_id, coalesce(p_event_type,'status_change'), p_status_from, p_status_to,
    coalesce(p_override,false), p_override_reason, p_idempotency_key, p_metadata
  ) returning id into v_id;

  return v_id;
exception when unique_violation then
  -- idempotency unique index hit; fetch existing
  select id into v_id from public.lead_status_transitions where idempotency_key = p_idempotency_key;
  return v_id;
end;
$$ language plpgsql;

-- Appointment transition: create appointment, log transition, update lead, enqueue outcome eval
create or replace function public.fn_transition_with_appointment(
  p_lead_id uuid,
  p_target_status text,
  p_payload jsonb,
  p_idempotency_key text
) returns jsonb as $$
declare
  v_lead record;
  v_appt_id uuid;
  v_transition_id uuid;
  v_start timestamptz;
  v_end timestamptz;
  v_timezone text;
  v_provider text;
  v_meeting_link text;
  v_notes jsonb;
begin
  -- basic validation
  if p_target_status is distinct from 'demo_appointment' then
    raise exception 'invalid target_status for appointment transition' using errcode = '22023';
  end if;

  select * into v_lead from public.leads where id = p_lead_id and deleted_at is null;
  if not found then
    raise exception 'lead not found' using errcode = 'P0002';
  end if;

  -- extract payload
  v_start := (p_payload->>'start_at_utc')::timestamptz;
  v_end := (p_payload->>'end_at_utc')::timestamptz;
  v_timezone := coalesce(p_payload->>'timezone','UTC');
  v_provider := coalesce(p_payload->>'provider','none');
  v_meeting_link := nullif(p_payload->>'meeting_link','');
  v_notes := p_payload->'notes';

  if v_start is null or v_end is null or v_end < v_start then
    raise exception 'invalid appointment time range' using errcode = '22007';
  end if;

  -- insert appointment (EXCLUDE constraint prevents overlap for scheduled)
  insert into public.lead_appointments(
    lead_id, subject_id, provider, status, start_at_utc, end_at_utc, timezone, provider_event_id, meeting_link, notes
  ) values (
    p_lead_id, v_lead.subject_id, v_provider, 'scheduled', v_start, v_end, v_timezone, null, v_meeting_link, v_notes
  ) returning id into v_appt_id;

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
    jsonb_build_object('appointment_id', v_appt_id)
  );

  -- update lead status
  update public.leads set status = p_target_status, updated_at = now() where id = p_lead_id;

  -- enqueue outbox job for outcome evaluation (5 minutes after end)
  insert into public.outbox_jobs(job_type, payload, status, attempts, next_run_at)
  values ('appointment_outcome_eval', jsonb_build_object('appointment_id', v_appt_id), 'pending', 0, v_end + interval '5 minutes');

  return jsonb_build_object('appointment_id', v_appt_id, 'transition_id', v_transition_id);
exception when unique_violation then
  -- overlap constraint or idempotency: best-effort fetch appointment by identical window
  select id into v_appt_id from public.lead_appointments where lead_id = p_lead_id and start_at_utc = v_start and end_at_utc = v_end limit 1;
  if v_appt_id is null then
    raise;
  end if;
  v_transition_id := (select id from public.lead_status_transitions where idempotency_key = p_idempotency_key limit 1);
  return jsonb_build_object('appointment_id', v_appt_id, 'transition_id', v_transition_id);
end;
$$ language plpgsql;

-- Invoice transition: create invoice + lines (expects normalized monetary minor units), update lead status/value, log transition
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

  insert into public.invoices(
    owner_id, customer_name, email, amount, status, date, due_date, items, lead_id, subject_id
  ) values (
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


