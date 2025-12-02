"use server";

import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { AlertTriangle, ArrowLeft, Clock, ShieldCheck, Users2, XCircle } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ForbiddenError, requireGod } from "@/server/auth/requireGod";
import { getGodOrg, GodOrgError } from "@/server/god/orgs";
import OrgEditor from "./org-editor";
import InvitesPanel from "./invites-panel";
import AuditPanel from "./audit-panel";

async function ensureGod() {
  try {
    return await requireGod();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const target = encodeURIComponent("/dashboard-dikshithpodhila-god/orgs");
      redirect(`/login?redirect=${target}`);
    }
    throw error;
  }
}

export default async function GodOrgDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  await ensureGod();
  const { id } = await params;
  let org;
  try {
    org = await getGodOrg(id);
  } catch (error) {
    if (error instanceof GodOrgError && error.status === 404) {
      notFound();
    }
    throw error;
  }

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <span>God Admin · Organization</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">{org.name}</h1>
          <div className="flex flex-wrap gap-2">
            <Badge variant="secondary">{org.status}</Badge>
            {org.health?.licenseExpired && (
              <Badge variant="destructive" className="gap-1">
                <XCircle className="h-3 w-3" aria-hidden />
                License expired
              </Badge>
            )}
            {!org.health?.licenseExpired && org.health?.licenseExpiringSoon && (
              <Badge variant="secondary" className="gap-1">
                <Clock className="h-3 w-3" aria-hidden />
                License expiring
              </Badge>
            )}
            {org.health?.seatOverage && (
              <Badge variant="destructive" className="gap-1">
                <AlertTriangle className="h-3 w-3" aria-hidden />
                Seats over limit
              </Badge>
            )}
          </div>
        </div>
        <div className="flex items-center gap-2">
          <Button asChild variant="outline" size="sm">
            <Link href="/dashboard-dikshithpodhila-god/orgs">
              <ArrowLeft className="mr-2 h-4 w-4" aria-hidden />
              Back
            </Link>
          </Button>
        </div>
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Overview</CardTitle>
          <CardDescription>Core metadata and plan assignment.</CardDescription>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <Info label="Plan" value={org.planName || "Unassigned"} />
          <Info label="License expires" value={org.licenseExpiresAt ? org.licenseExpiresAt.substring(0, 10) : "—"} />
          <Info label="Org type" value={org.orgType} />
          <Info label="Slug" value={org.slug || "—"} />
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Seat Limits & Usage</CardTitle>
            <CardDescription>Counts are active members only.</CardDescription>
          </div>
          <Badge variant="secondary" className="gap-2">
            <Users2 className="h-3.5 w-3.5" aria-hidden />
            Live usage
          </Badge>
        </CardHeader>
        <CardContent className="grid gap-4 md:grid-cols-2">
          <SeatCard label="Admins" used={org.seatUsage.admins} limit={org.seatLimits.admins} />
          <SeatCard label="Managers" used={org.seatUsage.managers} limit={org.seatLimits.managers} />
          <SeatCard label="Supervisors" used={org.seatUsage.supervisors} limit={org.seatLimits.supervisors} />
          <SeatCard label="Users" used={org.seatUsage.users} limit={org.seatLimits.users} />
        </CardContent>
      </Card>

      <OrgEditor org={org} />
      <InvitesPanel orgId={org.id} />
      <AuditPanel orgId={org.id} />
    </div>
  );
}

function Info({ label, value }: { label: string; value: string }) {
  return (
    <div className="rounded-lg border p-3">
      <div className="text-xs uppercase text-muted-foreground">{label}</div>
      <div className="text-sm font-medium text-foreground">{value}</div>
    </div>
  );
}

function SeatCard({ label, used, limit }: { label: string; used: number; limit: number }) {
  const over = used > limit;
  return (
    <div className="rounded-lg border p-3">
      <div className="flex items-center justify-between text-sm font-medium">
        <span>{label}</span>
        <Badge variant={over ? "destructive" : "outline"}>
          {used} / {limit}
        </Badge>
      </div>
      <Separator className="my-2" />
      <p className="text-xs text-muted-foreground">Active members counted against the cap.</p>
    </div>
  );
}
