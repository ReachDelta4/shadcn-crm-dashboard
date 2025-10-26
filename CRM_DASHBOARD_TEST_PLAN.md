npm# CRM Dashboard Integration & Test Plan

## Scope
- Lead lifecycle transitions across API, Kanban, calendar scheduling, and invoice creation.
- Revenue engine (pricing engine, payment schedules, recurring projections).
- Notification delivery RLS compliance and throttling.
- Calendar session scheduling flows (new/existing leads).

## Automated Test Coverage
- `pnpm vitest run`
  - `src/server/services/__tests__/pricing-engine.test.ts`: validates pricing calculations, payment plan schedules, recurring projections.
  - `src/features/leads/__tests__/status-normalization.test.ts`: canonical status validation, forward-only transitions, shared helpers.
  - `src/server/services/notifications/__tests__/notification-service.test.ts`: verifies injected Supabase client writes notifications under RLS.
  - Existing calendar normalizer and infrastructure helper suites continue to pass.
- `pnpm lint`: ensures TypeScript + ESLint health across affected modules.

## Manual Verification Matrix
| Area | Scenario | Steps | Expected Result |
| --- | --- | --- | --- |
| Lead List | Filter by status | Dashboard → Leads → set filters (all canonical statuses) | Table updates immediately; no blank results for `disqualified`/`converted` unless no data |
| Lead Transition Dialog | Schedule demo | From lead card, open “Schedule demo/appointment” | Appointment POST succeeds; lead status auto-advances to Qualified unless already Qualified/Disqualified/Converted; calendar refresh event fires |
| Lead Transition Dialog | Send invoice / Mark won | Choose “Invoice Sent” or “Mark as Won” | Invoice payload submits, lead status advances to correct canonical state, duplicate action prevented by idempotency key |
| Calendar Speed Dial | Existing lead booking | Dashboard → Sessions → Calendar → “New Session” → Existing tab | `/api/leads/:id/appointments` POST, status auto-advance to Qualified, conflicting slots blocked (409) |
| Calendar Speed Dial | New lead booking | Same as above but new tab | `/api/leads` creates lead, appointment scheduled, status advanced to Qualified, leads list refreshes |
| Invoice Wizard | Create invoice with payment plan | Build invoice with payment plan lines | Payment schedules generated (view via `/api/invoices/:id`), recurring projection absent for one-time plan |
| Invoice Wizard | Create recurring invoice | Use product with recurring interval | recurring_revenue_schedules populated for 12 months horizon (view via API/DB) |
| Notifications | Lead status change | Trigger transition from Kanban or API | Row in `public.notifications` with current user ID, throttle prevents duplicate spam |
| Authorization Middleware | Authenticated API call | With valid session, call `/api/leads` | Response 200 |
| Authorization Middleware | Unauthenticated API call | Without session cookie call `/api/leads` | 401 JSON, no redirect loop |

## Edge Cases & Race Conditions
- **Double scheduling**: Attempt to book overlapping appointment for same lead → server returns 409 and UI surfaces toast.
- **Status idempotency**: Re-post transition with same idempotency key → no duplicate history entry, API returns success.
- **Legacy status payloads**: Submit legacy status strings (`won`, `lost`, etc.) → Zod rejects with validation error.
- **Notification throttling**: Rapidly trigger same notification event → only first insert occurs; subsequent requests return silently.
- **Payment plan vs recurring conflict**: Payment plan on recurring product rejected by API guard with 400.
- **Concurrency on invoice creation**: Repeat POST with identical Idempotency-Key header → returns original invoice without duplicate payment schedules.
- **Middleware allowlist**: Device auth endpoints bypass redirect but other API routes enforce 401 JSON.

## Outstanding Risks / Follow-ups
- UI integration tests (Playwright/Cypress) recommended for full end-to-end browser validation.
- Consider adding Supabase emulator fixtures to automatically verify database side-effects (appointments, schedules, notifications).
- Monitor production telemetry for throttled notifications to adjust `notificationsThrottleMs` if legitimate events suppressed.
