-- Revenue aggregation functions for reports
-- These functions aggregate recognized revenue by period for payment schedules, recurring revenue, and one-time invoices

-- Function to get payment schedule revenue grouped by period
CREATE OR REPLACE FUNCTION public.get_payment_schedule_revenue(
  user_id uuid,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  group_by text DEFAULT 'month'
)
RETURNS TABLE (
  period text,
  amount_minor bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  date_format text;
BEGIN
  -- Set date format based on group_by
  CASE group_by
    WHEN 'day' THEN date_format := 'YYYY-MM-DD';
    WHEN 'week' THEN date_format := 'YYYY-WW';
    WHEN 'month' THEN date_format := 'YYYY-MM';
    ELSE date_format := 'YYYY-MM';
  END CASE;

  RETURN QUERY
  SELECT
    to_char(ps.due_at_utc, date_format) as period,
    sum(ps.amount_minor)::bigint as amount_minor
  FROM
    invoice_payment_schedules ps
    JOIN invoices i ON ps.invoice_id = i.id
  WHERE
    i.owner_id = user_id
    AND (date_from IS NULL OR ps.due_at_utc >= date_from)
    AND (date_to IS NULL OR ps.due_at_utc <= date_to)
    AND ps.status IN ('pending', 'paid') -- Include both pending (accrued) and paid (recognized)
  GROUP BY
    to_char(ps.due_at_utc, date_format)
  ORDER BY
    period;
END;
$$;

-- Function to get recurring revenue grouped by period
CREATE OR REPLACE FUNCTION public.get_recurring_revenue(
  user_id uuid,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  group_by text DEFAULT 'month'
)
RETURNS TABLE (
  period text,
  amount_minor bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  date_format text;
BEGIN
  -- Set date format based on group_by
  CASE group_by
    WHEN 'day' THEN date_format := 'YYYY-MM-DD';
    WHEN 'week' THEN date_format := 'YYYY-WW';
    WHEN 'month' THEN date_format := 'YYYY-MM';
    ELSE date_format := 'YYYY-MM';
  END CASE;

  RETURN QUERY
  SELECT
    to_char(rr.billing_at_utc, date_format) as period,
    sum(rr.amount_minor)::bigint as amount_minor
  FROM
    recurring_revenue_schedules rr
    JOIN invoice_lines il ON rr.invoice_line_id = il.id
    JOIN invoices i ON il.invoice_id = i.id
  WHERE
    i.owner_id = user_id
    AND (date_from IS NULL OR rr.billing_at_utc >= date_from)
    AND (date_to IS NULL OR rr.billing_at_utc <= date_to)
    AND rr.status IN ('scheduled', 'billed') -- Include both scheduled (accrued) and billed (recognized)
  GROUP BY
    to_char(rr.billing_at_utc, date_format)
  ORDER BY
    period;
END;
$$;

-- Function to get one-time invoice revenue (immediate recognition)
CREATE OR REPLACE FUNCTION public.get_onetime_invoice_revenue(
  user_id uuid,
  date_from timestamptz DEFAULT NULL,
  date_to timestamptz DEFAULT NULL,
  group_by text DEFAULT 'month'
)
RETURNS TABLE (
  period text,
  amount_minor bigint
)
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = public
AS $$
DECLARE
  date_format text;
BEGIN
  -- Set date format based on group_by
  CASE group_by
    WHEN 'day' THEN date_format := 'YYYY-MM-DD';
    WHEN 'week' THEN date_format := 'YYYY-WW';
    WHEN 'month' THEN date_format := 'YYYY-MM';
    ELSE date_format := 'YYYY-MM';
  END CASE;

  RETURN QUERY
  -- One-time invoices: recognize revenue at invoice date, but only if no payment plans or recurring
  SELECT
    to_char(i.date, date_format) as period,
    sum(i.amount * 100)::bigint as amount_minor -- Convert major to minor units
  FROM
    invoices i
  WHERE
    i.owner_id = user_id
    AND i.status IN ('pending', 'paid', 'overdue') -- Don't include drafts or cancelled
    AND (date_from IS NULL OR i.date >= date_from)
    AND (date_to IS NULL OR i.date <= date_to)
    -- Exclude invoices that have payment schedules or recurring lines
    AND NOT EXISTS (
      SELECT 1 FROM invoice_payment_schedules ps WHERE ps.invoice_id = i.id
    )
    AND NOT EXISTS (
      SELECT 1 FROM invoice_lines il
      JOIN products p ON il.product_id = p.id
      WHERE il.invoice_id = i.id AND p.recurring_interval IS NOT NULL
    )
  GROUP BY
    to_char(i.date, date_format)
  ORDER BY
    period;
END;
$$;

-- Grant execute permissions to authenticated users
GRANT EXECUTE ON FUNCTION public.get_payment_schedule_revenue(uuid, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_recurring_revenue(uuid, timestamptz, timestamptz, text) TO authenticated;
GRANT EXECUTE ON FUNCTION public.get_onetime_invoice_revenue(uuid, timestamptz, timestamptz, text) TO authenticated;
