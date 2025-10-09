"use client";

import { useCallback, useEffect, useState, useTransition } from "react";
import { Plus } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Dialog, DialogTrigger, DialogContent, DialogHeader, DialogTitle, DialogFooter, DialogClose } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Select, SelectTrigger, SelectValue, SelectContent, SelectItem } from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";

interface ManagePlansModalProps {
  productId: string;
  productName: string;
}

export function ManagePlansModal({ productId, productName }: ManagePlansModalProps) {
  const [open, setOpen] = useState(false);
  const [plans, setPlans] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);

  // New plan form
  const [name, setName] = useState("");
  const [numInstallments, setNumInstallments] = useState(3);
  const [intervalType, setIntervalType] = useState<string>("monthly");
  const [intervalDays, setIntervalDays] = useState<number | undefined>(undefined);
  const [downPayment, setDownPayment] = useState(0);

  const loadPlans = useCallback(async () => {
    setLoading(true);
    try {
      const res = await fetch(`/api/products/${productId}/plans`);
      if (!res.ok) throw new Error("Failed to load plans");
      const data = await res.json();
      setPlans(data.plans || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load plans");
    } finally {
      setLoading(false);
    }
  }, [productId]);

  useEffect(() => {
    if (open) {
      loadPlans();
    }
  }, [open, loadPlans]);

  function resetForm() {
    setName("");
    setNumInstallments(3);
    setIntervalType("monthly");
    setIntervalDays(undefined);
    setDownPayment(0);
    setError(null);
  }

  async function handleCreate() {
    setError(null);
    if (!name.trim()) {
      setError("Plan name is required");
      return;
    }
    if (numInstallments < 1) {
      setError("Number of installments must be at least 1");
      return;
    }

    startTransition(async () => {
      try {
        const payload: any = {
          name: name.trim(),
          num_installments: numInstallments,
          interval_type: intervalType,
          down_payment_minor: Math.round(downPayment * 100),
          active: true,
        };
        if (intervalType === "custom_days" && intervalDays) {
          payload.interval_days = intervalDays;
        }

        const res = await fetch(`/api/products/${productId}/plans`, {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });

        if (!res.ok) {
          const body = await res.json().catch(() => ({}));
          throw new Error(body?.error || "Failed to create plan");
        }

        await loadPlans();
        resetForm();
      } catch (err: any) {
        setError(err?.message || "Failed to create plan");
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) resetForm(); }}>
      <DialogTrigger asChild>
        <Button variant="outline" size="sm">
          <Plus className="size-4 mr-1" />
          Manage Plans
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-[700px] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Manage Payment Plans - {productName}</DialogTitle>
        </DialogHeader>

        <div className="grid gap-6">
          {/* Existing plans */}
          {loading ? (
            <div className="text-sm text-muted-foreground">Loading plans...</div>
          ) : plans.length > 0 ? (
            <Card>
              <CardHeader>
                <CardTitle className="text-sm">Existing Plans</CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                {plans.map((plan: any) => (
                  <div key={plan.id} className="flex items-center justify-between border rounded p-3">
                    <div>
                      <div className="text-sm font-medium">{plan.name}</div>
                      <div className="text-xs text-muted-foreground">
                        {plan.num_installments} installments • {plan.interval_type} • Down: ₹{((plan.down_payment_minor || 0) / 100).toFixed(2)}
                      </div>
                    </div>
                    <div className="text-xs text-muted-foreground">{plan.active ? "Active" : "Inactive"}</div>
                  </div>
                ))}
              </CardContent>
            </Card>
          ) : (
            <div className="text-sm text-muted-foreground">No plans yet. Create one below.</div>
          )}

          {/* Create new plan */}
          <Card>
            <CardHeader>
              <CardTitle className="text-sm">Create New Plan</CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="grid gap-2">
                <Label>Plan Name</Label>
                <Input value={name} onChange={(e) => setName(e.target.value)} placeholder="e.g., 3-Month Plan" />
              </div>

              <div className="grid gap-4 sm:grid-cols-2">
                <div className="grid gap-2">
                  <Label>Number of Installments</Label>
                  <Input type="number" min={1} value={numInstallments} onChange={(e) => setNumInstallments(parseInt(e.target.value) || 1)} />
                </div>
                <div className="grid gap-2">
                  <Label>Interval Type</Label>
                  <Select value={intervalType} onValueChange={setIntervalType}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="weekly">Weekly</SelectItem>
                      <SelectItem value="monthly">Monthly</SelectItem>
                      <SelectItem value="quarterly">Quarterly</SelectItem>
                      <SelectItem value="semiannual">Semiannual</SelectItem>
                      <SelectItem value="annual">Annual</SelectItem>
                      <SelectItem value="custom_days">Custom Days</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {intervalType === "custom_days" && (
                <div className="grid gap-2">
                  <Label>Custom Interval (Days)</Label>
                  <Input type="number" min={1} value={intervalDays || ""} onChange={(e) => setIntervalDays(e.target.value ? parseInt(e.target.value) : undefined)} />
                </div>
              )}

              <div className="grid gap-2">
                <Label>Down Payment (₹)</Label>
                <Input type="number" min={0} step="0.01" value={downPayment} onChange={(e) => setDownPayment(parseFloat(e.target.value) || 0)} />
              </div>

              {error && (
                <div className="text-sm text-destructive bg-destructive/10 p-3 rounded-md">{error}</div>
              )}

              <Button onClick={handleCreate} disabled={pending} className="w-full">
                {pending ? "Creating..." : "Create Plan"}
              </Button>
            </CardContent>
          </Card>
        </div>

        <DialogFooter>
          <DialogClose asChild>
            <Button variant="outline">Close</Button>
          </DialogClose>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
