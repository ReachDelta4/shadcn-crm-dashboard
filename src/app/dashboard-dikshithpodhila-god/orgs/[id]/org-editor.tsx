"use client";

import { useState } from "react";
import { Loader2, Save } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Separator } from "@/components/ui/separator";

type Org = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  planId?: string | null;
  licenseExpiresAt: string | null;
  seatLimits: { admins: number; managers: number; supervisors: number; users: number };
};

export default function OrgEditor({ org }: { org: Org }) {
  const [form, setForm] = useState({
    name: org.name,
    slug: org.slug || "",
    status: org.status,
    planId: org.planId || "",
    licenseEnd: org.licenseExpiresAt ? org.licenseExpiresAt.substring(0, 10) : "",
    seatLimits: {
      admins: String(org.seatLimits.admins ?? 1),
      managers: String(org.seatLimits.managers ?? 0),
      supervisors: String(org.seatLimits.supervisors ?? 0),
      users: String(org.seatLimits.users ?? 0),
    },
  });
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);

    const seatLimits = Object.fromEntries(
      Object.entries(form.seatLimits).map(([k, v]) => [k, Number(v)])
    );
    if (Object.values(seatLimits).some((v) => !Number.isFinite(v) || v < 0)) {
      setError("Seat limits must be non-negative numbers");
      return;
    }
    if (seatLimits.admins < 1) {
      setError("Admin seat limit must be at least 1");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch(`/api/god/orgs/${org.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          name: form.name.trim(),
          slug: form.slug.trim() || null,
          status: form.status,
          planId: form.planId.trim() || null,
          licenseEnd: form.licenseEnd ? new Date(form.licenseEnd).toISOString() : null,
          seatLimits,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Update failed");
      setSuccess("Organization updated");
    } catch (err: any) {
      setError(err?.message || "Update failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Edit Organization</CardTitle>
        <CardDescription>Update plan, status, license, and seat limits.</CardDescription>
      </CardHeader>
      <CardContent>
        <form onSubmit={handleSubmit} className="space-y-4">
          <div className="grid gap-4 md:grid-cols-2">
            <div className="space-y-2">
              <Label htmlFor="org-name">Name</Label>
              <Input
                id="org-name"
                value={form.name}
                onChange={(e) => setForm((s) => ({ ...s, name: e.target.value }))}
                required
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="org-slug">Slug</Label>
              <Input
                id="org-slug"
                value={form.slug}
                onChange={(e) => setForm((s) => ({ ...s, slug: e.target.value }))}
                placeholder="optional"
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
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-2">
              <Label htmlFor="plan-id">Plan ID</Label>
              <Input
                id="plan-id"
                value={form.planId}
                onChange={(e) => setForm((s) => ({ ...s, planId: e.target.value }))}
                placeholder="optional"
              />
            </div>
            <div className="space-y-2">
              <Label htmlFor="license-end">License End (YYYY-MM-DD)</Label>
              <Input
                id="license-end"
                value={form.licenseEnd}
                onChange={(e) => setForm((s) => ({ ...s, licenseEnd: e.target.value }))}
                placeholder="2025-12-31"
              />
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
                  value={(form.seatLimits as any)[role]}
                  onChange={(e) =>
                    setForm((s) => ({
                      ...s,
                      seatLimits: { ...s.seatLimits, [role]: e.target.value },
                    }))
                  }
                />
              </div>
            ))}
          </div>

          <div className="flex flex-wrap items-center gap-3">
            <Button type="submit" disabled={loading}>
              {loading ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : <Save className="mr-2 h-4 w-4" />}
              Save Changes
            </Button>
            {success && <Badge variant="outline">{success}</Badge>}
            {error && <Badge variant="destructive">{error}</Badge>}
          </div>
        </form>
      </CardContent>
    </Card>
  );
}
