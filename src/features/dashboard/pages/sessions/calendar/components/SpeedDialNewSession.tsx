"use client";

import { useEffect, useState, useTransition } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Tabs, TabsList, TabsTrigger, TabsContent } from "@/components/ui/tabs";
import { Plus } from "lucide-react";
import { toast } from "sonner";
import type { LeadStatus } from "@/features/dashboard/pages/leads/types/lead";
import {
  APPOINTMENT_TARGET_STATUS,
  shouldAdvanceToQualified,
} from "@/features/leads/status-utils";

interface Props { onCreated?: () => void }

export function SpeedDialNewSession({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [pending, startTransition] = useTransition();
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Existing lead
  const [leads, setLeads] = useState<Array<{ id: string; full_name: string; email: string; status?: LeadStatus }>>([]);
  const [leadId, setLeadId] = useState<string | undefined>(undefined);

  // New lead
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [phone, setPhone] = useState("");
  const [company, setCompany] = useState("");

  // Appointment fields
  const [startAt, setStartAt] = useState<string>("");
  const [endAt, setEndAt] = useState<string>("");

  useEffect(() => { loadLeads(); }, []);

  async function loadLeads() {
    try {
      const res = await fetch('/api/leads?pageSize=50');
      if (!res.ok) return;
      const data = await res.json();
      const list = (data?.data || []).map((l: any) => ({
        id: l.id,
        full_name: l.full_name,
        email: l.email,
        status: l.status as LeadStatus | undefined,
      }));
      setLeads(list);
    } catch {}
  }

  function reset() {
    setLeadId(undefined);
    setFullName(""); setEmail(""); setPhone(""); setCompany("");
    setStartAt(""); setEndAt("");
    setTab("existing");
  }

  async function extractErrorMessage(res: Response): Promise<string> {
    try {
      const data = await res.json();
      return data?.error || data?.message || res.statusText || 'Request failed';
    } catch {
      try {
        return await res.text();
      } catch {
        return res.statusText || 'Request failed';
      }
    }
  }

  function validateDateRange(startValue: string, endValue: string): { start: Date; end: Date } {
    const startDate = new Date(startValue);
    const endDate = new Date(endValue);
    if (!startValue || Number.isNaN(startDate.getTime())) {
      throw new Error('Invalid start time');
    }
    if (!endValue || Number.isNaN(endDate.getTime())) {
      throw new Error('Invalid end time');
    }
    if (endDate <= startDate) {
      throw new Error('End time must be after start time');
    }
    return { start: startDate, end: endDate };
  }

  async function createAppointmentForLead(leadId: string, startIso: string, endIso: string) {
    const payload = {
      provider: 'none',
      start_at_utc: startIso,
      end_at_utc: endIso,
      timezone,
    };
    const res = await fetch(`/api/leads/${leadId}/appointments`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload),
    });
    if (!res.ok) {
      throw new Error(await extractErrorMessage(res));
    }
  }

  async function advanceLeadStatus(leadId: string, current?: LeadStatus) {
    if (!shouldAdvanceToQualified(current)) return;
    try {
      const res = await fetch(`/api/leads/${leadId}/transition`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ target_status: APPOINTMENT_TARGET_STATUS }),
      });
      if (!res.ok) {
        if (res.status === 409) return;
        const message = await extractErrorMessage(res);
        toast.warning(`Appointment saved, but lead status update failed: ${message}`);
      }
    } catch (error) {
      console.error('[calendar] Failed to advance lead status', error);
      toast.warning('Appointment saved, but lead status update failed');
    }
  }

  async function submitExisting() {
    if (!leadId) { toast.error("Select a lead"); return; }
    if (!startAt || !endAt) { toast.error("Set start and end time"); return; }
    let range: { start: Date; end: Date };
    try {
      range = validateDateRange(startAt, endAt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid schedule');
      return;
    }
    const startIso = range.start.toISOString();
    const endIso = range.end.toISOString();
    const selectedLead = leads.find(l => l.id === leadId);
    startTransition(async () => {
      try {
        await createAppointmentForLead(leadId, startIso, endIso);
        await advanceLeadStatus(leadId, selectedLead?.status);
        toast.success('Appointment scheduled');
        window.dispatchEvent(new Event('calendar:changed'));
        window.dispatchEvent(new Event('leads:changed'));
        await loadLeads();
        onCreated?.();
        setOpen(false); reset();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e || '');
        if (msg.toLowerCase().includes('overlap')) {
          toast.error('Selected time overlaps an existing appointment');
        } else if (msg) {
          toast.error(msg);
        } else {
          toast.error('Failed to schedule appointment');
        }
      }
    });
  }

  async function submitNewLead() {
    if (!fullName || !email) { toast.error("Full name and email are required"); return; }
    if (!startAt || !endAt) { toast.error("Set start and end time"); return; }
    let range: { start: Date; end: Date };
    try {
      range = validateDateRange(startAt, endAt);
    } catch (error) {
      toast.error(error instanceof Error ? error.message : 'Invalid schedule');
      return;
    }
    const startIso = range.start.toISOString();
    const endIso = range.end.toISOString();
    startTransition(async () => {
      try {
        const create = await fetch('/api/leads', {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({
            full_name: fullName.trim(), email: email.trim(), phone: phone.trim() || undefined, company: company.trim() || undefined, value: 0
          })
        });
        if (!create.ok) throw new Error(await create.text());
        const created = await create.json();
        const id = created?.id || created?.lead?.id || created?.data?.id;
        const initialStatus = (created?.status || created?.lead?.status || created?.data?.status) as LeadStatus | undefined;
        if (!id) throw new Error('Lead creation failed');
        await createAppointmentForLead(id, startIso, endIso);
        await advanceLeadStatus(id, initialStatus);
        toast.success('Lead created and appointment scheduled');
        window.dispatchEvent(new Event('calendar:changed'));
        window.dispatchEvent(new Event('leads:changed'));
        await loadLeads();
        onCreated?.();
        setOpen(false); reset();
      } catch (e) {
        const msg = e instanceof Error ? e.message : String(e || '');
        if (msg.toLowerCase().includes('overlap')) {
          toast.error('Selected time overlaps an existing appointment');
        } else if (msg) {
          toast.error(msg);
        } else {
          toast.error('Failed to create lead or schedule');
        }
      }
    });
  }

  return (
    <>
      <Button onClick={() => setOpen(true)} className="fixed bottom-6 right-6 shadow-lg" aria-label="Schedule session">
        <Plus className="mr-1 h-4 w-4" /> New Session
      </Button>
      <Dialog open={open} onOpenChange={(o) => { setOpen(o); if (!o) reset(); }}>
        <DialogContent className="max-w-xl">
          <DialogHeader>
            <DialogTitle>Schedule Session</DialogTitle>
          </DialogHeader>
          <Tabs value={tab} onValueChange={(v: any) => setTab(v)}>
            <TabsList>
              <TabsTrigger value="existing">Existing Lead</TabsTrigger>
              <TabsTrigger value="new">New Lead</TabsTrigger>
            </TabsList>
            <TabsContent value="existing" className="space-y-3">
              <div>
                <Label>Lead</Label>
                <Select value={leadId} onValueChange={(v: any) => setLeadId(v)}>
                  <SelectTrigger>
                    <SelectValue placeholder="Select lead" />
                  </SelectTrigger>
                  <SelectContent>
                    {leads.map(l => (
                      <SelectItem key={l.id} value={l.id}>{l.full_name} ({l.email})</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Start</Label>
                  <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div>
                  <Label>End</Label>
                  <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Timezone</Label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submitExisting} disabled={pending}>Schedule</Button>
              </DialogFooter>
            </TabsContent>
            <TabsContent value="new" className="space-y-3">
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
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
              </div>
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                <div>
                  <Label>Start</Label>
                  <Input type="datetime-local" value={startAt} onChange={(e) => setStartAt(e.target.value)} />
                </div>
                <div>
                  <Label>End</Label>
                  <Input type="datetime-local" value={endAt} onChange={(e) => setEndAt(e.target.value)} />
                </div>
              </div>
              <div>
                <Label>Timezone</Label>
                <Input value={timezone} onChange={(e) => setTimezone(e.target.value)} />
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setOpen(false)}>Cancel</Button>
                <Button onClick={submitNewLead} disabled={pending}>Create & Schedule</Button>
              </DialogFooter>
            </TabsContent>
          </Tabs>
        </DialogContent>
      </Dialog>
    </>
  );
}
