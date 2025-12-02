import Link from "next/link";
import { redirect } from "next/navigation";
import { Building2, ShieldCheck, Sparkles, Users } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ForbiddenError, requireGod } from "@/server/auth/requireGod";

async function ensureGodAccess() {
  try {
    return await requireGod();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const target = encodeURIComponent("/dashboard-dikshithpodhila-god");
      redirect(`/login?redirect=${target}`);
    }
    throw error;
  }
}

export default async function GodAdminPage() {
  const scope = await ensureGodAccess();

  return (
    <div className="space-y-8">
      <header className="flex flex-col gap-3">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <ShieldCheck className="h-4 w-4" aria-hidden />
          <span>God Admin Console</span>
        </div>
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <h1 className="text-3xl font-bold tracking-tight">Control Plane</h1>
            <p className="text-muted-foreground">
              Manage organizations, plans, licenses, and seat limits with full visibility.
            </p>
          </div>
          <Badge variant="secondary" className="text-xs">
            Authenticated as {scope.userId}
          </Badge>
        </div>
      </header>

      <Separator />

      <div className="grid grid-cols-1 gap-6 md:grid-cols-2">
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" aria-hidden />
              Organizations
            </CardTitle>
            <CardDescription>Create and maintain orgs, license periods, and seat caps.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="space-y-1 text-sm">
                <div className="font-medium">New Org Workflow</div>
                <p className="text-muted-foreground">
                  Define name, plan, license validity, and per-role seat limits. Enforce minimum 1 admin.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="space-y-1 text-sm">
                <div className="font-medium">Org Admin Assignment</div>
                <p className="text-muted-foreground">
                  Create or link at least one Org Admin during org setup; admins manage members in the main dashboard.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard-dikshithpodhila-god/orgs">Manage Organizations</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard-dikshithpodhila-god/orgs/new">Create Organization</Link>
              </Button>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary" aria-hidden />
              Plans & Entitlements
            </CardTitle>
            <CardDescription>Define SaaS plans, feature flags, and default seat presets.</CardDescription>
          </CardHeader>
          <CardContent className="flex flex-col gap-3">
            <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
              <Sparkles className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="space-y-1 text-sm">
                <div className="font-medium">Plan Catalog</div>
                <p className="text-muted-foreground">
                  Maintain plan names, billing cadence, and feature JSON flags; attach plans to orgs.
                </p>
              </div>
            </div>
            <div className="flex items-start gap-3 rounded-md border border-dashed p-3">
              <Users className="h-4 w-4 text-muted-foreground" aria-hidden />
              <div className="space-y-1 text-sm">
                <div className="font-medium">Seat Presets</div>
                <p className="text-muted-foreground">
                  Set default admin/manager/supervisor/user seat limits per plan; orgs can override within bounds.
                </p>
              </div>
            </div>
            <div className="flex flex-wrap gap-3">
              <Button asChild>
                <Link href="/dashboard-dikshithpodhila-god/plans">Manage Plans</Link>
              </Button>
              <Button asChild variant="outline">
                <Link href="/dashboard-dikshithpodhila-god/logs">View Activity (coming soon)</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Operating Principles</CardTitle>
          <CardDescription>Guard rails for non-disruptive, enterprise-grade rollout.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-3 md:grid-cols-2">
          <div className="space-y-1 text-sm">
            <div className="font-medium">Additive only</div>
            <p className="text-muted-foreground">
              Existing tenant flows remain untouched. God features stay behind guards and flags until production-ready.
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <div className="font-medium">Shadcn-first UI</div>
            <p className="text-muted-foreground">
              All panels use Shadcn primitives (Card, Button, Badge, Separator); custom components only when needed.
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <div className="font-medium">Seat & Role Discipline</div>
            <p className="text-muted-foreground">
              Minimum one admin per org; role caps enforced at org creation; managers and supervisors gated by limits.
            </p>
          </div>
          <div className="space-y-1 text-sm">
            <div className="font-medium">Testing & Flags</div>
            <p className="text-muted-foreground">
              Roll out with feature flags and targeted tests; observe before widening scope or impersonation features.
            </p>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
