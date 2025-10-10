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
import { DatePicker } from "@/components/shared/date-picker";

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
    "disqualified",
    "converted",
  ]).default("new"),
  source: z.string().optional(),
});

export function NewLeadDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState<string>("");
  const [potentialValue, setPotentialValue] = useState<string>("");
  const [status, setStatus] = useState<
    "new" | "contacted" | "qualified" | "disqualified" | "converted"
  >("new");
  const [source, setSource] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  // Removed legacy demo/appointment scheduling state

  // Removed legacy time zone support for demo appointments

  // Removed legacy time calculations for demo appointments

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse({
      full_name: name,
      email,
      phone,
      company,
      value: Number(potentialValue || 0),
      status,
      source,
    });
    if (!parsed.success) return;

    // Removed legacy demo appointment scheduling

    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
    if (res.ok) {
      // Legacy demo appointment flow removed
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
          <Input placeholder="Phone" value={phone} onChange={e=>setPhone(e.target.value)} />
          <Input placeholder="Company" value={company} onChange={e=>setCompany(e.target.value)} />
          <Input placeholder="Potential Value" type="number" min={0} value={potentialValue} onChange={e=>setPotentialValue(e.target.value)} />
          <Input placeholder="Source" value={source} onChange={e=>setSource(e.target.value)} />
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
                <SelectItem value="disqualified">Disqualified</SelectItem>
                <SelectItem value="converted">Won</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <DialogFooter>
            <Button type="submit">Create</Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}













































