"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { BookOpenCheck, Pencil, Plus, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ForbiddenError, requireGod } from "@/server/auth/requireGod";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { listPlans } from "@/server/god/plans.js";
import PlanManager from "./plan-manager";

async function ensureGod() {
  try {
    return await requireGod();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const target = encodeURIComponent("/dashboard-dikshithpodhila-god/plans");
      redirect(`/login?redirect=${target}`);
    }
    throw error;
  }
}

export default async function GodPlansPage() {
  await ensureGod();
  const plans = await listPlans();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <span>God Admin · Plans</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Plans & Entitlements</h1>
          <p className="text-sm text-muted-foreground">
            Define SaaS plans, billing cadence, and feature flags. Use the God API to attach plans to orgs.
          </p>
        </div>
        <Button asChild>
          <Link href="/dashboard-dikshithpodhila-god/orgs/new">
            <Plus className="mr-2 h-4 w-4" aria-hidden />
            Create Org with Plan
          </Link>
        </Button>
      </div>

      <PlanManager plans={plans} />
    </div>
  );
}
