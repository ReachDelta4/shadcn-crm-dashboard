export type NetworkProfile = {
  latencyMs: number;
  downloadKbps: number;
  uploadKbps: number;
};

export const NETWORK_PROFILES: Record<string, NetworkProfile> = {
  slow4g: {
    latencyMs: 180,
    downloadKbps: 1600,
    uploadKbps: 750,
  },
  wifi: {
    latencyMs: 30,
    downloadKbps: 20_000,
    uploadKbps: 10_000,
  },
};

export type PerfRoute = {
  id: string;
  path: string;
  waitForText?: string;
  components: string[];
  networkProfile?: keyof typeof NETWORK_PROFILES;
  settleAfterMs?: number;
  waitTimeoutMs?: number;
  budgets?: {
    lcpMs?: number;
    loadMs?: number;
    longTaskCount?: number;
    cls?: number;
  };
};

export const PERF_ROUTES: PerfRoute[] = [
  {
    id: "dashboard-overview",
    path: "/dashboard/overview",
    components: [
      "route:/dashboard/overview",
      "component:dashboard/layout",
      "component:dashboard/overview",
    ],
    networkProfile: "slow4g",
    settleAfterMs: 1800,
    waitTimeoutMs: 20000,
    budgets: {
      lcpMs: 4000,
      loadMs: 6000,
      longTaskCount: 12,
      cls: 0.12,
    },
  },
  {
    id: "dashboard-leads",
    path: "/dashboard/leads",
    components: ["route:/dashboard/leads", "component:dashboard/layout", "component:dashboard/leads"],
    networkProfile: "slow4g",
    settleAfterMs: 1500,
    waitTimeoutMs: 25000,
  },
  {
    id: "dashboard-reports",
    path: "/dashboard/reports",
    components: ["route:/dashboard/reports", "component:dashboard/layout"],
    networkProfile: "wifi",
    settleAfterMs: 800,
  },
  {
    id: "dashboard-sessions",
    path: "/dashboard/sessions",
    components: ["route:/dashboard/sessions", "component:dashboard/layout"],
    networkProfile: "wifi",
    settleAfterMs: 800,
  },
];
