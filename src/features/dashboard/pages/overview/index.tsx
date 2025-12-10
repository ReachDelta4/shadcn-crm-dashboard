"use client";

import { useEffect, useMemo, useState, type ReactNode } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  BarChart3,
  DollarSign,
  LineChart,
  PieChart,
  Heart,
  Target,
  Zap,
  UserPlus,
  Mail,
  Phone,
  MessageSquare,
} from "lucide-react";
import { formatINRMinor } from "@/utils/currency";
import { formatRelativeDate } from "@/utils/date-formatter";
import { type OverviewSummary } from "./query";
import { usePerfTimer } from "@/lib/perf";

export async function fetchOverview(
  rangeDays: number,
  signal?: AbortSignal,
): Promise<OverviewSummary> {
  const params = new URLSearchParams({
    rangeDays: String(rangeDays),
  });
  const res = await fetch(`/api/dashboard/overview?${params.toString()}`, {
    signal,
  });
  if (!res.ok) {
    throw new Error(`Failed to fetch overview summary: ${res.statusText}`);
  }
  const json = await res.json();
  return json as OverviewSummary;
}

export function OverviewPage() {
  const [rangeDays, setRangeDays] = useState<7 | 30>(30);
  const perf = usePerfTimer("component:dashboard/overview", {
    autoReadyTimeoutMs: 2500,
  });

  const {
    data,
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["dashboard", "overview", rangeDays],
    queryFn: ({ signal }) => fetchOverview(rangeDays, signal as AbortSignal | undefined),
    placeholderData: keepPreviousData,
    staleTime: 60 * 1000,
  });

  const summary: OverviewSummary | null = useMemo(
    () => (data ? data : null),
    [data],
  );

  const loading = isLoading || isFetching;
  const errorMessage = isError ? (queryError as Error)?.message || "Failed to load overview" : null;

  useEffect(() => {
    if (!perf.enabled) return;
    if (!loading) {
      perf.markReady({
        hasData: Boolean(summary),
        rangeDays,
      });
    } else {
      // Ensure we emit a timing even if data remains loading.
      perf.markReady({
        hasData: Boolean(summary),
        rangeDays,
        loadingFallback: true,
      });
    }
  }, [loading, summary, rangeDays, perf]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Analytics
        </h1>
        <div className="flex flex-wrap items-center gap-2">
          <Button
            variant={rangeDays === 7 ? "default" : "outline"}
            className="flex-1 sm:flex-none"
            onClick={() => setRangeDays(7)}
          >
            Last 7 Days
          </Button>
          <Button
            variant={rangeDays === 30 ? "default" : "outline"}
            className="flex-1 sm:flex-none"
            onClick={() => setRangeDays(30)}
          >
            Last 30 Days
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <MetricCard
          title="Customer Acquisition Cost"
          icon={<DollarSign className="text-muted-foreground h-4 w-4" />}
          value={summary ? formatINRMinor(summary.metrics.customerAcquisitionCostMinor) : "–"}
          description="Average cost per customer (approximate COGS)"
          loading={loading}
          error={errorMessage}
        />
        <MetricCard
          title="Customer Lifetime Value"
          icon={<Heart className="text-muted-foreground h-4 w-4" />}
          value={summary ? formatINRMinor(summary.metrics.customerLifetimeValueMinor) : "–"}
          description="Realized revenue per customer"
          loading={loading}
          error={errorMessage}
        />
        <MetricCard
          title="Customer Retention"
          icon={<Target className="text-muted-foreground h-4 w-4" />}
          value={summary ? `${summary.metrics.customerRetentionRatePercent.toFixed(1)}%` : "–"}
          description="Active vs churned customers"
          loading={loading}
          error={errorMessage}
        />
        <MetricCard
          title="Lead Conversion Rate"
          icon={<Zap className="text-muted-foreground h-4 w-4" />}
          value={summary ? `${summary.metrics.leadConversionRatePercent.toFixed(1)}%` : "–"}
          description="Converted leads / total leads"
          loading={loading}
          error={errorMessage}
        />
      </div>

      {/* Charts / Breakdown */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-2 lg:col-span-4">
          <CardHeader>
            <CardTitle>Customer Journey Stages</CardTitle>
            <CardDescription>
              Distribution of leads across funnel
            </CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && !summary ? (
              <SkeletonState />
            ) : errorMessage ? (
              <ErrorState message={errorMessage} />
            ) : summary && summary.stages.length > 0 ? (
              <div className="space-y-2">
                {summary.stages.map((stage) => (
                  <div key={stage.status} className="space-y-1">
                    <div className="flex items-center justify-between text-xs sm:text-sm">
                      <span className="font-medium">{stage.label}</span>
                      <span className="text-muted-foreground">
                        {stage.count} ({stage.percentage.toFixed(1)}%)
                      </span>
                    </div>
                    <div className="h-1.5 w-full overflow-hidden rounded-full bg-muted">
                      <div
                        className="h-full rounded-full bg-primary transition-all"
                        style={{ width: `${Math.max(2, stage.percentage)}%` }}
                      />
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<BarChart3 className="h-6 w-6" />} text="No leads yet" />
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Lead Sources</CardTitle>
            <CardDescription>Where your leads are coming from</CardDescription>
          </CardHeader>
          <CardContent className="space-y-2">
            {loading && !summary ? (
              <SkeletonState />
            ) : errorMessage ? (
              <ErrorState message={errorMessage} />
            ) : summary && summary.leadSources.length > 0 ? (
              <div className="space-y-2">
                {summary.leadSources.slice(0, 6).map((src) => (
                  <div key={src.source} className="flex items-center justify-between text-xs sm:text-sm">
                    <span className="truncate capitalize">{src.source}</span>
                    <span className="text-muted-foreground">
                      {src.count} ({src.percentage.toFixed(1)}%)
                    </span>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<PieChart className="h-6 w-6" />} text="No lead sources yet" />
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Activity and Engagement */}
      <div className="grid grid-cols-1 gap-4 md:grid-cols-2 lg:grid-cols-7">
        <Card className="col-span-1 md:col-span-1 lg:col-span-4">
          <CardHeader>
            <CardTitle>Recent Customer Interactions</CardTitle>
            <CardDescription>
              Latest customer touchpoints and activities
            </CardDescription>
          </CardHeader>
          <CardContent>
            {loading && !summary ? (
              <SkeletonState />
            ) : errorMessage ? (
              <ErrorState message={errorMessage} />
            ) : summary && summary.recentActivity.length > 0 ? (
              <div className="space-y-3 sm:space-y-4">
                {summary.recentActivity.map((log) => (
                  <div
                    key={log.id}
                    className="flex items-start gap-3 rounded-lg border p-2 sm:items-center sm:p-3"
                  >
                    <div className="bg-primary/10 flex-shrink-0 rounded-full p-1.5 sm:p-2">
                      {renderActivityIcon(log.type)}
                    </div>
                    <div className="min-w-0 flex-1 space-y-0.5 sm:space-y-1">
                      <p className="truncate text-xs leading-tight font-medium sm:text-sm">
                        {log.description}
                      </p>
                      <p className="text-muted-foreground line-clamp-2 text-[10px] sm:text-xs">
                        {log.entity || log.user}
                      </p>
                    </div>
                    <div className="text-muted-foreground ml-2 flex-shrink-0 text-[10px] whitespace-nowrap sm:text-xs">
                      {formatRelativeDate(log.timestamp, {
                        maxHoursAsRelative: 12,
                        fullDayNames: true,
                        fullMonthNames: true,
                      })}
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <EmptyState icon={<Phone className="h-6 w-6" />} text="No recent activity" />
            )}
          </CardContent>
        </Card>
        <Card className="col-span-1 md:col-span-1 lg:col-span-3">
          <CardHeader>
            <CardTitle>Customer Engagement</CardTitle>
            <CardDescription>
              Activity metrics across customer touchpoints
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="flex h-[200px] w-full items-center justify-center rounded-md border p-4 text-center sm:h-[240px]">
              <div className="flex flex-col items-center gap-2">
                <LineChart className="text-muted-foreground h-6 w-6 sm:h-8 sm:w-8" />
                <p className="text-muted-foreground text-xs sm:text-sm">
                  Engagement summary derives from recent activity
                </p>
                <p className="text-muted-foreground text-[10px] sm:text-xs">
                  Use the Activity Logs page for full drill-down by channel and response time.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}

function MetricCard({
  title,
  icon,
  value,
  description,
  loading,
  error,
}: {
  title: string;
  icon: ReactNode;
  value: string;
  description: string;
  loading: boolean;
  error: string | null;
}) {
  return (
    <Card>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <CardTitle className="text-sm font-medium flex items-center gap-2">
          {title}
        </CardTitle>
        {icon}
      </CardHeader>
      <CardContent>
        {error ? (
          <p className="text-xs text-red-600">{error}</p>
        ) : loading && value === "–" ? (
          <div className="h-6 w-24 rounded bg-muted animate-pulse" />
        ) : (
          <div className="text-xl font-bold sm:text-2xl">{value}</div>
        )}
        <p className="text-muted-foreground mt-1 text-xs">{description}</p>
      </CardContent>
    </Card>
  );
}

function SkeletonState() {
  return (
    <div className="space-y-2">
      <div className="h-3 w-full rounded bg-muted animate-pulse" />
      <div className="h-3 w-3/4 rounded bg-muted animate-pulse" />
      <div className="h-3 w-1/2 rounded bg-muted animate-pulse" />
    </div>
  );
}

function ErrorState({ message }: { message: string }) {
  return (
    <div className="text-xs text-red-600">
      {message}
    </div>
  );
}

function EmptyState({ icon, text }: { icon: ReactNode; text: string }) {
  return (
    <div className="flex flex-col items-center justify-center py-6 text-center text-xs sm:text-sm text-muted-foreground gap-2">
      <div className="rounded-full bg-muted p-2 text-muted-foreground">{icon}</div>
      <span>{text}</span>
    </div>
  );
}

function renderActivityIcon(type: string) {
  switch (type) {
    case "email":
      return <Mail className="text-primary h-3 w-3 sm:h-4 sm:w-4" />;
    case "contact":
      return <UserPlus className="text-primary h-3 w-3 sm:h-4 sm:w-4" />;
    case "task":
      return <MessageSquare className="text-primary h-3 w-3 sm:h-4 sm:w-4" />;
    case "deal":
      return <Target className="text-primary h-3 w-3 sm:h-4 sm:w-4" />;
    case "lead":
      return <Phone className="text-primary h-3 w-3 sm:h-4 sm:w-4" />;
    default:
      return <Phone className="text-primary h-3 w-3 sm:h-4 sm:w-4" />;
  }
}
