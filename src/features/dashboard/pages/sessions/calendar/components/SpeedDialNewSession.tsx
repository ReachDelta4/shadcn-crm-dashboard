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

interface Props { onCreated?: () => void }

export function SpeedDialNewSession({ onCreated }: Props) {
  const [open, setOpen] = useState(false);
  const [tab, setTab] = useState<"existing" | "new">("existing");
  const [pending, startTransition] = useTransition();
  const [timezone, setTimezone] = useState(Intl.DateTimeFormat().resolvedOptions().timeZone);

  // Existing lead
  const [leads, setLeads] = useState<Array<{ id: string; full_name: string; email: string }>>([]);
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
      const list = (data?.data || []).map((l: any) => ({ id: l.id, full_name: l.full_name, email: l.email }));
      setLeads(list);
    } catch {}
  }

  function reset() {
    setLeadId(undefined);
    setFullName(""); setEmail(""); setPhone(""); setCompany("");
    setStartAt(""); setEndAt("");
    setTab("existing");
  }

  async function submitExisting() {
    if (!leadId) { toast.error("Select a lead"); return; }
    if (!startAt || !endAt) { toast.error("Set start and end time"); return; }
    startTransition(async () => {
      try {
        const payload = {
          target_status: 'demo_appointment',
          appointment: {
            provider: 'none',
            start_at_utc: new Date(startAt).toISOString(),
            end_at_utc: new Date(endAt).toISOString(),
            timezone,
          }
        };
        const res = await fetch(`/api/leads/${leadId}/transition`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success('Appointment scheduled');
        window.dispatchEvent(new Event('calendar:changed'));
        window.dispatchEvent(new Event('leads:changed'));
        onCreated?.();
        setOpen(false); reset();
      } catch (e) {
        const msg = typeof e === 'string' ? e : (e as any)?.message || '';
        if (msg.includes('409') || msg.toLowerCase().includes('overlap')) {
          toast.error('Selected time overlaps an existing appointment');
        } else {
          toast.error('Failed to schedule appointment');
        }
      }
    });
  }

  async function submitNewLead() {
    if (!fullName || !email) { toast.error("Full name and email are required"); return; }
    if (!startAt || !endAt) { toast.error("Set start and end time"); return; }
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
        if (!id) throw new Error('Lead creation failed');
        const payload = {
          target_status: 'demo_appointment',
          appointment: {
            provider: 'none',
            start_at_utc: new Date(startAt).toISOString(),
            end_at_utc: new Date(endAt).toISOString(),
            timezone,
          }
        };
        const res = await fetch(`/api/leads/${id}/transition`, {
          method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(payload)
        });
        if (!res.ok) throw new Error(await res.text());
        toast.success('Lead created and appointment scheduled');
        window.dispatchEvent(new Event('calendar:changed'));
        window.dispatchEvent(new Event('leads:changed'));
        onCreated?.();
        setOpen(false); reset();
      } catch (e) {
        const msg = typeof e === 'string' ? e : (e as any)?.message || '';
        if (msg.includes('409') || msg.toLowerCase().includes('overlap')) {
          toast.error('Selected time overlaps an existing appointment');
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


