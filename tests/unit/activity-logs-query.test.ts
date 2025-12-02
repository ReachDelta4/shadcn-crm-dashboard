import { describe, expect, it } from "vitest";
import {
  buildActivityLogsQueryParams,
  mapActivityLogEntries,
} from "@/features/dashboard/pages/activity-logs/query";

describe("activity logs query helpers", () => {
  it("buildActivityLogsQueryParams encodes search, type, and direction", () => {
    const params = buildActivityLogsQueryParams({
      filterType: "lead",
      sortOrder: "asc",
      searchQuery: "Alpha  ",
    });

    expect(params.get("search")).toBe("Alpha");
    expect(params.get("type")).toBe("lead");
    expect(params.get("direction")).toBe("asc");
  });

  it("mapActivityLogEntries safely maps raw rows with defaults", () => {
    const result = mapActivityLogEntries([
      { id: "1", type: "deal", description: "Closed", user: "Ops", timestamp: "2024-01-01T00:00:00Z" },
      { id: "2" },
    ]);

    expect(result[0]).toMatchObject({
      id: "1",
      type: "deal",
      description: "Closed",
      user: "Ops",
      entity: undefined,
      details: undefined,
      timestamp: "2024-01-01T00:00:00Z",
    });

    expect(result[1]).toMatchObject({
      id: "2",
      type: "user",
      description: "",
      user: "",
    });
  });
});
