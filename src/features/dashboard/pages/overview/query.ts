import type { ActivityLog } from "@/features/dashboard/pages/activity-logs/data/activity-logs-data";
import type { RevenueKpis } from "@/features/dashboard/pages/reports/revenue/query";
import type { LeadStatus } from "@/features/dashboard/pages/leads/types/lead";

export type OverviewStageKey = LeadStatus;

export interface OverviewMetrics {
  customerAcquisitionCostMinor: number;
  customerLifetimeValueMinor: number;
  customerRetentionRatePercent: number;
  leadConversionRatePercent: number;
  totalLeads: number;
  totalCustomers: number;
}

export interface OverviewStageBreakdownItem {
  status: OverviewStageKey;
  label: string;
  count: number;
  percentage: number;
}

export interface OverviewLeadSourceItem {
  source: string;
  count: number;
  percentage: number;
}

export interface OverviewSummary {
  metrics: OverviewMetrics;
  stages: OverviewStageBreakdownItem[];
  leadSources: OverviewLeadSourceItem[];
  recentActivity: ActivityLog[];
}

export interface OverviewInput {
  leads: Array<{ status?: string | null; source?: string | null }>;
  revenueKpis: RevenueKpis;
  customerCounts: {
    active: number;
    churned: number;
    total: number;
  };
  recentActivity: ActivityLog[];
}

const STAGE_LABELS: Record<OverviewStageKey, string> = {
  new: "New",
  contacted: "Contacted",
  qualified: "Qualified",
  disqualified: "Disqualified",
  converted: "Converted",
};

export function computeOverviewSummary(input: OverviewInput): OverviewSummary {
  const { leads, revenueKpis, customerCounts, recentActivity } = input;

  const totalLeads = leads.length;

  const stageCounts: Record<OverviewStageKey, number> = {
    new: 0,
    contacted: 0,
    qualified: 0,
    disqualified: 0,
    converted: 0,
  };

  const sourceCounts = new Map<string, number>();

  let convertedCount = 0;

  for (const raw of leads) {
    const status = (raw.status || "new") as OverviewStageKey;
    if (status in stageCounts) {
      stageCounts[status] += 1;
    }
    if (status === "converted") {
      convertedCount += 1;
    }
    const sourceKey =
      (raw.source || "unknown").toString().trim().toLowerCase() || "unknown";
    sourceCounts.set(sourceKey, (sourceCounts.get(sourceKey) || 0) + 1);
  }

  const stages: OverviewStageBreakdownItem[] = (Object.keys(
    stageCounts,
  ) as OverviewStageKey[]).map((status) => {
    const count = stageCounts[status];
    const percentage = totalLeads > 0 ? (count * 100) / totalLeads : 0;
    return {
      status,
      label: STAGE_LABELS[status],
      count,
      percentage,
    };
  });

  const totalBySource = Array.from(sourceCounts.values()).reduce(
    (sum, v) => sum + v,
    0,
  );
  const leadSources: OverviewLeadSourceItem[] = Array.from(
    sourceCounts.entries(),
  )
    .map(([source, count]) => ({
      source,
      count,
      percentage: totalBySource > 0 ? (count * 100) / totalBySource : 0,
    }))
    .sort((a, b) => b.count - a.count);

  const baseCustomerTotal =
    customerCounts.total > 0
      ? customerCounts.total
      : customerCounts.active + customerCounts.churned;

  const realizedGross = revenueKpis.realized_total_minor || 0;
  const realizedTax = revenueKpis.realized_tax_minor || 0;
  const realizedNet = Math.max(0, realizedGross - realizedTax);
  const grossProfit = revenueKpis.gross_profit_minor || 0;
  const cogsMinor = Math.max(0, realizedNet - grossProfit);

  const safeCustomerTotal = baseCustomerTotal > 0 ? baseCustomerTotal : 1;

  const customerLifetimeValueMinor = Math.floor(
    realizedNet / safeCustomerTotal,
  );

  const customerAcquisitionCostMinor = Math.floor(
    cogsMinor / safeCustomerTotal,
  );

  const baseRetentionDenominator =
    customerCounts.active + customerCounts.churned;

  const customerRetentionRatePercent =
    baseRetentionDenominator > 0
      ? (customerCounts.active * 100) / baseRetentionDenominator
      : 0;

  const leadConversionRatePercent =
    totalLeads > 0 ? (convertedCount * 100) / totalLeads : 0;

  const metrics: OverviewMetrics = {
    customerAcquisitionCostMinor,
    customerLifetimeValueMinor,
    customerRetentionRatePercent,
    leadConversionRatePercent,
    totalLeads,
    totalCustomers: baseCustomerTotal,
  };

  const recent = recentActivity.slice(0, 4);

  return {
    metrics,
    stages,
    leadSources,
    recentActivity: recent,
  };
}
