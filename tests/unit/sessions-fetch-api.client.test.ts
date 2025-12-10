import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import {
  fetchSessionsApi,
  fetchSessionStatsApi,
  fetchSessionApi,
} from "@/features/dashboard/pages/sessions/overview/hooks/use-sessions";

describe("sessions API helpers (client-side fetch behaviour)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({}),
      } as any;
    }) as any;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch as any;
    vi.restoreAllMocks();
  });

  it("fetchSessionsApi encodes filters into query string and forwards AbortSignal", async () => {
    const controller = new AbortController();

    (global as any).fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({
          sessions: [],
          total: 0,
          page: 2,
          pageSize: 25,
          totalPages: 1,
        }),
      } as any;
    }) as any;

    const filters = {
      search: "Alpha",
      status: "active" as const,
      type: "call",
      dateFrom: "2024-01-01",
      dateTo: "2024-01-31",
    };

    await fetchSessionsApi(filters, 2, 25, "created_at", "asc", controller.signal);

    const mockFetch = global.fetch as any;
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toContain("/api/sessions?");
    expect(url).toContain("page=2");
    expect(url).toContain("pageSize=25");
    expect(url).toContain("sort=created_at");
    expect(url).toContain("direction=asc");
    expect(url).toContain("search=Alpha");
    expect(url).toContain("status=active");
    expect(url).toContain("type=call");
    expect(url).toContain("dateFrom=2024-01-01");
    expect(url).toContain("dateTo=2024-01-31");

    expect((init as any).signal).toBe(controller.signal);
  });

  it("fetchSessionStatsApi hits /api/sessions/stats and forwards AbortSignal", async () => {
    const controller = new AbortController();

    await fetchSessionStatsApi(controller.signal);

    const mockFetch = global.fetch as any;
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toContain("/api/sessions/stats");
    expect((init as any).signal).toBe(controller.signal);
  });

  it("fetchSessionApi hits /api/sessions/:id and forwards AbortSignal", async () => {
    const controller = new AbortController();

    await fetchSessionApi("session-123", controller.signal);

    const mockFetch = global.fetch as any;
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toContain("/api/sessions/session-123");
    expect((init as any).signal).toBe(controller.signal);
  });
});

