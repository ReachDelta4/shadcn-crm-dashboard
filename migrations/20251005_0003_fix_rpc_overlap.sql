-- Improve appointment RPC to pre-check overlaps and provide clearer errors
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
  v_overlap_count int := 0;
begin
  if p_target_status is distinct from 'demo_appointment' then
    raise exception 'invalid target_status for appointment transition' using errcode = '22023';
  end if;

  select * into v_lead from public.leads where id = p_lead_id and deleted_at is null;
  if not found then
    raise exception 'lead not found' using errcode = 'P0002';
  end if;

  v_start := (p_payload->>'start_at_utc')::timestamptz;
  v_end := (p_payload->>'end_at_utc')::timestamptz;
  v_timezone := coalesce(p_payload->>'timezone','UTC');
  v_provider := coalesce(p_payload->>'provider','none');
  v_meeting_link := nullif(p_payload->>'meeting_link','');
  v_notes := p_payload->'notes';

  if v_start is null or v_end is null or v_end <= v_start then
    raise exception 'invalid appointment time range' using errcode = '22007';
  end if;

  -- Idempotency: return existing transition if present
  if p_idempotency_key is not null then
    select id into v_transition_id from public.lead_status_transitions where idempotency_key = p_idempotency_key;
    if v_transition_id is not null then
      select id into v_appt_id from public.lead_appointments where lead_id = p_lead_id and start_at_utc = v_start and end_at_utc = v_end limit 1;
      return jsonb_build_object('appointment_id', v_appt_id, 'transition_id', v_transition_id);
    end if;
  end if;

  -- Pre-check overlap to avoid constraint exceptions
  select count(*) into v_overlap_count
  from public.lead_appointments a
  where a.lead_id = p_lead_id
    and a.status = 'scheduled'
    and tstzrange(a.start_at_utc, a.end_at_utc, '[]') && tstzrange(v_start, v_end, '[]');

  if v_overlap_count > 0 then
    raise exception 'overlapping_appointment' using errcode = '23505';
  end if;

  insert into public.lead_appointments(
    lead_id, subject_id, provider, status, start_at_utc, end_at_utc, timezone, provider_event_id, meeting_link, notes
  ) values (
    p_lead_id, v_lead.subject_id, v_provider, 'scheduled', v_start, v_end, v_timezone, null, v_meeting_link, v_notes
  ) returning id into v_appt_id;

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

  update public.leads set status = p_target_status, updated_at = now() where id = p_lead_id;

  insert into public.outbox_jobs(job_type, payload, status, attempts, next_run_at)
  values ('appointment_outcome_eval', jsonb_build_object('appointment_id', v_appt_id), 'pending', 0, v_end + interval '5 minutes');

  return jsonb_build_object('appointment_id', v_appt_id, 'transition_id', v_transition_id);
exception when unique_violation then
  -- treat as overlap
  raise exception 'overlapping_appointment' using errcode = '23505';
end;
$$ language plpgsql;


