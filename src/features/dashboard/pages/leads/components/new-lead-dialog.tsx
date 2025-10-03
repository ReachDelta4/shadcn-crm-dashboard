"use client";

import { useState } from "react";
import { z } from "zod";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().optional(),
  company: z.string().optional(),
  value: z.coerce.number().min(0).default(0),
  status: z.enum([
    "new",
    "contacted",
    "qualified",
    "demo_appointment",
    "proposal_negotiation",
    "invoice_sent",
    "won",
    "lost",
  ]).default("new"),
  source: z.string().optional(),
});

export function NewLeadDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [value, setValue] = useState<string>("");
  const [status, setStatus] = useState<
    "new" | "contacted" | "qualified" | "demo_appointment" | 
    "proposal_negotiation" | "invoice_sent" | "won" | "lost"
  >("new");
  const [source, setSource] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  // Scheduling state for demo/appointment
  const [startAt, setStartAt] = useState("");
  const [endAt, setEndAt] = useState("");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      full_name: name,
      email,
      phone: value,
      company,
      value: Number(value || 0),
      status,
      source,
    });
    if (!parsed.success) return;
    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
    if (res.ok) {
      const lead = await res.json().catch(() => null);
      const leadId = lead?.id || lead?.data?.id || lead?.lead?.id;
      if (status === 'demo_appointment' && leadId) {
        if (!startAt || !endAt) {
          // If status requires schedule but times not provided, skip transition (create only)
        } else {
          await fetch(`/api/leads/${leadId}/transition`, {
            method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
              target_status: 'demo_appointment',
              appointment: { provider: 'none', start_at_utc: new Date(startAt).toISOString(), end_at_utc: new Date(endAt).toISOString(), timezone }
            })
          }).catch(() => {})
        }
      }
      onCreated?.(); setOpen(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button>New Lead</Button>
      </DialogTrigger>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>New Lead</DialogTitle>
          <DialogDescription>Create a new lead.</DialogDescription>
        </DialogHeader>
        <form onSubmit={handleSubmit} className="grid gap-3">
          <Input placeholder="Full name" value={name} onChange={e=>setName(e.target.value)} required />
          <Input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
          <Input placeholder="Phone" value={value} onChange={e=>setValue(e.target.value)} />
          <Input placeholder="Company" value={company} onChange={e=>setCompany(e.target.value)} />
          <div className="grid gap-2">
            <label className="text-sm">Status</label>
            <Select value={status} onValueChange={(v: any) => setStatus(v)}>
              <SelectTrigger>
                <SelectValue placeholder="Select status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="new">New</SelectItem>
                <SelectItem value="contacted">Contacted</SelectItem>
                <SelectItem value="qualified">Qualified</SelectItem>
                <SelectItem value="demo_appointment">Demo Appointment</SelectItem>
                <SelectItem value="proposal_negotiation">Proposal/Negotiation</SelectItem>
                <SelectItem value="invoice_sent">Invoice Sent</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === 'demo_appointment' && (
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label className="text-sm">Start</label>
                <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">End</label>
                <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Timezone</label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
            </div>
          )}
          <DialogFooter>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}













































