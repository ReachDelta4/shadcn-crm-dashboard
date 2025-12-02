"use client";

import { useEffect, useState } from "react";
import { Loader2, RefreshCcw } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";

type OrgSummary = {
  orgName: string;
  planName: string | null;
  license: { expiresAt: string | null; status: string };
  seatLimits: { admins: number; managers: number; supervisors: number; users: number };
  seatUsage: { admins: number; managers: number; supervisors: number; users: number };
  invites: { pending: number };
  health?: { licenseExpired: boolean; licenseExpiringSoon: boolean; seatOverage: boolean; suspended: boolean };
};

export default function OrgSettingsPage() {
  const [summary, setSummary] = useState<OrgSummary | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org/summary", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load org summary");
      setSummary(json.summary || null);
    } catch (err: any) {
      setError(err?.message || "Failed to load org summary");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    refresh();
  }, []);

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold tracking-tight">Org Settings</h1>
          <p className="text-sm text-muted-foreground">
            Plan, license, seats, and invites for your organization.
          </p>
        </div>
        <button
          onClick={refresh}
          className="inline-flex items-center gap-2 rounded-md border px-3 py-1 text-sm"
          disabled={loading}
        >
          {loading ? <Loader2 className="h-4 w-4 animate-spin" /> : <RefreshCcw className="h-4 w-4" />}
          Refresh
        </button>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      {summary && (
        <div className="grid gap-4 md:grid-cols-2">
          <Card>
            <CardHeader>
              <CardTitle>Plan & License</CardTitle>
              <CardDescription>Current assignment and expiry.</CardDescription>
            </CardHeader>
            <CardContent className="space-y-2 text-sm">
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">Plan</span>
                <span className="font-medium">{summary.planName || "Unassigned"}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-muted-foreground">License</span>
                <div className="flex items-center gap-2">
                  <span className="font-medium">
                    {summary.license.expiresAt ? summary.license.expiresAt.substring(0, 10) : "—"}
                  </span>
                  {summary.health?.licenseExpired && <Badge variant="destructive">Expired</Badge>}
                  {!summary.health?.licenseExpired && summary.health?.licenseExpiringSoon && (
                    <Badge variant="secondary">Expiring</Badge>
                  )}
                </div>
              </div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader>
              <CardTitle>Invites</CardTitle>
              <CardDescription>Pending invites for this org.</CardDescription>
            </CardHeader>
            <CardContent className="flex items-center justify-between text-sm">
              <span className="text-muted-foreground">Pending invites</span>
              <span className="font-semibold">{summary.invites.pending}</span>
            </CardContent>
          </Card>

          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Seat Usage</CardTitle>
              <CardDescription>Active members against configured limits.</CardDescription>
            </CardHeader>
            <CardContent className="grid gap-4 md:grid-cols-4">
              {(["admins", "managers", "supervisors", "users"] as const).map((role) => {
                const used = summary.seatUsage[role];
                const limit = summary.seatLimits[role];
                const over = used > limit;
                return (
                  <div key={role} className="rounded-lg border p-3">
                    <div className="flex items-center justify-between text-sm font-medium">
                      <span className="capitalize">{role}</span>
                      <Badge variant={over ? "destructive" : "outline"}>
                        {used} / {limit}
                      </Badge>
                    </div>
                    <Separator className="my-2" />
                    <p className="text-xs text-muted-foreground">Active users counted for this role.</p>
                  </div>
                );
              })}
            </CardContent>
          </Card>
        </div>
      )}
    </div>
  );
}
