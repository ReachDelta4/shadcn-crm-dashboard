"use client";

import { useState, useTransition } from "react";
import { Lead, LeadStatus } from "@/features/dashboard/pages/leads/types/lead";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { LeadTransitionDialog } from "./lead-transition-dialog";

interface EditLeadDialogProps {
  lead: Lead;
  open: boolean;
  onOpenChange: (open: boolean) => void;
  onSaved?: () => void;
}

const STATUS_OPTIONS: LeadStatus[] = [
  "new",
  "contacted",
  "qualified",
  "disqualified",
  "converted",
];

export function EditLeadDialog({ lead, open, onOpenChange, onSaved }: EditLeadDialogProps) {
  const [fullName, setFullName] = useState(lead.fullName || "");
  const [email, setEmail] = useState(lead.email || "");
  const [phone, setPhone] = useState(lead.phone || "");
  const [company, setCompany] = useState(lead.company || "");
  const [value, setValue] = useState(String(lead.value ?? 0));
  const [status, setStatus] = useState<LeadStatus>((lead.status as LeadStatus) || "new");
  const [source, setSource] = useState<string>((lead as any).source || "");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  const [openTransition, setOpenTransition] = useState<null>(null)
  const [submitting, setSubmitting] = useState(false);

  function reset() {
    setFullName(lead.fullName || "");
    setEmail(lead.email || "");
    setPhone(lead.phone || "");
    setCompany(lead.company || "");
    setValue(String(lead.value ?? 0));
    setStatus((lead.status as LeadStatus) || "new");
    setSource((lead as any).source || "");
    setError(null);
  }

  async function handleSave() {
    setError(null);
    if (submitting || pending) return;
    const payload: any = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      value: Number(value) || 0,
      status: status,
      source: source || undefined,
    };

    setSubmitting(true);
    startTransition(async () => {
      try {
        const res = await fetch(`/api/leads/${lead.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
        if (!res.ok) throw new Error(await res.text());
        onSaved?.();
        onOpenChange(false);
      } catch (e: any) {
        setError(typeof e?.message === "string" ? e.message : "Failed to save lead");
      } finally {
        setSubmitting(false);
      }
    });
  }

  return (
    <Dialog open={open} onOpenChange={(o) => { onOpenChange(o); if (!o) reset(); }}>
      <DialogContent className="max-w-xl">
        <DialogHeader>
          <DialogTitle>Edit Lead</DialogTitle>
        </DialogHeader>

        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <Label>Full Name</Label>
            <Input value={fullName} onChange={(e) => setFullName(e.target.value)} />
          </div>
          <div>
            <Label>Email</Label>
            <Input type="email" value={email} onChange={(e) => setEmail(e.target.value)} />
          </div>
          <div>
            <Label>Phone</Label>
            <Input value={phone} onChange={(e) => setPhone(e.target.value)} />
          </div>
          <div>
            <Label>Company</Label>
            <Input value={company} onChange={(e) => setCompany(e.target.value)} />
          </div>
          <div>
            <Label>Status</Label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                {STATUS_OPTIONS.map((s) => (
                  <SelectItem key={s} value={s}>{s.replace(/_/g, " ")}</SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div>
            <Label>Potential Value</Label>
            <Input type="number" min={0} value={value} onChange={(e) => setValue(e.target.value)} />
          </div>
          <div className="sm:col-span-2">
            <Label>Source</Label>
            <Input value={source} onChange={(e) => setSource(e.target.value)} />
          </div>
        </div>

        {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-2">{error}</div>}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)} disabled={pending || submitting}>Cancel</Button>
          <Button onClick={handleSave} disabled={pending || submitting}>{pending || submitting ? "Saving..." : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
      {/* Transition dialog removed in lifecycle v2 */}
    </Dialog>
  );
}
