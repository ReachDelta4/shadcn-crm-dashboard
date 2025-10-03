"use client";

import { useState, useTransition } from "react";
import { Lead, LeadStatus } from "@/features/dashboard/pages/leads/types/lead";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Label } from "@/components/ui/label";
import { Input } from "@/components/ui/input";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

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
  "demo_appointment",
  "proposal_negotiation",
  "invoice_sent",
  "won",
  "lost",
];

export function EditLeadDialog({ lead, open, onOpenChange, onSaved }: EditLeadDialogProps) {
  const [fullName, setFullName] = useState(lead.fullName || "");
  const [email, setEmail] = useState(lead.email || "");
  const [phone, setPhone] = useState(lead.phone || "");
  const [company, setCompany] = useState(lead.company || "");
  const [value, setValue] = useState(String(lead.value ?? 0));
  const [status, setStatus] = useState<LeadStatus>((lead.status as LeadStatus) || "new");
  const [pending, startTransition] = useTransition();
  const [error, setError] = useState<string | null>(null);
  // Scheduling state for demo/appointment
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  function reset() {
    setFullName(lead.fullName || "");
    setEmail(lead.email || "");
    setPhone(lead.phone || "");
    setCompany(lead.company || "");
    setValue(String(lead.value ?? 0));
    setStatus((lead.status as LeadStatus) || "new");
    setError(null);
    setStartAt("");
    setEndAt("");
    setTimezone(Intl.DateTimeFormat().resolvedOptions().timeZone);
  }

  async function handleSave() {
    setError(null);
    // If moving to demo/appointment and scheduling provided, use transition API to enforce lifecycle and create appointment
    if (status === "demo_appointment") {
      if (!startAt || !endAt) {
        setError("Start and end time are required for demo/appointment");
        return;
      }
      startTransition(async () => {
        try {
          const res = await fetch(`/api/leads/${lead.id}/transition`, {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify({
              target_status: "demo_appointment",
              appointment: {
                provider: "none",
                start_at_utc: new Date(startAt).toISOString(),
                end_at_utc: new Date(endAt).toISOString(),
                timezone,
              },
            }),
          });
          if (!res.ok) throw new Error(await res.text());
          onSaved?.();
          onOpenChange(false);
        } catch (e: any) {
          setError(typeof e?.message === "string" ? e.message : "Failed to save lead");
        }
      });
      return;
    }

    const payload: any = {
      full_name: fullName.trim(),
      email: email.trim(),
      phone: phone.trim(),
      company: company.trim(),
      value: Number(value) || 0,
      status: status,
    };

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
        </div>

        {status === "demo_appointment" && (
          <div className="mt-4 grid grid-cols-1 sm:grid-cols-3 gap-4">
            <div>
              <Label>Start</Label>
              <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
            </div>
            <div>
              <Label>End</Label>
              <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
            </div>
            <div>
              <Label>Timezone</Label>
              <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
            </div>
          </div>
        )}

        {error && <div className="text-sm text-destructive bg-destructive/10 p-2 rounded mt-2">{error}</div>}

        <DialogFooter className="mt-4">
          <Button variant="outline" onClick={() => onOpenChange(false)}>Cancel</Button>
          <Button onClick={handleSave} disabled={pending}>{pending ? "Saving…" : "Save Changes"}</Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
}
