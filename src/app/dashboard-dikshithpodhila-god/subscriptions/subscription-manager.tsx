"use client";

import { useState } from "react";
import { BadgeDollarSign, Loader2, RefreshCcw, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

export default function SubscriptionManager() {
  const [form, setForm] = useState({
    orgId: "",
    planId: "",
    billingStatus: "active",
    renewalMode: "auto_renew",
    trialEnd: "",
    currentPeriodEnd: "",
    warningAt: "",
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.orgId.trim()) {
      setError("orgId is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch("/api/god/subscriptions", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          orgId: form.orgId.trim(),
          planId: form.planId.trim() || null,
          billingStatus: form.billingStatus,
          renewalMode: form.renewalMode,
          trialEnd: form.trialEnd || null,
          currentPeriodEnd: form.currentPeriodEnd || null,
          warningAt: form.warningAt || null,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to update subscription");
      setSuccess("Subscription updated");
    } catch (err: any) {
      setError(err?.message || "Failed to update subscription");
    } finally {
      setLoading(false);
    }
  }

  function resetForm() {
    setForm({
      orgId: "",
      planId: "",
      billingStatus: "active",
      renewalMode: "auto_renew",
      trialEnd: "",
      currentPeriodEnd: "",
      warningAt: "",
    });
    setError(null);
    setSuccess(null);
  }

  return (
    <Card>
      <CardHeader className="flex flex-col gap-2">
        <div className="flex items-center gap-2">
          <BadgeDollarSign className="h-5 w-5 text-primary" aria-hidden />
          <CardTitle>Subscription Controls</CardTitle>
          <Badge variant="secondary">God-only</Badge>
        </div>
        <CardDescription>Assign plans, set billing status, renewal mode, and key dates for any org.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-id">Org ID</Label>
              <Input
                id="org-id"
                value={form.orgId}
                onChange={(e) => setForm((s) => ({ ...s, orgId: e.target.value }))}
                required
                placeholder="org uuid"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-id">Plan ID (optional)</Label>
              <Input
                id="plan-id"
                value={form.planId}
                onChange={(e) => setForm((s) => ({ ...s, planId: e.target.value }))}
                placeholder="plan uuid"
              />
            </div>
            <div className="space-y-2">
              <Label>Billing Status</Label>
              <Select
                value={form.billingStatus}
                onValueChange={(v) => setForm((s) => ({ ...s, billingStatus: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="past_due">Past Due</SelectItem>
                  <SelectItem value="canceled">Canceled</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label>Renewal Mode</Label>
              <Select
                value={form.renewalMode}
                onValueChange={(v) => setForm((s) => ({ ...s, renewalMode: v }))}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="auto_renew">Auto Renew</SelectItem>
                  <SelectItem value="manual">Manual</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="trial-end">Trial End (ISO)</Label>
              <Input
                id="trial-end"
                value={form.trialEnd}
                onChange={(e) => setForm((s) => ({ ...s, trialEnd: e.target.value }))}
                placeholder="2025-12-31T00:00:00Z"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="cpe">Current Period End (ISO)</Label>
              <Input
                id="cpe"
                value={form.currentPeriodEnd}
                onChange={(e) => setForm((s) => ({ ...s, currentPeriodEnd: e.target.value }))}
                placeholder="2025-12-31T00:00:00Z"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="warning">Warning At (ISO)</Label>
              <Input
                id="warning"
                value={form.warningAt}
                onChange={(e) => setForm((s) => ({ ...s, warningAt: e.target.value }))}
                placeholder="2025-12-15T00:00:00Z"
              />
            </div>
          </div>
          <Separator />
          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Subscription
            </Button>
            <Button type="button" variant="outline" onClick={resetForm} disabled={loading}>
              <RefreshCcw className="mr-2 h-4 w-4" />
              Reset
            </Button>
            {success && <Badge variant="outline">{success}</Badge>}
            {error && <Badge variant="destructive">{error}</Badge>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
