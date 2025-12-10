import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { fetchActivityLogs } from "@/features/dashboard/pages/activity-logs/query";

describe("fetchActivityLogs (client-side activity logs fetch)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ data: [] }),
      } as any;
    }) as any;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch as any;
    vi.restoreAllMocks();
  });

  it("calls /api/activity-logs with encoded query params and forwards AbortSignal", async () => {
    const controller = new AbortController();

    await fetchActivityLogs(
      {
        filterType: "lead",
        sortOrder: "asc",
        searchQuery: "  Alpha  ",
      },
      controller.signal,
    );

    const mockFetch = global.fetch as any;
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toContain("/api/activity-logs?");
    expect(url).toContain("direction=asc");
    expect(url).toContain("type=lead");
    // search should be trimmed
    expect(url).toContain("search=Alpha");

    expect((init as any).signal).toBe(controller.signal);
  });
});

