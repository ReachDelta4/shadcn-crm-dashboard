"use client";

import { useEffect, useState } from "react";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";

interface Note {
  id: string;
  content: string;
  created_at: string;
  updated_at: string;
}

interface LeadNotesPanelProps {
  subjectId: string | null;
}

export function LeadNotesPanel({ subjectId }: LeadNotesPanelProps) {
  const [notes, setNotes] = useState<Note[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [newContent, setNewContent] = useState("");
  const [submitting, setSubmitting] = useState(false);

  useEffect(() => {
    if (!subjectId) return;
    let cancelled = false;

    const load = async () => {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch(`/api/subjects/${subjectId}/notes`);
        if (!res.ok) {
          throw new Error(await res.text());
        }
        const payload = (await res.json()) as { notes?: Note[] };
        if (!cancelled) {
          setNotes(payload.notes || []);
        }
      } catch (e: any) {
        if (!cancelled) {
          setError(
            typeof e?.message === "string" ? e.message : "Failed to load notes"
          );
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, [subjectId]);

  const handleCreate = async () => {
    if (!subjectId || !newContent.trim()) return;
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch(`/api/subjects/${subjectId}/notes`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content: newContent.trim() }),
      });
      if (!res.ok) {
        throw new Error(await res.text());
      }
      const created = (await res.json()) as Note;
      setNotes((prev) => [created, ...prev]);
      setNewContent("");
    } catch (e: any) {
      setError(
        typeof e?.message === "string" ? e.message : "Failed to save note"
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (!subjectId) {
    return (
      <div className="text-sm text-muted-foreground">
        Notes will be available once this lead is linked to a subject.
      </div>
    );
  }

  return (
    <div className="space-y-3">
      {error ? (
        <div className="text-xs text-destructive bg-destructive/10 rounded px-2 py-1">
          {error}
        </div>
      ) : null}

      <div className="space-y-2">
        <Textarea
          placeholder="Write a note about this lead"
          value={newContent}
          onChange={(e) => setNewContent(e.target.value)}
          disabled={submitting}
        />
        <div className="flex justify-end">
          <Button
            size="sm"
            onClick={handleCreate}
            disabled={submitting || !newContent.trim()}
          >
            Add note
          </Button>
        </div>
      </div>

      <div className="space-y-2">
        {loading && notes.length === 0 ? (
          <div className="text-xs text-muted-foreground">Loading notes...</div>
        ) : null}
        {notes.length === 0 && !loading ? (
          <div className="text-xs text-muted-foreground">No notes yet.</div>
        ) : null}
        {notes.map((note) => (
          <div
            key={note.id}
            className="rounded border px-3 py-2 text-sm flex flex-col gap-1 bg-muted/40"
          >
            <div>{note.content}</div>
            <div className="text-[10px] text-muted-foreground">
              Created {new Date(note.created_at).toLocaleString()}
              {note.updated_at && note.updated_at !== note.created_at
                ? ` · Updated ${new Date(note.updated_at).toLocaleString()}`
                : ""}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}

