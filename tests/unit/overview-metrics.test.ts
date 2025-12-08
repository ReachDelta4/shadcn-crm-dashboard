import { describe, expect, it } from "vitest";
import { computeOverviewSummary } from "@/features/dashboard/pages/overview/query";
import type { RevenueKpis } from "@/features/dashboard/pages/reports/revenue/query";
import type { ActivityLog } from "@/features/dashboard/pages/activity-logs/data/activity-logs-data";

const baseKpis: RevenueKpis = {
  realized_total_minor: 0,
  realized_net_revenue_minor: 0,
  realized_tax_minor: 0,
  pending_total_minor: 0,
  pending_net_revenue_minor: 0,
  pending_tax_minor: 0,
  draft_total_minor: 0,
  lead_potential_minor: 0,
  gross_profit_minor: 0,
  gross_margin_percent: 0,
};

function makeActivity(id: string): ActivityLog {
  return {
    id,
    type: "user",
    description: `Activity ${id}`,
    user: "Tester",
    timestamp: new Date().toISOString(),
  };
}

describe("computeOverviewSummary", () => {
  it("computes conversion and retention rates from raw counts", () => {
    const summary = computeOverviewSummary({
      leads: [
        { status: "new" },
        { status: "qualified" },
        { status: "converted" },
        { status: "converted" },
      ],
      revenueKpis: {
        ...baseKpis,
        realized_total_minor: 100_000,
        gross_profit_minor: 60_000,
      },
      customerCounts: {
        active: 8,
        churned: 2,
        total: 10,
      },
      recentActivity: [],
    });

    expect(summary.metrics.totalLeads).toBe(4);
    expect(summary.metrics.totalCustomers).toBe(10);

    expect(summary.metrics.leadConversionRatePercent).toBeCloseTo(50);
    expect(summary.metrics.customerRetentionRatePercent).toBeCloseTo(80);

    // Realized = 1000.00, COGS = 400.00, customers = 10
    expect(summary.metrics.customerLifetimeValueMinor).toBe(10_000);
    expect(summary.metrics.customerAcquisitionCostMinor).toBe(4_000);
  });

  it("builds stage and source breakdowns with safe defaults", () => {
    const summary = computeOverviewSummary({
      leads: [
        { status: "new", source: "Website" },
        { status: "qualified", source: "website" },
        { status: "disqualified", source: "Referral" },
        { status: "converted", source: "" },
      ],
      revenueKpis: baseKpis,
      customerCounts: { active: 0, churned: 0, total: 0 },
      recentActivity: [],
    });

    const newStage = summary.stages.find((s) => s.status === "new")!;
    const qualifiedStage = summary.stages.find((s) => s.status === "qualified")!;

    expect(newStage.count).toBe(1);
    expect(qualifiedStage.count).toBe(1);

    const websiteSource = summary.leadSources.find((s) => s.source === "website")!;
    const referralSource = summary.leadSources.find((s) => s.source === "referral")!;
    const unknownSource = summary.leadSources.find((s) => s.source === "unknown")!;

    expect(websiteSource.count).toBe(2);
    expect(referralSource.count).toBe(1);
    expect(unknownSource.count).toBe(1);

    const total = websiteSource.count + referralSource.count + unknownSource.count;
    expect(total).toBe(4);

    expect(websiteSource.percentage).toBeCloseTo((2 * 100) / 4);
  });

  it("limits recent activity to top four items", () => {
    const logs: ActivityLog[] = [
      makeActivity("1"),
      makeActivity("2"),
      makeActivity("3"),
      makeActivity("4"),
      makeActivity("5"),
    ];

    const summary = computeOverviewSummary({
      leads: [],
      revenueKpis: baseKpis,
      customerCounts: { active: 0, churned: 0, total: 0 },
      recentActivity: logs,
    });

    expect(summary.recentActivity.length).toBe(4);
    expect(summary.recentActivity.map((a) => a.id)).toEqual(["1", "2", "3", "4"]);
  });

  it("handles empty inputs without NaN or division by zero", () => {
    const summary = computeOverviewSummary({
      leads: [],
      revenueKpis: baseKpis,
      customerCounts: { active: 0, churned: 0, total: 0 },
      recentActivity: [],
    });

    expect(summary.metrics.totalLeads).toBe(0);
    expect(summary.metrics.totalCustomers).toBe(0);
    expect(summary.metrics.customerLifetimeValueMinor).toBe(0);
    expect(summary.metrics.customerAcquisitionCostMinor).toBe(0);
    expect(summary.metrics.leadConversionRatePercent).toBe(0);
    expect(summary.metrics.customerRetentionRatePercent).toBe(0);
  });
});
