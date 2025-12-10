import { describe, it, expect, vi, beforeEach, afterEach } from "vitest";

import { fetchCustomersApi } from "@/features/dashboard/pages/customers/hooks/use-customers";

describe("fetchCustomersApi (client-side customers fetch)", () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    (global as any).fetch = vi.fn(async () => {
      return {
        ok: true,
        json: async () => ({ data: [], count: 0 }),
      } as any;
    }) as any;
  });

  afterEach(() => {
    (global as any).fetch = originalFetch as any;
    vi.restoreAllMocks();
  });

  it("encodes pagination, filters, and sorting into query string and forwards AbortSignal", async () => {
    const controller = new AbortController();

    const pagination = { pageIndex: 1, pageSize: 20 };
    const filters = {
      status: "active" as const,
      search: "  Beta Co  ",
      dateRange: {
        from: new Date("2024-05-01T00:00:00Z"),
        to: new Date("2024-05-15T00:00:00Z"),
      },
    };
    const sorting = [{ id: "fullName", desc: false }];

    await fetchCustomersApi({
      pagination,
      filters,
      sorting,
      signal: controller.signal,
    });

    const mockFetch = global.fetch as any;
    expect(mockFetch).toHaveBeenCalledTimes(1);

    const [url, init] = mockFetch.mock.calls[0] as [string, RequestInit];

    expect(url).toContain("/api/customers?");
    expect(url).toContain("page=1");
    expect(url).toContain("pageSize=20");
    // search should be trimmed
    expect(url).toContain("search=Beta+Co");
    expect(url).toContain("status=active");
    expect(url).toContain(encodeURIComponent(filters.dateRange.from.toISOString()));
    expect(url).toContain(encodeURIComponent(filters.dateRange.to.toISOString()));
    // sorting field mapping
    expect(url).toContain("sort=full_name");
    expect(url).toContain("direction=asc");

    expect((init as any).signal).toBe(controller.signal);
  });
});
