"use client";

import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { NOTE_MAX_LENGTH } from "@/features/dashboard/utils/subject-notes";

interface NoteFieldProps {
  id?: string;
  label?: string;
  helperText?: string;
  value: string;
  onChange: (value: string) => void;
  placeholder?: string;
}

export function NoteField({
  id = "notes",
  label = "Notes",
  helperText = "Add context, commitments, or next steps. Plain text only.",
  value,
  onChange,
  placeholder = "Add notes (optional)",
}: NoteFieldProps) {
  return (
    <div className="grid gap-2">
      <div className="flex items-center justify-between gap-2">
        <Label htmlFor={id}>{label}</Label>
        <span className="text-xs text-muted-foreground">{value.length}/{NOTE_MAX_LENGTH}</span>
      </div>
      <Textarea
        id={id}
        value={value}
        onChange={(e) => onChange(e.target.value)}
        placeholder={placeholder}
        maxLength={NOTE_MAX_LENGTH}
        rows={4}
      />
      <p className="text-xs text-muted-foreground">{helperText}</p>
    </div>
  );
}

