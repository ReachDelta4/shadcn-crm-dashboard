"use client";

export const NOTE_MAX_LENGTH = 2000;

export interface SubjectReference {
  subjectId?: string | null;
  customerId?: string | null;
  leadId?: string | null;
}

function sanitizeContent(note: string): string {
  return note.trim().slice(0, NOTE_MAX_LENGTH);
}

async function fetchSubjectIdFromCustomer(customerId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/customers/${customerId}`);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return data?.subject_id ?? data?.subjectId ?? null;
  } catch (error) {
    console.error("[subject-notes] failed to resolve subject from customer", error);
    return null;
  }
}

async function fetchSubjectIdFromLead(leadId: string): Promise<string | null> {
  try {
    const res = await fetch(`/api/leads/${leadId}`);
    if (!res.ok) return null;
    const data = (await res.json()) as any;
    return data?.subject_id ?? data?.subjectId ?? null;
  } catch (error) {
    console.error("[subject-notes] failed to resolve subject from lead", error);
    return null;
  }
}

async function resolveSubjectId(ref: SubjectReference): Promise<string | null> {
  if (ref.subjectId) return ref.subjectId;
  if (ref.customerId) {
    const sid = await fetchSubjectIdFromCustomer(ref.customerId);
    if (sid) return sid;
  }
  if (ref.leadId) {
    const sid = await fetchSubjectIdFromLead(ref.leadId);
    if (sid) return sid;
  }
  return null;
}

export async function createSubjectNoteIfPresent(
  note: string,
  ref: SubjectReference,
  metadata?: Record<string, any>,
): Promise<{ posted: boolean; subjectId?: string | null; reason?: string; error?: string }> {
  const content = sanitizeContent(note);
  if (!content) return { posted: false, reason: "empty" };

  const subjectId = await resolveSubjectId(ref);
  if (!subjectId) return { posted: false, reason: "missing-subject" };

  try {
    const res = await fetch(`/api/subjects/${subjectId}/notes`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ content, metadata: metadata ?? {} }),
    });
    if (!res.ok) {
      const body = await res.json().catch(() => ({}));
      return {
        posted: false,
        subjectId,
        reason: "api-error",
        error: (body as any)?.error || res.statusText,
      };
    }
    return { posted: true, subjectId };
  } catch (error: any) {
    console.error("[subject-notes] failed to create note", error);
    return { posted: false, subjectId, reason: "network-error", error: error?.message };
  }
}

