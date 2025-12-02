"use client";

import { useMemo, useState } from "react";
import { BookOpenCheck, Loader2, Pencil, Plus, RefreshCcw, Save, ShieldCheck } from "lucide-react";
import { z } from "zod";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Textarea } from "@/components/ui/textarea";
import { Separator } from "@/components/ui/separator";
import { cn } from "@/lib/utils";

const planSchema = z.object({
  name: z.string().min(1),
  status: z.enum(["active", "inactive"]),
  billing_mode: z.string().min(1),
  feature_flags: z.string().optional(),
  seat_presets: z.object({
    admins: z.string(),
    managers: z.string(),
    supervisors: z.string(),
    users: z.string(),
  }),
});

type Plan = {
  id: string;
  name: string;
  status: string;
  billing_mode: string;
  feature_flags: Record<string, unknown>;
  seat_presets: Record<string, number>;
  created_at?: string;
  updated_at?: string;
};

export default function PlanManager({ plans }: { plans: Plan[] }) {
  const [items, setItems] = useState<Plan[]>(plans || []);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    status: "active",
    billing_mode: "monthly",
    feature_flags: "{}",
    seat_presets: {
      admins: "1",
      managers: "0",
      supervisors: "0",
      users: "0",
    },
  });
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  const parsedFlags = useMemo(() => {
    try {
      return JSON.stringify(JSON.parse(form.feature_flags || "{}"), null, 2);
    } catch {
      return form.feature_flags;
    }
  }, [form.feature_flags]);

  async function refresh() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/god/plans", { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load plans");
      setItems(json.plans || []);
      setSuccess("Plans refreshed");
    } catch (err: any) {
      setError(err?.message || "Failed to refresh");
    } finally {
      setLoading(false);
    }
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    const parsed = planSchema.safeParse(form);
    if (!parsed.success) {
      setError("Please fix validation errors");
      return;
    }
    let featureFlags: any = {};
    try {
      featureFlags = form.feature_flags ? JSON.parse(form.feature_flags) : {};
    } catch {
      setError("Feature flags must be valid JSON");
      return;
    }
    const seatPresets = Object.fromEntries(
      Object.entries(form.seat_presets).map(([k, v]) => [k, Number(v)])
    );
    if (Object.values(seatPresets).some((v) => !Number.isFinite(v) || v < 0)) {
      setError("Seat presets must be non-negative numbers");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/god/plans", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          status: form.status,
          billingMode: form.billing_mode,
          featureFlags,
          seatPresets,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to create plan");
      setSuccess("Plan created");
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to create plan");
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdate(plan: Plan) {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch("/api/god/plans", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          id: plan.id,
          name: plan.name,
          status: plan.status,
          billingMode: plan.billing_mode,
          featureFlags: plan.feature_flags || {},
          seatPresets: plan.seat_presets || {},
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update plan");
      setSuccess(`Updated ${plan.name}`);
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to update plan");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BookOpenCheck className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle>Plan Catalog</CardTitle>
          <Badge variant="secondary">{items.length} plans</Badge>
        </div>
        <CardDescription>Manage plans, billing mode, feature flags, and seat presets.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-6">
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="plan-name">Name</Label>
              <Input
                id="plan-name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                placeholder="Pro, Enterprise"
                required
              />
            </div>
            <div className="space-y-2">
              <Label>Status</Label>
              <Select
                value={form.status}
                onValueChange={(v) => setForm((s) => ({ ...s, status: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="billing-mode">Billing Mode</Label>
              <Input
                id="billing-mode"
                value={form.billing_mode}
                onChange={(e) => setForm((s) => ({ ...s, billing_mode: e.target.value }))}
                placeholder="monthly | annual | custom"
              />
            </div>
            <div className="space-y-2">
              <Label>Feature Flags (JSON)</Label>
              <Textarea
                value={form.feature_flags}
                onChange={(e) => setForm((s) => ({ ...s, feature_flags: e.target.value }))}
                className="font-mono"
                rows={4}
              />
              <p className="text-xs text-muted-foreground">Parsed preview:</p>
              <pre className="rounded bg-muted p-2 text-xs">{parsedFlags}</pre>
            </div>
          </div>
          <Separator />
          <div className="grid gap-4 md:grid-cols-4">
            {["admins", "managers", "supervisors", "users"].map((role) => (
              <div className="space-y-2" key={role}>
                <Label className="capitalize">{role}</Label>
                <Input
                  type="number"
                  min={0}
                  value={(form.seat_presets as any)[role]}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      seat_presets: { ...s.seat_presets, [role]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading}>
              <Plus className="mr-2 h-4 w-4" aria-hidden />
              Create Plan
            </Button>
            <Button type="button" variant="outline" onClick={refresh} disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <RefreshCcw className="mr-2 h-4 w-4" />}
              Refresh
            </Button>
            {success && <Badge variant="outline">{success}</Badge>}
            {error && <Badge variant="destructive">{error}</Badge>}
          </div>
        </form>

        <Separator />

        <div className="space-y-3">
          <div className="text-sm text-muted-foreground">Existing plans</div>
          <div className="grid gap-3 md:grid-cols-2">
            {items.map((plan) => (
              <Card key={plan.id} className="border-muted">
                <CardHeader className="pb-3">
                  <div className="flex items-center justify-between gap-2">
                    <div className="flex items-center gap-2">
                      <ShieldCheck className="h-4 w-4 text-primary" aria-hidden />
                      <CardTitle className="text-base">{plan.name}</CardTitle>
                      <Badge variant={plan.status === "active" ? "default" : "secondary"}>{plan.status}</Badge>
                    </div>
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => handleUpdate(plan)}
                      disabled={loading}
                      className="gap-1"
                    >
                      <Pencil className="h-3.5 w-3.5" />
                      Save
                    </Button>
                  </div>
                  <CardDescription className="text-xs">
                    Billing: {plan.billing_mode || "n/a"} • Updated: {plan.updated_at || "—"}
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2 text-sm">
                  <div className="rounded border bg-muted/30 p-2">
                    <div className="text-xs font-semibold">Seat presets</div>
                    <div className="flex flex-wrap gap-2 text-xs">
                      {["admins", "managers", "supervisors", "users"].map((role) => (
                        <Badge key={role} variant="outline" className={cn(plan.seat_presets?.[role] > 0 ? "" : "opacity-60")}>
                          {role}: {plan.seat_presets?.[role] ?? 0}
                        </Badge>
                      ))}
                    </div>
                  </div>
                  <div className="rounded border bg-muted/30 p-2">
                    <div className="text-xs font-semibold">Feature flags</div>
                    <pre className="max-h-32 overflow-auto text-xs">
                      {JSON.stringify(plan.feature_flags || {}, null, 2)}
                    </pre>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
          {items.length === 0 && (
            <div className="rounded-md border border-dashed p-4 text-sm text-muted-foreground">
              No plans yet. Create one to get started.
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
