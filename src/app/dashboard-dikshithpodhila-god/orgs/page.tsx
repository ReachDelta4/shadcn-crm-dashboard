"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { Plus, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { ForbiddenError, requireGod } from "@/server/auth/requireGod";
import { GodOrgSummary, listGodOrgs } from "@/server/god/orgs";
import OrgsTable from "./orgs-table";

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

export default async function GodOrgsPage() {
  await ensureGod();
  const orgs: GodOrgSummary[] = await listGodOrgs();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-4">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <span>God Admin · Organizations</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Organizations</h1>
          <p className="text-sm text-muted-foreground">
            Create and maintain orgs, license windows, and seat caps. Powered by live data via service-role guard.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard-dikshithpodhila-god/orgs/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            New Organization
          </Link>
        </Button>
      </div>

      <Card>
        <CardHeader className="flex flex-col gap-2 sm:flex-row sm:items-center sm:justify-between">
          <div>
            <CardTitle>Organization List</CardTitle>
            <CardDescription>Live organizations with seat limits, license status, and health badges.</CardDescription>
          </div>
          <Badge variant="secondary" className="gap-2">
            {orgs.length} orgs
          </Badge>
        </CardHeader>
        <CardContent>
          <OrgsTable orgs={orgs} />
        </CardContent>
      </Card>
    </div>
  );
}
