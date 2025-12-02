"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { BadgeDollarSign, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Separator } from "@/components/ui/separator";
import { ForbiddenError, requireGod } from "@/server/auth/requireGod";
import SubscriptionManager from "./subscription-manager";

async function ensureGod() {
  try {
    return await requireGod();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const target = encodeURIComponent("/dashboard-dikshithpodhila-god/subscriptions");
      redirect(`/login?redirect=${target}`);
    }
    throw error;
  }
}

export default async function GodSubscriptionsPage() {
  await ensureGod();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <span>God Admin · Subscriptions</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Org Subscriptions</h1>
          <p className="text-sm text-muted-foreground">
            Assign plans to orgs, set renewal windows, and track status. UI editor coming next.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard-dikshithpodhila-god/orgs">Manage Orgs</Link>
        </Button>
      </div>

      <SubscriptionManager />
    </div>
  );
}
