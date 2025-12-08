import { describe, expect, it } from "vitest";
import {
  buildRevenueQueryParams,
  normalizeRevenueResponse,
} from "@/features/dashboard/pages/reports/revenue/query";

describe("revenue report query helpers", () => {
  it("buildRevenueQueryParams encodes groupBy and optional date range", () => {
    const params = buildRevenueQueryParams({
      groupBy: "week",
      from: new Date("2024-03-01T00:00:00Z"),
      to: new Date("2024-03-15T00:00:00Z"),
    });

    expect(params.get("groupBy")).toBe("week");
    expect(params.get("from")).toBe("2024-03-01T00:00:00.000Z");
    expect(params.get("to")).toBe("2024-03-15T00:00:00.000Z");
  });

  it("normalizeRevenueResponse fills kpi defaults and preserves revenue rows", () => {
    const normalized = normalizeRevenueResponse({
      revenue: [{ period: "Mar", total_revenue_minor: 1200 }],
      pending_total_minor: 50,
      pending_net_revenue_minor: 40,
      pending_tax_minor: 10,
    });

    expect(normalized.revenue).toEqual([{ period: "Mar", total_revenue_minor: 1200 }]);
    expect(normalized.kpis).toMatchObject({
      realized_total_minor: 0,
      realized_net_revenue_minor: 0,
      realized_tax_minor: 0,
      pending_total_minor: 50,
      pending_net_revenue_minor: 40,
      pending_tax_minor: 10,
      draft_total_minor: 0,
      lead_potential_minor: 0,
      gross_profit_minor: 0,
      gross_margin_percent: 0,
    });
  });
});
