## CRM Dashboard - E2E Findings (2025-10-07)

Environment
- App: http://localhost:3000 (Next 15.2.2)
- Auth user: dikshith2004@gmail.com
- DB: Supabase (project hewpwluinbwaizwqhmjc)

Test Data Created
- Product: "E2E Product A" (₹5,000, tax 18%)
- Leads: "UI Lead A", "UI Lead B"; converted "UI Lead A" to customer via row menu
- Invoice: Marked existing invoice INV-1759830059409 as Paid (Amount ₹5,310.00)

Issues Found
1) Customers page shows no results after conversion and payment
   - Steps: Convert "UI Lead A" to customer → open Customers → default filters.
   - Expected: Converted customer visible; paid customer should be Active after invoice paid.
   - Actual: "No customers found" (0 rows).
   - Logs: GET /api/customers … 200 with 0 rows.
   - Suspected: Owner scoping/RLS mismatch or conversion row not created/visible; also invoice → customer activation best-effort may not match `owner_id`.
   - Impact: High (cannot verify customer lifecycle from UI).

2) New Invoice modal: validation error "Expected string, received null"
   - Steps: New Invoice → fill Customer + Email → select Lead (UI Lead B) → select Product → Create.
   - Actual: Alert shows "Expected string, received null"; modal stays open; invoice not listed.
   - Suspected: UI sends `null` for optional string (e.g., `lead_id`) where API expects undefined (`z.string().uuid().optional()` rejects null). Also possible other string fields sent as null.
   - Impact: High (blocks invoice creation via modal in some cases).

3) Paid Invoices page lacks listing
   - Steps: Mark an invoice as Paid → open Paid tab.
   - Expected: Table of paid invoices.
   - Actual: Only header/intro; no table content rendered.
   - Impact: Medium (cannot audit paid items from the dedicated view).

4) Revenue API returns 400 without date range, then succeeds with range
   - Logs (server):
     - GET /api/reports/revenue?groupBy=month → 400 (twice)
     - GET /api/reports/revenue?groupBy=month&from=…&to=… → 200
   - Expected: No-range request should succeed (from/to are optional per code) with a default window.
   - Impact: Medium (first load error before date picker sets range).

5) Revenue engine ignores COGS when invoices have no lines; gross margin shows 100%
   - Observed: Realized ₹5,310.00; Gross Profit ₹5,310.00; Gross Margin 100%.
   - Context: COGS computed from `invoice_lines`; legacy invoices without lines yield zero COGS.
   - Impact: Low/Medium (data accuracy depends on invoice-lines adoption).

6) Missing paid_at semantics; revenue groups by invoice `date`
   - Code: No `paid_at` column; status changes to paid do not timestamp; revenue groups by `invoices.date`.
   - Impact: Medium (inaccurate realized timing; cannot audit payment timestamps).

7) UI a11y/state warnings in modals
   - Product/Invoice modals:
     - Missing `Description`/`aria-describedby` for DialogContent.
     - Select changing controlled↔uncontrolled warnings.
   - Impact: Low, but indicates state handling/accessibility gaps.

8) Percent formatting for product COGS/discount in list is wrong
   - Observed: "COGS 2000% · Discount 1000%" where values are basis points (20%, 10%).
   - Impact: Low (misleading display).

9) Inconsistent nav user identity across pages
   - Observed: Some pages show nav user as "James", others correctly show "dikshith2004".
   - Impact: Low/Medium (confusing; likely SSR/placeholder fallback).

Validated Behaviors
- Lead creation, search, and conversion via row menu work (POST /api/leads/…/convert 200).
- Revenue page renders metrics once date range is set; groupBy and presets functionally work.
- Mark-as-Paid from invoice row menu updates status; Paid tab route loads (but no list).

Recommendations (next steps)
- Customers visibility: verify `customers.owner_id` for converted rows; ensure convert RPC uses `auth.uid()` (it does); add audit logs; relax filters to `allowedOwnerIds` when applicable.
- Invoice modal: ensure UI omits fields rather than sending `null`; accept `null` in API where safe (e.g., `.nullable().optional()` for `lead_id`), and validate before insert.
- Paid view: render table with paid invoices and pagination; reuse All Invoices table component with `status=paid` filter.
- Revenue: allow empty from/to by defaulting to last 30 days server-side; consider grouping realized revenue by `paid_at` when present.
- Add `paid_at` column and set on status transition to paid; use `paid_at` in analytics.
- Fix percent display to convert bp → %; add unit labels consistently.
- Address a11y/state warnings (Dialog `aria-describedby`, controlled Selects).
- Nav user: unify session sourcing for the sidebar user component.

Server Console (excerpt)
```
GET /api/reports/revenue?groupBy=month 400
GET /api/reports/revenue?groupBy=month&from=…&to=… 200
PATCH /api/invoices/:id 200 (Mark as Paid)
GET /api/customers … 200 (0 rows)
```

Artifacts
- Paid invoice observed: INV-1759830059409 (₹5,310.00)
- Revenue KPI (month): Total ₹5,310.00; Pending ₹0; Draft ₹0; Potential ₹45,688.00


