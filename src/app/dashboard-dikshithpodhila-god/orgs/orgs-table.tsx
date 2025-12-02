"use client";

import { useMemo, useState } from "react";
import { AlertTriangle, Clock, Search, Users2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { cn } from "@/lib/utils";

type OrgHealth = {
  licenseExpired: boolean;
  licenseExpiringSoon: boolean;
  seatOverage: boolean;
  suspended: boolean;
};

type Org = {
  id: string;
  name: string;
  slug: string | null;
  planName: string | null;
  status: string;
  licenseExpiresAt: string | null;
  seatUsage: { admins: number; managers: number; supervisors: number; users: number };
  seatLimits: { admins: number; managers: number; supervisors: number; users: number };
  health?: OrgHealth;
};

export default function OrgsTable({ orgs }: { orgs: Org[] }) {
  const [search, setSearch] = useState("");
  const [status, setStatus] = useState<"all" | "active" | "suspended">("all");
  const [plan, setPlan] = useState<string>("all");
  const [healthFilters, setHealthFilters] = useState({
    expired: false,
    expiring: false,
    overage: false,
  });

  const planOptions = useMemo(() => {
    const names = Array.from(new Set(orgs.map((o) => o.planName).filter(Boolean)));
    return names;
  }, [orgs]);

  const filtered = useMemo(() => {
    const term = search.trim().toLowerCase();
    return orgs.filter((org) => {
      if (status !== "all" && org.status !== status) return false;
      if (plan !== "all" && (org.planName || "") !== plan) return false;

      if (healthFilters.expired && !org.health?.licenseExpired) return false;
      if (healthFilters.expiring && !org.health?.licenseExpiringSoon) return false;
      if (healthFilters.overage && !org.health?.seatOverage) return false;

      if (!term) return true;
      return (
        org.name.toLowerCase().includes(term) ||
        (org.slug || "").toLowerCase().includes(term) ||
        (org.planName || "").toLowerCase().includes(term)
      );
    });
  }, [orgs, status, plan, healthFilters, search]);

  return (
    <div className="space-y-4">
      <div className="flex flex-wrap items-center gap-3">
        <div className="relative w-full max-w-sm">
          <Input
            placeholder="Search by name, slug, or plan"
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9"
          />
          <Search className="absolute left-2 top-2.5 h-4 w-4 text-muted-foreground" aria-hidden />
        </div>
        <Select value={status} onValueChange={(v: any) => setStatus(v)}>
          <SelectTrigger className="w-[160px]">
            <SelectValue placeholder="Status" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All statuses</SelectItem>
            <SelectItem value="active">Active</SelectItem>
            <SelectItem value="suspended">Suspended</SelectItem>
          </SelectContent>
        </Select>
        <Select value={plan} onValueChange={(v: any) => setPlan(v)}>
          <SelectTrigger className="w-[180px]">
            <SelectValue placeholder="Plan" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="all">All plans</SelectItem>
            {planOptions.map((p) => (
              <SelectItem key={p} value={p as string}>
                {p}
              </SelectItem>
            ))}
            {planOptions.length === 0 && <SelectItem value="none" disabled>No plans</SelectItem>}
          </SelectContent>
        </Select>
        <div className="flex flex-wrap gap-2">
          <HealthToggle
            active={healthFilters.expired}
            onClick={() => setHealthFilters((s) => ({ ...s, expired: !s.expired }))}
            icon={<XCircle className="h-3.5 w-3.5" aria-hidden />}
            label="Expired"
          />
          <HealthToggle
            active={healthFilters.expiring}
            onClick={() => setHealthFilters((s) => ({ ...s, expiring: !s.expiring }))}
            icon={<Clock className="h-3.5 w-3.5" aria-hidden />}
            label="Expiring"
          />
          <HealthToggle
            active={healthFilters.overage}
            onClick={() => setHealthFilters((s) => ({ ...s, overage: !s.overage }))}
            icon={<AlertTriangle className="h-3.5 w-3.5" aria-hidden />}
            label="Over seats"
          />
        </div>
      </div>

      <div className="overflow-x-auto">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Organization</TableHead>
              <TableHead>Plan</TableHead>
              <TableHead>Status / Health</TableHead>
              <TableHead>Admins</TableHead>
              <TableHead>Managers</TableHead>
              <TableHead>Supervisors</TableHead>
              <TableHead>Users</TableHead>
              <TableHead>License Expires</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filtered.map((org) => (
              <TableRow key={org.id}>
                <TableCell className="font-medium">{org.name}</TableCell>
                <TableCell>{org.planName || "Unassigned"}</TableCell>
                <TableCell>
                  <div className="flex flex-wrap items-center gap-1">
                    <Badge variant={org.status === "active" ? "outline" : "destructive"}>{org.status}</Badge>
                    {org.health?.licenseExpired && (
                      <Badge variant="destructive" className="gap-1">
                        <XCircle className="h-3 w-3" aria-hidden />
                        Expired
                      </Badge>
                    )}
                    {!org.health?.licenseExpired && org.health?.licenseExpiringSoon && (
                      <Badge variant="secondary" className="gap-1">
                        <Clock className="h-3 w-3" aria-hidden />
                        Expiring
                      </Badge>
                    )}
                    {org.health?.seatOverage && (
                      <Badge variant="destructive" className="gap-1">
                        <AlertTriangle className="h-3 w-3" aria-hidden />
                        Seats over
                      </Badge>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  {org.seatUsage.admins} / {org.seatLimits.admins}
                </TableCell>
                <TableCell>
                  {org.seatUsage.managers} / {org.seatLimits.managers}
                </TableCell>
                <TableCell>
                  {org.seatUsage.supervisors} / {org.seatLimits.supervisors}
                </TableCell>
                <TableCell>
                  {org.seatUsage.users} / {org.seatLimits.users}
                </TableCell>
                <TableCell>{org.licenseExpiresAt ? org.licenseExpiresAt.substring(0, 10) : "—"}</TableCell>
                <TableCell className="text-right">
                  <Button asChild variant="ghost" size="sm">
                    <a href={`/dashboard-dikshithpodhila-god/orgs/${org.id}`}>View</a>
                  </Button>
                </TableCell>
              </TableRow>
            ))}
            {filtered.length === 0 && (
              <TableRow>
                <TableCell colSpan={9} className="text-center text-sm text-muted-foreground">
                  No organizations match the current filters.
                </TableCell>
              </TableRow>
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function HealthToggle({
  active,
  onClick,
  icon,
  label,
}: {
  active: boolean;
  onClick: () => void;
  icon: React.ReactNode;
  label: string;
}) {
  return (
    <Button
      type="button"
      variant={active ? "default" : "outline"}
      size="sm"
      onClick={onClick}
      className={cn("gap-2", active ? "" : "text-muted-foreground")}
    >
      {icon}
      {label}
    </Button>
  );
}
