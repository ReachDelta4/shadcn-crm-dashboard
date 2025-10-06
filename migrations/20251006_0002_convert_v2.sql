-- Conversion v2: allows specifying initial customer status (default 'pending')
BEGIN;

-- Ensure unique customers per owner + email (idempotent)
CREATE UNIQUE INDEX IF NOT EXISTS uq_customers_owner_email
ON public.customers (owner_id, lower(email))
WHERE email IS NOT NULL;

CREATE OR REPLACE FUNCTION public.convert_lead_to_customer_v2(
  lead_id uuid,
  initial_status text DEFAULT 'pending'
) RETURNS uuid
LANGUAGE plpgsql
AS $$
DECLARE
  v_lead RECORD;
  v_customer_id uuid;
  v_status text;
BEGIN
  -- Normalize initial status to allowed set
  v_status := CASE lower(coalesce(initial_status,'pending'))
                WHEN 'active' THEN 'active'
                WHEN 'inactive' THEN 'inactive'
                WHEN 'pending' THEN 'pending'
                WHEN 'churned' THEN 'churned'
                ELSE 'pending'
              END;

  -- Lock the lead row to avoid races
  SELECT l.* INTO v_lead
  FROM public.leads l
  WHERE l.id = lead_id
    AND l.owner_id = auth.uid()
  FOR UPDATE;

  IF NOT FOUND THEN
    RAISE EXCEPTION 'Lead not found or not accessible' USING ERRCODE = 'P0001';
  END IF;

  IF v_lead.email IS NULL OR length(trim(v_lead.email)) = 0 THEN
    RAISE EXCEPTION 'Lead email is required for conversion' USING ERRCODE = 'P0001';
  END IF;

  -- Try to find existing customer for this owner + email
  SELECT c.id INTO v_customer_id
  FROM public.customers c
  WHERE c.owner_id = auth.uid()
    AND lower(c.email) = lower(v_lead.email)
  LIMIT 1;

  -- Insert if missing (unique partial index ensures idempotency under concurrency)
  IF v_customer_id IS NULL THEN
    INSERT INTO public.customers (
      owner_id, full_name, email, company, status, customer_number
    ) VALUES (
      auth.uid(), v_lead.full_name, v_lead.email, v_lead.company, v_status,
      'CUST-' || floor(extract(epoch from now())*1000)::bigint::text
    ) RETURNING id INTO v_customer_id;
  END IF;

  -- Update lead status if needed
  IF v_lead.status IS DISTINCT FROM 'converted' THEN
    UPDATE public.leads
    SET status = 'converted'
    WHERE id = v_lead.id
      AND owner_id = auth.uid();
  END IF;

  RETURN v_customer_id;
END;
$$;

COMMIT;


