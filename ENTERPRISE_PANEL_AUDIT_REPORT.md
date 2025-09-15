
## Sessions UI Additions (UI-only)

- Navigation: Added `Sessions` group with Overview, All Sessions, Calendar, Reports, Bulk Reports
- Routes:
  - `/dashboard/sessions` (overview)
  - `/dashboard/sessions/all` (list)
  - `/dashboard/sessions/calendar` (calendar)
  - `/dashboard/sessions/reports` (reports hub)
  - `/dashboard/sessions/bulk-reports` (bulk reports)
  - `/dashboard/sessions/[id]` (session detail)
- Components:
  - Global QuickActionsDock (shadcn Dock-inspired) mounted in dashboard layout
  - Session Detail: Outline, Tabs (Transcript, Report, Artifacts, QA), right AI chat sheet
  - Report Viewer: 10 pages, page 2 chart placeholder, Export button (print), outline links
  - List + Filters placeholders, Calendar mock, Bulk reports progress list

## Backend TODOs (future)

- Sessions storage and indexing (metadata, speakers, timestamps)
- Transcript ingestion and search (chunking, embeddings if needed)
- Report generation service (per session, bulk with presets and custom ranges)
- Progress/job system for long-running report generation
- Calendar feed (aggregate sessions), ICS import/export (optional)
- AI chat context provider (secure retrieval from transcripts/reports)
- Share/export endpoints (PDF export, share links with auth)
- RBAC for sessions/reports (owner/team scopes)

