"use client";

import { useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";

type OrgMember = {
  id: string;
  user_id: string;
  role: string;
  status: string;
  created_at: string;
  updated_at?: string;
};

const roleOptions = [
  { value: "sales_rep", label: "Sales Rep" },
  { value: "supervisor", label: "Supervisor" },
  { value: "manager", label: "Manager" },
  { value: "director", label: "Director" },
  { value: "org_admin", label: "Org Admin" },
];

const statusLabels: Record<string, string> = {
  active: "Active",
  invited: "Invited",
  disabled: "Disabled",
};

export function UsersPermissionsPage() {
  const [members, setMembers] = useState<OrgMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seatInfo, setSeatInfo] = useState<{ activeReps: number; seatLimitReps: number | null }>({ activeReps: 0, seatLimitReps: null });
  const [licenseExpiresAt, setLicenseExpiresAt] = useState<string | null>(null);
  const [formUserId, setFormUserId] = useState("");
  const [formRole, setFormRole] = useState("sales_rep");
  const [submitting, setSubmitting] = useState(false);
  const [csvInfo, setCsvInfo] = useState<string | null>(null);

  const quotaLabel = useMemo(() => {
    if (seatInfo.seatLimitReps == null) return `${seatInfo.activeReps} active reps`;
    return `${seatInfo.activeReps} / ${seatInfo.seatLimitReps} reps`;
  }, [seatInfo]);

  async function fetchMembers() {
    setLoading(true);
    setError(null);
    try {
      const res = await fetch("/api/org/members", { cache: "no-store" });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to fetch members");
      }
      const data = await res.json();
      setMembers(data.members || []);
      setSeatInfo({
        activeReps: data.activeReps || 0,
        seatLimitReps: data.seatLimitReps ?? null,
      });
      setLicenseExpiresAt(data.licenseExpiresAt || null);
    } catch (err: any) {
      setError(err.message || "Failed to fetch members");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
  }, []);

  function handleCsvSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvInfo(`${file.name} (${Math.round(file.size / 1024)} KB) selected — parsing coming soon.`);
  }

  async function handleAddMember(e: React.FormEvent) {
    e.preventDefault();
    if (!formUserId.trim()) {
      setError("Supabase user ID is required");
      return;
    }
    setSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/org/members", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ userId: formUserId.trim(), role: formRole }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to add member");
      }
      setFormUserId("");
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || "Failed to add member");
    } finally {
      setSubmitting(false);
    }
  }

  async function handleStatusChange(memberId: string, nextStatus: string) {
    setError(null);
    try {
      const res = await fetch("/api/org/members", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ memberId, status: nextStatus }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to update member status");
      }
      await fetchMembers();
    } catch (err: any) {
      setError(err.message || "Failed to update member status");
    }
  }

  return (
    <div className="flex flex-col gap-6">
      <div className="flex flex-col gap-2">
        <h1 className="text-2xl font-bold tracking-tight">Users &amp; Permissions</h1>
        <p className="text-sm text-muted-foreground">
          Manage org members, assignments, and seat usage.
        </p>
      </div>

      <div className="rounded-lg border bg-card p-6">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div>
            <div className="text-sm text-muted-foreground">Sales rep seats</div>
            <div className="text-xl font-semibold">{quotaLabel}</div>
          </div>
          {licenseExpiresAt && (
            <div className="text-sm text-muted-foreground">
              License expires {new Date(licenseExpiresAt).toLocaleDateString()}
            </div>
          )}
        </div>
      </div>

      <form onSubmit={handleAddMember} className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Add member</h2>
          <p className="text-sm text-muted-foreground">
            Provide the Supabase user ID and desired role. Seats are enforced automatically.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            placeholder="Supabase User ID"
            value={formUserId}
            onChange={(e) => setFormUserId(e.target.value)}
          />
          <Select value={formRole} onValueChange={setFormRole}>
            <SelectTrigger>
              <SelectValue placeholder="Select role" />
            </SelectTrigger>
            <SelectContent>
              {roleOptions.map((role) => (
                <SelectItem key={role.value} value={role.value}>
                  {role.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button type="submit" disabled={submitting}>
            {submitting ? "Adding…" : "Add Member"}
          </Button>
        </div>
      </form>

      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div>
          <h2 className="text-lg font-semibold">CSV Import (skeleton)</h2>
          <p className="text-sm text-muted-foreground">
            Upload a CSV with columns: email, role (optional). Preview, validation, and bulk submit will be added.
          </p>
        </div>
        <Input type="file" accept=".csv" onChange={handleCsvSelect} />
        {csvInfo && (
          <div className="text-sm text-muted-foreground">
            {csvInfo}
          </div>
        )}
      </div>

      <div className="rounded-lg border bg-card p-0">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>User ID</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead className="text-right">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  Loading members…
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-10 text-muted-foreground">
                  No members found.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell className="font-mono text-xs">{member.user_id}</TableCell>
                  <TableCell className="capitalize">{member.role.replace('_', ' ')}</TableCell>
                  <TableCell>{statusLabels[member.status] || member.status}</TableCell>
                  <TableCell className="text-right">
                    {member.status === "active" ? (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(member.id, "disabled")}
                      >
                        Disable
                      </Button>
                    ) : (
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleStatusChange(member.id, "active")}
                      >
                        Activate
                      </Button>
                    )}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}
    </div>
  );
}
