import { expect, test, type Page } from "@playwright/test";
import { loginViaAuthApi } from "../utils/supabase-test-helper";
import { NETWORK_PROFILES, PERF_ROUTES } from "./perf-manifest";

const RUN_E2E_DASHBOARD = process.env.E2E_DASHBOARD === "1";
const BASE_URL =
  process.env.CRM_BASE_URL ||
  process.env.PLAYWRIGHT_BASE_URL ||
  "http://localhost:3000";
const PERF_USER_EMAIL = process.env.PERF_USER_EMAIL;
const PERF_USER_PASSWORD = process.env.PERF_USER_PASSWORD;

const DEFAULT_BUDGETS = {
  lcpMs: 4500,
  loadMs: 6500,
  longTaskCount: 15,
  cls: 0.15,
};

test.describe.configure({ timeout: 90_000 });

async function waitForServer(page: Page, timeoutMs = 20000) {
  const start = Date.now();
  let lastError: unknown;
  while (Date.now() - start < timeoutMs) {
    try {
      const res = await page.request.get("/api/health");
      if (res.ok() || res.status() >= 200) return;
    } catch (err) {
      lastError = err;
    }
    await page.waitForTimeout(500);
  }
  throw new Error(`Server not reachable after ${timeoutMs}ms: ${String(lastError)}`);
}

function kbpsToBytesPerSecond(kbps: number) {
  return (kbps * 1024) / 8;
}

test.describe("Performance smoke (Playwright + perf marks)", () => {
  test.skip(
    !RUN_E2E_DASHBOARD,
    "Set E2E_DASHBOARD=1 to run dashboard E2E perf suite",
  );

  for (const route of PERF_ROUTES) {
    test(`perf:${route.id}`, async ({ browser }) => {
      if (!PERF_USER_EMAIL || !PERF_USER_PASSWORD) {
        throw new Error("PERF_USER_EMAIL and PERF_USER_PASSWORD must be set for perf suite");
      }

      const harPath = test.info().outputPath(`har-${route.id}.har`);
      const tracePath = test.info().outputPath(`trace-${route.id}.zip`);

      const context = await browser.newContext({
        baseURL: BASE_URL,
        recordHar: { path: harPath, omitRequestData: false },
        viewport: { width: 1366, height: 768 },
      });

      const page = await context.newPage();

      // Enable client-side perf marks for this run.
      await page.addInitScript(() => {
        (window as any).__PERF_ENABLE__ = true;
      });

      await waitForServer(page);

      // Authenticate once per test before navigation.
      await loginViaAuthApi(page, PERF_USER_EMAIL, PERF_USER_PASSWORD);

      const client = await context.newCDPSession(page);
      const profile = route.networkProfile
        ? NETWORK_PROFILES[route.networkProfile]
        : undefined;
      if (profile) {
        await client.send("Network.enable");
        await client.send("Network.emulateNetworkConditions", {
          offline: false,
          latency: profile.latencyMs,
          downloadThroughput: kbpsToBytesPerSecond(profile.downloadKbps),
          uploadThroughput: kbpsToBytesPerSecond(profile.uploadKbps),
        });
      }

      await context.tracing.start({
        screenshots: true,
        snapshots: true,
        title: route.id,
      });

      const response = await page.goto(route.path, { waitUntil: "load" });
      expect(response?.ok()).toBeTruthy();

      if (route.waitForText) {
        await expect(
          page.getByText(new RegExp(route.waitForText, "i")),
        ).toBeVisible({ timeout: route.waitTimeoutMs ?? 15_000 });
      }

      await page.waitForTimeout(route.settleAfterMs ?? 1000);

      const payload = await page.evaluate(() => {
        const nav = performance.getEntriesByType("navigation")[0] as
          | PerformanceNavigationTiming
          | undefined;
        const lcpEntry = (performance.getEntriesByType(
          "largest-contentful-paint",
        ) as any[]).pop();
        const clsEntries = performance.getEntriesByType(
          "layout-shift",
        ) as any[];
        const longTasks = (performance.getEntriesByType("longtask") as any[]) || [];

        const cls = (clsEntries || [])
          .filter((entry: any) => !entry.hadRecentInput)
          .reduce((sum: number, entry: any) => sum + (entry.value || 0), 0);

        return {
          perfEvents: (window as any).__perfState__?.events ?? [],
          navigation: nav
            ? {
                ttfb: nav.responseStart,
                domContentLoaded: nav.domContentLoadedEventEnd,
                load: nav.loadEventEnd,
              }
            : null,
          lcpMs: lcpEntry
            ? Math.max(
                Number(lcpEntry.renderTime || 0),
                Number(lcpEntry.startTime || 0),
              )
            : null,
          cls,
          longTasks: longTasks.map((task: any) => ({
            name: task.name,
            startTime: task.startTime,
            duration: task.duration,
          })),
          resources: performance.getEntriesByType("resource").map((r) => ({
            name: r.name,
            initiatorType: (r as any).initiatorType,
            transferSize: (r as any).transferSize ?? 0,
            encodedBodySize: (r as any).encodedBodySize ?? 0,
            duration: r.duration,
          })),
        };
      });

      await context.tracing.stop({ path: tracePath });
      await context.close();

      await test.info().attach("timings.json", {
        body: JSON.stringify(
          {
            routeId: route.id,
            path: route.path,
            networkProfile: route.networkProfile,
            lcpMs: payload.lcpMs,
            navigation: payload.navigation,
            cls: payload.cls,
            longTaskCount: payload.longTasks.length,
          },
          null,
          2,
        ),
        contentType: "application/json",
      });
      await test.info().attach("perf-events.json", {
        body: JSON.stringify(payload.perfEvents, null, 2),
        contentType: "application/json",
      });
      await test.info().attach("resources.json", {
        body: JSON.stringify(payload.resources, null, 2),
        contentType: "application/json",
      });

      const budgets = {
        ...DEFAULT_BUDGETS,
        ...route.budgets,
      };
      const slowestResources = [...payload.resources]
        .sort((a, b) => b.duration - a.duration)
        .slice(0, 10);

      const missingComponents = route.components.filter(
        (name) =>
          !payload.perfEvents.some(
            (evt: any) =>
              evt.name === name && (evt.phase === "ready" || evt.phase === "mark"),
          ),
      );
      expect(
        missingComponents,
        `Missing perf marks for ${missingComponents.join(", ")}`,
      ).toEqual([]);

      if (payload.lcpMs) {
        expect(payload.lcpMs).toBeLessThanOrEqual(budgets.lcpMs);
      }
      if (payload.navigation?.load) {
        expect(payload.navigation.load).toBeLessThanOrEqual(budgets.loadMs);
      }
      expect(payload.cls).toBeLessThanOrEqual(budgets.cls);

      const longTaskCount = payload.longTasks.length;
      expect(longTaskCount).toBeLessThanOrEqual(budgets.longTaskCount);
      await test.info().attach("slowest-resources.json", {
        body: JSON.stringify(slowestResources, null, 2),
        contentType: "application/json",
      });
    });
  }
});
