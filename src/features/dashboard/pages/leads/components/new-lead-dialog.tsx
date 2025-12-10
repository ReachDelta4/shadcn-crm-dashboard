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
import { LEAD_SOURCES, leadSourceValues } from "@/features/leads/constants";
import { NoteField } from "@/features/dashboard/components/note-field";
import { createSubjectNoteIfPresent } from "@/features/dashboard/utils/subject-notes";
import { toast } from "sonner";
import { useEffect } from "react";
import { PhoneInput } from "@/components/ui/phone-input";
import { isValidPhoneNumber } from "react-phone-number-input";
import { buildLeadCreationIdempotencyKey } from "@/features/leads/status-utils";

const schema = z.object({
  full_name: z.string().min(1, "Name is required"),
  email: z.string().email("Valid email is required"),
  phone: z.string().min(1, "Phone is required"),
  company: z.string().optional(),
  value: z.coerce.number().min(0).default(0),
  status: z.enum([
    "new",
    "contacted",
    "qualified",
    "disqualified",
    "converted",
  ]).default("new"),
  source: z.enum(leadSourceValues as [string, ...string[]]).optional(),
});

export function NewLeadDialog({ onCreated }: { onCreated?: () => void }) {
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState<string>("");
  const [potentialValue, setPotentialValue] = useState<string>("");
  const [status, setStatus] = useState<
    "new" | "contacted" | "qualified" | "disqualified" | "converted"
  >("new");
  const [source, setSource] = useState<string | undefined>(undefined);
  const [email, setEmail] = useState("");
  const [name, setName] = useState("");
  const [company, setCompany] = useState("");
  const [note, setNote] = useState("");
  const [duplicateEmail, setDuplicateEmail] = useState(false);
  const [duplicatePhone, setDuplicatePhone] = useState(false);
  const [checkingDuplicate, setCheckingDuplicate] = useState(false);
  const [duplicateError, setDuplicateError] = useState<string | null>(null);
  const phoneIsValid = phone ? isValidPhoneNumber(phone) : false;
  const [submitting, setSubmitting] = useState(false);
  // Removed legacy demo/appointment scheduling state

  // Removed legacy time zone support for demo appointments

  // Removed legacy time calculations for demo appointments

  function resetForm() {
    setPhone("");
    setPotentialValue("");
    setStatus("new");
    setSource(undefined);
    setEmail("");
    setName("");
    setCompany("");
    setNote("");
    setDuplicateEmail(false);
    setDuplicatePhone(false);
    setCheckingDuplicate(false);
    setDuplicateError(null);
    setSubmitting(false);
  }

  useEffect(() => {
    const controller = new AbortController();
    const trimmedEmail = email.trim();
    const trimmedPhone = phone.trim();
    if (!trimmedEmail && !trimmedPhone) {
      setDuplicateEmail(false);
      setDuplicatePhone(false);
      setCheckingDuplicate(false);
      setDuplicateError(null);
      return () => controller.abort();
    }
    setCheckingDuplicate(true);
    setDuplicateError(null);
    const timer = setTimeout(async () => {
      try {
        const params = new URLSearchParams();
        if (trimmedEmail) params.set("email", trimmedEmail.toLowerCase());
        if (trimmedPhone && isValidPhoneNumber(trimmedPhone)) params.set("phone", trimmedPhone);
        const res = await fetch(`/api/leads/check-duplicates?${params.toString()}`, { signal: controller.signal });
        if (!res.ok) {
          setDuplicateError("Could not validate uniqueness");
          setDuplicateEmail(false);
          setDuplicatePhone(false);
          return;
        }
        const json = await res.json();
        setDuplicateEmail(Boolean(json?.duplicateEmail));
        setDuplicatePhone(Boolean(json?.duplicatePhone));
      } catch (error) {
        if (!(error instanceof DOMException && error.name === "AbortError")) {
          setDuplicateError("Could not validate uniqueness");
          setDuplicateEmail(false);
          setDuplicatePhone(false);
        }
      } finally {
        setCheckingDuplicate(false);
      }
    }, 250);
    return () => { clearTimeout(timer); controller.abort(); };
  }, [email, phone]);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (submitting) return;
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

    if (!phoneIsValid) { toast.error("Enter a valid phone number."); return; }
    if (duplicateEmail || duplicatePhone || checkingDuplicate) { toast.warning("Please provide a unique email and phone number before creating the lead."); return; }

    // Removed legacy demo appointment scheduling

    try {
      setSubmitting(true);
      const idempotencyKey =
        buildLeadCreationIdempotencyKey({
          fullName: name.trim(),
          email: email.trim().toLowerCase(),
          phone: phone.trim(),
          company: company.trim(),
        }) ?? undefined;

      const headers: Record<string, string> = { 'Content-Type': 'application/json' };
      if (idempotencyKey) headers['Idempotency-Key'] = idempotencyKey;

      const res = await fetch('/api/leads', { method: 'POST', headers, body: JSON.stringify(parsed.data) });
      if (!res.ok) {
        toast.error("Failed to create lead");
        return;
      }
      const created = await res.json().catch(() => null);

      if (note.trim()) {
        const noteResult = await createSubjectNoteIfPresent(note, {
          subjectId: created?.subject_id ?? created?.subjectId ?? null,
          leadId: created?.id,
        });
        if (!noteResult.posted && noteResult.reason !== "empty") {
          toast.warning(noteResult.reason === "missing-subject" ? "Lead created, but notes require a subject to save." : "Lead created, but note could not be saved.");
        }
      }

      onCreated?.();
      resetForm();
      setOpen(false);
    } catch (error) {
      toast.error("Failed to create lead");
    } finally {
      setSubmitting(false);
    }
  }

  return (
    <Dialog open={open} onOpenChange={(next) => { setOpen(next); if (!next) resetForm(); }}>
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
          <div className="grid gap-1.5">
            <Input placeholder="Email" type="email" value={email} onChange={e=>setEmail(e.target.value)} required />
            {duplicateEmail && <p className="text-xs text-destructive">This email already exists in your organization.</p>}
          </div>
          <div className="grid gap-1.5">
            <PhoneInput
              placeholder="Phone"
              value={phone}
              defaultCountry="IN"
              onChange={(val) => setPhone((val as string) || "")}
              required
            />
            {!phoneIsValid && phone && <p className="text-xs text-destructive">Enter a valid phone number.</p>}
            {duplicatePhone && <p className="text-xs text-destructive">This phone number already exists in your organization.</p>}
          </div>
          {duplicateError && <p className="text-xs text-destructive">{duplicateError}</p>}
          <Input placeholder="Company" value={company} onChange={e=>setCompany(e.target.value)} />
          <Input placeholder="Potential Value" type="number" min={0} value={potentialValue} onChange={e=>setPotentialValue(e.target.value)} />
          <div className="grid gap-2">
            <label className="text-sm">Source</label>
            <Select
              value={source}
              onValueChange={(v) => setSource(v as any)}
            >
              <SelectTrigger>
                <SelectValue placeholder="Select source" />
              </SelectTrigger>
              <SelectContent>
                {LEAD_SOURCES.map(s => (
                  <SelectItem key={s.value} value={s.value}>
                    {s.label}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
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
          <NoteField value={note} onChange={setNote} />
          <DialogFooter>
            <Button type="submit" disabled={submitting || duplicateEmail || duplicatePhone || checkingDuplicate || !phoneIsValid || !phone.trim()}>
              {submitting ? "Creating..." : checkingDuplicate ? "Validating..." : "Create"}
            </Button>
          </DialogFooter>
        </form>
      </DialogContent>
    </Dialog>
  );
}





































