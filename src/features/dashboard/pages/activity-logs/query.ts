import { ActivityLog } from "./data/activity-logs-data";

export interface ActivityLogsQueryParams {
  filterType: "all" | ActivityLog["type"];
  sortOrder: "asc" | "desc";
  searchQuery: string;
}

export function buildActivityLogsQueryParams(params: ActivityLogsQueryParams) {
  const search = params.searchQuery?.trim();
  const qs = new URLSearchParams();

  if (search) qs.set("search", search);
  if (params.filterType && params.filterType !== "all") qs.set("type", params.filterType);
  qs.set("direction", params.sortOrder);

  return qs;
}

export function mapActivityLogEntries(rows: any[]): ActivityLog[] {
  return (rows || []).map((row) => ({
    id: row?.id || "",
    type: (row?.type || "user") as ActivityLog["type"],
    description: row?.description || "",
    user: row?.user || "",
    entity: row?.entity || undefined,
    timestamp: row?.timestamp || new Date(0).toISOString(),
    details: row?.details || undefined,
  }));
}

export async function fetchActivityLogs(params: ActivityLogsQueryParams): Promise<ActivityLog[]> {
  const qs = buildActivityLogsQueryParams(params);
  const res = await fetch(`/api/activity-logs?${qs.toString()}`);
  if (!res.ok) throw new Error("Failed to load activity logs");
  const result = await res.json();
  return mapActivityLogEntries(result?.data || []);
}
