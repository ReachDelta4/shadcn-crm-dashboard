"use client";

import { useEffect, useMemo, useState } from "react";
import { keepPreviousData, useQuery } from "@tanstack/react-query";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Input } from "@/components/ui/input";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { Badge } from "@/components/ui/badge";
import { Search, Filter, MoreHorizontal, Calendar, ArrowDownUp, Download } from "lucide-react";
import type { ActivityLog } from "./types";
import { formatRelativeDate } from "@/utils/date-formatter";
import { fetchActivityLogs } from "./query";

export function ActivityLogsPage() {
  const [searchQuery, setSearchQuery] = useState("");
  const [filterType, setFilterType] = useState<"all" | ActivityLog["type"]>("all");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");
  const debouncedSearch = useDebouncedValue(searchQuery, 250);

  const queryParams = useMemo(
    () => ({
      filterType,
      sortOrder,
      searchQuery: debouncedSearch,
    }),
    [filterType, sortOrder, debouncedSearch],
  );

  const {
    data: logs = [],
    isLoading,
    isFetching,
    isError,
    error: queryError,
  } = useQuery({
    queryKey: ["activity-logs", queryParams],
    queryFn: ({ signal }) =>
      fetchActivityLogs(queryParams, signal as AbortSignal | undefined),
    placeholderData: keepPreviousData,
    staleTime: 2 * 60 * 1000,
  });

  const loading = isLoading || isFetching;
  const errorMessage = isError
    ? (queryError as Error)?.message || "Failed to load activity logs"
    : null;

  const sortedLogs = useMemo(() => {
    const ordered = [...logs].sort((a, b) => {
      const dateA = new Date(a.timestamp).getTime();
      const dateB = new Date(b.timestamp).getTime();
      return sortOrder === "desc" ? dateB - dateA : dateA - dateB;
    });
    return ordered;
  }, [logs, sortOrder]);

  return (
    <div className="flex flex-col gap-4 md:gap-6">
      <div className="flex flex-col justify-between gap-4 sm:flex-row sm:items-center">
        <h1 className="text-xl font-bold tracking-tight sm:text-2xl">
          Activity Logs
        </h1>
        <div className="flex items-center gap-2">
          <Button variant="outline" className="hidden md:flex">
            <Calendar className="mr-2 h-4 w-4" />
            Last 7 Days
          </Button>
          <Button variant="outline" className="hidden md:flex">
            <Filter className="mr-2 h-4 w-4" />
            Filter
          </Button>
          <Button>
            <Download className="mr-2 h-4 w-4" />
            Export
          </Button>
        </div>
      </div>

      {/* Search and Filters */}
      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 md:grid-cols-4 lg:flex lg:items-center">
        <div className="relative sm:col-span-2">
          <Search className="text-muted-foreground absolute top-2.5 left-2.5 h-4 w-4" />
          <Input
            placeholder="Search activity logs..."
            className="pl-8"
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
          />
        </div>
        <Select
          value={filterType}
          onValueChange={(value) =>
            setFilterType(value as "all" | ActivityLog["type"])
          }
        >
          <SelectTrigger>
            <SelectValue placeholder="Filter by type" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All Activities</SelectItem>
            <SelectItem value="user">User Activity</SelectItem>
            <SelectItem value="contact">Contact</SelectItem>
            <SelectItem value="lead">Lead</SelectItem>
            <SelectItem value="deal">Deal</SelectItem>
            <SelectItem value="task">Task</SelectItem>
            <SelectItem value="email">Email</SelectItem>
          </SelectContent>
        </Select>
        <Button
          variant="outline"
          size="icon"
          onClick={() => setSortOrder(sortOrder === "desc" ? "asc" : "desc")}
          className="h-10 w-10 shrink-0 md:ml-auto"
        >
          <ArrowDownUp className="h-4 w-4" />
        </Button>
      </div>

      {/* Activity Logs List */}
      <Card>
        <CardHeader className="pb-3">
          <CardTitle className="text-base font-medium">
            Recent Activities
          </CardTitle>
          <CardDescription>
            {sortedLogs.length} activities found
          </CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          <div className="space-y-px">
            {loading ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-muted-foreground text-sm">Loading...</span>
              </div>
            ) : errorMessage ? (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <span className="text-red-600 text-sm">{errorMessage}</span>
              </div>
            ) : sortedLogs.length > 0 ? (
              sortedLogs.map((log: ActivityLog, index: number) => (
                <div
                  key={log.id}
                  className={`flex flex-col justify-between gap-2 p-4 sm:flex-row sm:items-center ${index !== sortedLogs.length - 1 ? "border-b" : ""}`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <div
                      className={`flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full ${getActivityTypeColor(log.type)}`}
                    >
                      {getActivityTypeIcon(log.type)}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="mb-1 truncate text-sm leading-none font-medium">
                        {log.description}
                      </p>
                      <div className="flex flex-wrap items-center gap-x-2 gap-y-1">
                        <Badge
                          variant="outline"
                          className="text-xs font-normal"
                        >
                          {log.type}
                        </Badge>
                        {log.entity && (
                          <span className="text-muted-foreground text-xs">
                            {log.entity}
                          </span>
                        )}
                        <span className="text-muted-foreground text-xs">
                          by {log.user}
                        </span>
                      </div>
                    </div>
                  </div>
                  <div className="mt-2 flex items-center gap-2 sm:mt-0">
                    <span className="text-muted-foreground text-xs whitespace-nowrap">
                      {formatRelativeDate(log.timestamp, {
                        maxHoursAsRelative: 12,
                        fullDayNames: true,
                        fullMonthNames: true,
                      })}
                    </span>
                    <DropdownMenu>
                      <DropdownMenuTrigger asChild>
                        <Button variant="ghost" size="icon" className="h-8 w-8">
                          <MoreHorizontal className="h-4 w-4" />
                        </Button>
                      </DropdownMenuTrigger>
                      <DropdownMenuContent align="end">
                        <DropdownMenuLabel>Actions</DropdownMenuLabel>
                        <DropdownMenuSeparator />
                        <DropdownMenuItem>View Details</DropdownMenuItem>
                        <DropdownMenuItem>Related Records</DropdownMenuItem>
                        <DropdownMenuItem>Export Entry</DropdownMenuItem>
                      </DropdownMenuContent>
                    </DropdownMenu>
                  </div>
                </div>
              ))
            ) : (
              <div className="flex flex-col items-center justify-center py-12 text-center">
                <Search className="text-muted-foreground mb-4 h-10 w-10" />
                <h3 className="text-lg font-semibold">No activities found</h3>
                <p className="text-muted-foreground mt-2 max-w-md text-sm">
                  Try adjusting your search or filter to find what you&apos;re
                  looking for.
                </p>
              </div>
            )}
          </div>
        </CardContent>
      </Card>

      {/* Pagination (future: infinite scroll) */}
      {sortedLogs.length > 0 && (
        <div className="flex items-center justify-between">
          <p className="text-muted-foreground text-sm">
            Showing <span className="font-medium">{sortedLogs.length}</span>
          </p>
        </div>
      )}
    </div>
  );
}

function useDebouncedValue<T>(value: T, delay = 250) {
  const [debounced, setDebounced] = useState(value);

  useEffect(() => {
    const id = setTimeout(() => setDebounced(value), delay);
    return () => clearTimeout(id);
  }, [value, delay]);

  return debounced;
}

// Helper functions
function getActivityTypeColor(type: ActivityLog["type"]): string {
  switch (type) {
    case "user":
      return "bg-blue-100 text-blue-700 dark:bg-blue-950 dark:text-blue-400";
    case "contact":
      return "bg-purple-100 text-purple-700 dark:bg-purple-950 dark:text-purple-400";
    case "lead":
      return "bg-amber-100 text-amber-700 dark:bg-amber-950 dark:text-amber-400";
    case "deal":
      return "bg-green-100 text-green-700 dark:bg-green-950 dark:text-green-400";
    case "task":
      return "bg-indigo-100 text-indigo-700 dark:bg-indigo-950 dark:text-indigo-400";
    case "email":
      return "bg-rose-100 text-rose-700 dark:bg-rose-950 dark:text-rose-400";
    default:
      return "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-400";
  }
}

function getActivityTypeIcon(type: ActivityLog["type"]) {
  const label =
    type === "user"
      ? "U"
      : type === "contact"
        ? "C"
        : type === "lead"
          ? "L"
          : type === "deal"
            ? "D"
            : type === "task"
              ? "T"
              : type === "email"
                ? "E"
                : "?";
  return <span className="text-[10px] font-semibold">{label}</span>;
}
