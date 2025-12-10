# Performance E2E Harness (Playwright + Lighthouse)

## What this does
- Captures route/component perf marks (`window.__perfState__.events`) and resource timing.
- Enforces basic budgets (LCP, load, CLS, long tasks) per route.
- Emits HAR + trace + JSON attachments for post-run analysis.

## How to run (local, free)
```bash
# Terminal 1: start dev server (or rely on Playwright webServer config)
pnpm dev

# Terminal 2: run perf suite (requires E2E_DASHBOARD=1)
set E2E_DASHBOARD=1 && pnpm run test:perf   # Windows
E2E_DASHBOARD=1 pnpm run test:perf           # macOS/Linux
```

Outputs land in `playwright-report/` and per-test `test-results/` (trace.zip, HAR, JSON attachments).

## Lighthouse (optional, also free)
```bash
pnpm run perf:lhci
```
- Uses `lighthouserc.js` + `lighthouse.budgets.json`.
- Stores reports in `./lhci-reports/`.

## Bundle analysis
```bash
pnpm run analyze:bundle
```
- Generates `./lhci-reports/bundle.html` from `.next/static/chunks/*.js`.

## Notes
- Perf marks are gated behind `NEXT_PUBLIC_PERF_MARKS=1` or `window.__PERF_ENABLE__ = true` (Playwright sets this automatically).
- Default budgets are conservative; adjust in `tests/e2e/perf/perf-manifest.ts` and `lighthouse.budgets.json`.
