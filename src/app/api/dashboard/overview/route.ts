import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import { LeadsRepository } from "@/server/repositories/leads";
import { getUserAndScope } from "@/server/auth/getUserAndScope";
import type { OverviewSummary } from "@/features/dashboard/pages/overview/query";
import { computeOverviewSummary } from "@/features/dashboard/pages/overview/query";
import type { RevenueKpis } from "@/features/dashboard/pages/reports/revenue/query";

export const runtime = "nodejs";

const querySchema = z.object({
  rangeDays: z.coerce.number().int().min(1).max(365).optional(),
});

async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options),
          );
        },
      },
    },
  );
}

const MAX_LEADS_PAGES = 10;
const LEADS_PAGE_SIZE = 100;

async function fetchLeadsForOverview(
  repo: LeadsRepository,
  userId: string,
  ownerIds: string[] | undefined,
  fromIso: string,
): Promise<Array<{ status?: string | null; source?: string | null }>> {
  const all: any[] = [];
  let page = 0;
  let totalPages = 1;

  while (page < totalPages && page < MAX_LEADS_PAGES) {
    const result = await repo.list({
      filters: {
        status: "all",
        search: "",
        dateFrom: fromIso,
      },
      sort: "date",
      direction: "desc",
      page,
      pageSize: LEADS_PAGE_SIZE,
      userId,
      ownerIds,
    });

    all.push(...(result.data || []));
    totalPages = result.totalPages || 0;
    page += 1;

    if (!result.data || result.data.length === 0) {
      break;
    }
  }

  return all.map((row: any) => ({
    status: row?.status ?? null,
    source: row?.source ?? null,
  }));
}

async function fetchRevenueKpis(
  request: NextRequest,
  rangeDays: number,
): Promise<RevenueKpis> {
  const from = new Date(Date.now() - rangeDays * 24 * 60 * 60 * 1000);
  const url = new URL(request.url);
  url.pathname = "/api/reports/revenue";
  url.search = new URLSearchParams({
    groupBy: "month",
    from: from.toISOString(),
  }).toString();

  const res = await fetch(url.toString(), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch revenue for overview: ${res.statusText}`);
  }
  const json = await res.json();
  return {
    realized_total_minor: json?.realized_total_minor ?? 0,
    realized_net_revenue_minor: json?.realized_net_revenue_minor ?? 0,
    realized_tax_minor: json?.realized_tax_minor ?? 0,
    pending_total_minor: json?.pending_total_minor ?? 0,
    pending_net_revenue_minor: json?.pending_net_revenue_minor ?? 0,
    pending_tax_minor: json?.pending_tax_minor ?? 0,
    draft_total_minor: json?.draft_total_minor ?? 0,
    lead_potential_minor: json?.lead_potential_minor ?? 0,
    gross_profit_minor: json?.gross_profit_minor ?? 0,
    gross_margin_percent: json?.gross_margin_percent ?? 0,
  };
}

async function fetchCustomerCount(
  request: NextRequest,
  status: "all" | "active" | "inactive" | "pending" | "churned",
  rangeDays: number,
): Promise<number> {
  const fromIso = new Date(
    Date.now() - rangeDays * 24 * 60 * 60 * 1000,
  ).toISOString();
  const url = new URL(request.url);
  url.pathname = "/api/customers";
  url.search = new URLSearchParams({
    page: "0",
    pageSize: "1",
    status,
    dateFrom: fromIso,
  }).toString();

  const res = await fetch(url.toString(), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to fetch customers for overview: ${res.statusText}`,
    );
  }
  const json = await res.json();
  return json?.count ?? 0;
}

async function fetchRecentActivity(
  request: NextRequest,
): Promise<OverviewSummary["recentActivity"]> {
  const url = new URL(request.url);
  url.pathname = "/api/activity-logs";
  url.search = new URLSearchParams({
    direction: "desc",
    page: "0",
    pageSize: "50",
  }).toString();

  const res = await fetch(url.toString(), {
    headers: {
      cookie: request.headers.get("cookie") || "",
    },
  });
  if (!res.ok) {
    throw new Error(
      `Failed to load activity logs for overview: ${res.statusText}`,
    );
  }
  const json = await res.json();
  const rows = (json?.data || []) as any[];
  return rows.map((row) => ({
    id: row?.id || "",
    type: (row?.type || "user") as any,
    description: row?.description || "",
    user: row?.user || "",
    entity: row?.entity || undefined,
    timestamp: row?.timestamp || new Date(0).toISOString(),
    details: row?.details || undefined,
  }));
}

export async function GET(request: NextRequest) {
  try {
    const supabase = await getServerClient();
    const {
      data: { user },
    } = await (supabase as any).auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = await getUserAndScope();
    const parsed = querySchema.safeParse(
      Object.fromEntries(new URL(request.url).searchParams.entries()),
    );
    if (!parsed.success) {
      return NextResponse.json(
        { error: "Invalid params", details: parsed.error.flatten() },
        { status: 400 },
      );
    }

    const rangeDays = parsed.data.rangeDays ?? 30;
    const fromIso = new Date(
      Date.now() - rangeDays * 24 * 60 * 60 * 1000,
    ).toISOString();

    const leadsRepo = new LeadsRepository(supabase as any);

    const [leads, revenueKpis, activeCount, churnedCount, totalCustomers, recentActivity] =
      await Promise.all([
        fetchLeadsForOverview(
          leadsRepo,
          scope.userId,
          scope.allowedOwnerIds,
          fromIso,
        ),
        fetchRevenueKpis(request, rangeDays),
        fetchCustomerCount(request, "active", rangeDays),
        fetchCustomerCount(request, "churned", rangeDays),
        fetchCustomerCount(request, "all", rangeDays),
        fetchRecentActivity(request),
      ]);

    const summary = computeOverviewSummary({
      leads,
      revenueKpis,
      customerCounts: {
        active: activeCount,
        churned: churnedCount,
        total: totalCustomers,
      },
      recentActivity,
    });

    return NextResponse.json(summary);
  } catch (error) {
    const message = error instanceof Error ? error.message : String(error);
    return NextResponse.json(
      { error: "Internal server error", message },
      { status: 500 },
    );
  }
}

