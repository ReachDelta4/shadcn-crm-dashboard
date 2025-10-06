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
  const [phone, setPhone] = useState<string>("");
  const [potentialValue, setPotentialValue] = useState<string>("");
  const [status, setStatus] = useState<
    "new" | "contacted" | "qualified" | "demo_appointment" | 
    "proposal_negotiation" | "invoice_sent" | "won" | "lost"
  >("new");
  const [source, setSource] = useState("");
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  // Scheduling state for demo/appointment
  const [schedDate, setSchedDate] = useState<Date | undefined>(undefined);
  const [startTime, setStartTime] = useState<string>("");
  const [durationMin, setDurationMin] = useState<string>("30");
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  const timezones = (() => {
    const anyIntl: any = Intl as any;
    if (typeof anyIntl.supportedValuesOf === 'function') {
      try { return (anyIntl.supportedValuesOf('timeZone') as string[]) || []; } catch {}
    }
    return [
      'UTC','Etc/UTC','Europe/London','Europe/Berlin','Europe/Paris','Europe/Madrid','Europe/Rome','Europe/Amsterdam','Europe/Prague','Europe/Warsaw',
      'Africa/Johannesburg','Africa/Cairo','Asia/Dubai','Asia/Kolkata','Asia/Colombo','Asia/Dhaka','Asia/Bangkok','Asia/Singapore','Asia/Shanghai','Asia/Tokyo',
      'Australia/Sydney','Australia/Melbourne','Pacific/Auckland','America/New_York','America/Chicago','America/Denver','America/Los_Angeles','America/Toronto',
      'America/Mexico_City','America/Sao_Paulo'
    ];
  })();

  function getTimeZoneOffsetMinutes(dateUtc: Date, tz: string): number {
    const dtf = new Intl.DateTimeFormat('en-US', {
      timeZone: tz,
      hour12: false,
      year: 'numeric', month: '2-digit', day: '2-digit',
      hour: '2-digit', minute: '2-digit', second: '2-digit'
    });
    const parts = dtf.formatToParts(dateUtc);
    const map: Record<string,string> = {};
    parts.forEach(p => { if (p.type !== 'literal') map[p.type] = p.value; });
    const asInTz = Date.UTC(Number(map.year), Number(map.month)-1, Number(map.day), Number(map.hour), Number(map.minute), Number(map.second));
    const asUtc = Date.UTC(dateUtc.getUTCFullYear(), dateUtc.getUTCMonth(), dateUtc.getUTCDate(), dateUtc.getUTCHours(), dateUtc.getUTCMinutes(), dateUtc.getUTCSeconds());
    return Math.round((asInTz - asUtc) / 60000);
  }

  function computeUtcRange(dateLocal: Date, timeHHMM: string, durationMinutes: number, tz: string): { startUtc: string; endUtc: string } {
    const [hh, mm] = timeHHMM.split(':').map(n => Number(n || 0));
    const naiveUtc = new Date(Date.UTC(dateLocal.getFullYear(), dateLocal.getMonth(), dateLocal.getDate(), hh, mm, 0, 0));
    const offsetMin = getTimeZoneOffsetMinutes(naiveUtc, tz);
    const startMs = naiveUtc.getTime() - offsetMin * 60000;
    const endMs = startMs + durationMinutes * 60000;
    return { startUtc: new Date(startMs).toISOString(), endUtc: new Date(endMs).toISOString() };
  }

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

    // Validate scheduling if demo_appointment
    let appointmentPayload: { start_at_utc: string; end_at_utc: string; timezone: string } | null = null;
    if (status === 'demo_appointment') {
      if (!schedDate || !startTime || !durationMin || !timezone) return; // required
      const durationNumber = Number(durationMin);
      if (!Number.isFinite(durationNumber) || durationNumber <= 0) return;
      const { startUtc, endUtc } = computeUtcRange(schedDate, startTime, durationNumber, timezone);
      // Ensure same local day in tz
      const dtf = new Intl.DateTimeFormat('en-CA', { timeZone: timezone, year: 'numeric', month: '2-digit', day: '2-digit' });
      const startLocal = dtf.format(new Date(startUtc));
      const endLocal = dtf.format(new Date(endUtc));
      if (startLocal !== endLocal) return;
      appointmentPayload = { start_at_utc: startUtc, end_at_utc: endUtc, timezone };
    }

    const res = await fetch('/api/leads', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(parsed.data) });
    if (res.ok) {
      const lead = await res.json().catch(() => null);
      const leadId = lead?.id || lead?.data?.id || lead?.lead?.id;
      if (status === 'demo_appointment' && leadId && appointmentPayload) {
        await fetch(`/api/leads/${leadId}/transition`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            target_status: 'demo_appointment',
            appointment: { provider: 'none', ...appointmentPayload }
          })
        }).catch(() => {})
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
                <SelectItem value="demo_appointment">Demo Appointment</SelectItem>
                <SelectItem value="proposal_negotiation">Proposal/Negotiation</SelectItem>
                <SelectItem value="invoice_sent">Invoice Sent</SelectItem>
                <SelectItem value="won">Won</SelectItem>
                <SelectItem value="lost">Lost</SelectItem>
              </SelectContent>
            </Select>
          </div>
          {status === 'demo_appointment' && (
            <div className="grid grid-cols-1 sm:grid-cols-4 gap-3">
              <div>
                <label className="text-sm">Date</label>
                <DatePicker date={schedDate} setDate={setSchedDate} />
              </div>
              <div>
                <label className="text-sm">Start Time</label>
                <Input type="time" value={startTime} onChange={(e) => setStartTime(e.target.value)} />
              </div>
              <div>
                <label className="text-sm">Duration</label>
                <Select value={durationMin} onValueChange={(v: any) => setDurationMin(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="10">10 minutes</SelectItem>
                    <SelectItem value="15">15 minutes</SelectItem>
                    <SelectItem value="30">30 minutes</SelectItem>
                    <SelectItem value="60">1 hour</SelectItem>
                    <SelectItem value="120">2 hours</SelectItem>
                    <SelectItem value="180">3 hours</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm">Timezone</label>
                <Select value={timezone} onValueChange={(v: any) => setTimezone(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select timezone" />
                  </SelectTrigger>
                  <SelectContent>
                    {timezones.map(tz => (
                      <SelectItem key={tz} value={tz}>{tz}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
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













































