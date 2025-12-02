"use server";

import Link from "next/link";
import { redirect } from "next/navigation";
import { CalendarClock, Save, ShieldCheck } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Separator } from "@/components/ui/separator";
import { ForbiddenError, requireGod } from "@/server/auth/requireGod";
import { createGodOrg } from "@/server/god/orgs";

async function ensureGod() {
  try {
    return await requireGod();
  } catch (error) {
    if (error instanceof ForbiddenError) {
      const target = encodeURIComponent("/dashboard-dikshithpodhila-god/orgs/new");
      redirect(`/login?redirect=${target}`);
    }
    throw error;
  }
}

async function createOrgAction(formData: FormData) {
  "use server";
  await ensureGod();

  const name = String(formData.get("name") || "").trim();
  const slug = String(formData.get("slug") || "").trim() || null;
  const planName = String(formData.get("plan") || "Enterprise").trim() || "Enterprise";
  const licenseEnd = String(formData.get("licenseEnd") || "").trim() || null;
  const admins = Math.max(1, Number(formData.get("seatAdmins") || 1));
  const managers = Math.max(0, Number(formData.get("seatManagers") || 0));
  const supervisors = Math.max(0, Number(formData.get("seatSupervisors") || 0));
  const users = Math.max(0, Number(formData.get("seatUsers") || 0));
  const adminEmail = String(formData.get("adminEmail") || "").trim() || null;
  const adminPassword = String(formData.get("adminPassword") || "").trim() || null;

  await createGodOrg({
    name,
    slug: slug || undefined,
    planName,
    licenseEnd: licenseEnd || null,
    orgType: "enterprise",
    status: "active",
    seatLimits: { admins, managers, supervisors, users },
    adminEmail,
    adminPassword,
  });

  redirect("/dashboard-dikshithpodhila-god/orgs");
}

export default async function GodNewOrgPage() {
  await ensureGod();

  return (
    <div className="space-y-6">
      <div className="flex flex-wrap items-center justify-between gap-3">
        <div className="space-y-1">
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <ShieldCheck className="h-4 w-4" aria-hidden />
            <span>God Admin · New Organization</span>
          </div>
          <h1 className="text-2xl font-bold tracking-tight">Create Organization</h1>
          <p className="text-sm text-muted-foreground">
            Define plan, license window, and seat caps. On submit we create the org, plan (if needed), and first admin.
          </p>
        </div>
        <Button asChild variant="outline">
          <Link href="/dashboard-dikshithpodhila-god/orgs">Back to list</Link>
        </Button>
      </div>

      <form action={createOrgAction}>
        <Card>
          <CardHeader>
            <CardTitle>Organization Details</CardTitle>
            <CardDescription>All fields required; minimum one admin seat enforced.</CardDescription>
          </CardHeader>
          <CardContent className="space-y-6">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="org-name">Organization Name</Label>
                <Input id="org-name" name="name" placeholder="Acme Corp" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="org-slug">Slug (optional)</Label>
                <Input id="org-slug" name="slug" placeholder="acme" />
              </div>
            </div>

            <div className="grid gap-4 md:grid-cols-3">
              <div className="space-y-2">
                <Label htmlFor="plan">Plan</Label>
                <select
                  id="plan"
                  name="plan"
                  defaultValue="Enterprise"
                  className="flex h-10 w-full items-center justify-between rounded-md border border-input bg-background px-3 py-2 text-sm ring-offset-background focus:outline-none focus:ring-2 focus:ring-ring focus:ring-offset-2"
                >
                  <option value="Starter">Starter</option>
                  <option value="Pro">Pro</option>
                  <option value="Enterprise">Enterprise</option>
                </select>
              </div>
              <div className="space-y-2">
                <Label>License Start</Label>
                <Input type="date" name="licenseStart" defaultValue="2025-12-01" />
              </div>
              <div className="space-y-2">
                <Label>License End</Label>
                <Input type="date" name="licenseEnd" defaultValue="2026-12-01" />
              </div>
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-4">
              <SeatField label="Admin seats" id="seat-admins" name="seatAdmins" defaultValue="1" hint="Minimum 1 admin" />
              <SeatField label="Manager seats" id="seat-managers" name="seatManagers" defaultValue="3" />
              <SeatField label="Supervisor seats" id="seat-supervisors" name="seatSupervisors" defaultValue="5" />
              <SeatField label="User seats" id="seat-users" name="seatUsers" defaultValue="25" />
            </div>

            <Separator />

            <div className="grid gap-4 md:grid-cols-2">
              <div className="space-y-2">
                <Label htmlFor="admin-email">First Org Admin Email</Label>
                <Input id="admin-email" name="adminEmail" type="email" placeholder="admin@acme.com" required />
              </div>
              <div className="space-y-2">
                <Label htmlFor="admin-password">Password</Label>
                <Input id="admin-password" name="adminPassword" type="password" placeholder="Set a password" required />
              </div>
            </div>

            <Badge variant="outline" className="w-fit gap-2">
              <CalendarClock className="h-4 w-4" aria-hidden />
              Creates org + plan (if missing) + first Org Admin.
            </Badge>

            <div className="flex flex-wrap gap-3">
              <Button type="submit">
                <Save className="mr-2 h-4 w-4" aria-hidden />
                Save Organization
              </Button>
              <Button asChild variant="outline" type="button">
                <Link href="/dashboard-dikshithpodhila-god/orgs">Cancel</Link>
              </Button>
            </div>
          </CardContent>
        </Card>
      </form>
    </div>
  );
}

function SeatField({
  label,
  id,
  name,
  defaultValue,
  hint,
}: {
  label: string;
  id: string;
  name: string;
  defaultValue: string;
  hint?: string;
}) {
  return (
    <div className="space-y-2">
      <Label htmlFor={id}>{label}</Label>
      <Input id={id} name={name} type="number" min={hint ? 1 : 0} defaultValue={defaultValue} required />
      {hint ? <p className="text-xs text-muted-foreground">{hint}</p> : null}
    </div>
  );
}
