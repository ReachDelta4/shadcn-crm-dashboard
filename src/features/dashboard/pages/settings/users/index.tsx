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

type OrgInvite = {
  id: string;
  email: string;
  role: string;
  status: string;
  expires_at: string;
  created_at: string;
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
  const [invitesLoading, setInvitesLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [seatInfo, setSeatInfo] = useState<{ activeReps: number; seatLimitReps: number | null }>({
    activeReps: 0,
    seatLimitReps: null,
  });
  const [licenseExpiresAt, setLicenseExpiresAt] = useState<string | null>(null);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("sales_rep");
  const [inviteSubmitting, setInviteSubmitting] = useState(false);
  const [csvInfo, setCsvInfo] = useState<string | null>(null);
  const [invites, setInvites] = useState<OrgInvite[]>([]);
  const [roleSeatSummary, setRoleSeatSummary] = useState<{
    limits: { admins: number; managers: number; supervisors: number; users: number };
    usage: { admins: number; managers: number; supervisors: number; users: number };
  } | null>(null);

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

  async function fetchInvites() {
    setInvitesLoading(true);
    try {
      const res = await fetch("/api/org/invites", { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const data = await res.json().catch(() => ({}));
      setInvites(data.invites || []);
    } finally {
      setInvitesLoading(false);
    }
  }

  useEffect(() => {
    fetchMembers();
    fetchInvites();
    fetchSeatSummary();
  }, []);

  async function fetchSeatSummary() {
    try {
      const res = await fetch("/api/org/summary", { cache: "no-store" });
      if (!res.ok) {
        return;
      }
      const data = await res.json().catch(() => ({}));
      if (data?.summary?.seatLimits && data?.summary?.seatUsage) {
        setRoleSeatSummary({
          limits: data.summary.seatLimits,
          usage: data.summary.seatUsage,
        });
      }
    } catch {
      // Seat summary is advisory; ignore failures and keep page functional.
    }
  }

  function handleCsvSelect(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    setCsvInfo(`${file.name} (${Math.round(file.size / 1024)} KB) selected (parsing coming soon).`);
  }

  async function handleInvite(e: React.FormEvent) {
    e.preventDefault();
    if (!inviteEmail.trim()) {
      setError("Email is required");
      return;
    }
    setInviteSubmitting(true);
    setError(null);
    try {
      const res = await fetch("/api/org/invites", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email: inviteEmail.trim(), role: inviteRole, expiresInDays: 14 }),
      });
      if (!res.ok) {
        const data = await res.json().catch(() => ({}));
        throw new Error(data?.error || "Failed to send invite");
      }
      setInviteEmail("");
      await fetchInvites();
    } catch (err: any) {
      setError(err.message || "Failed to send invite");
    } finally {
      setInviteSubmitting(false);
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
          Manage org members, assignments, seat usage, and invites.
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

      {roleSeatSummary && (
        <div className="rounded-lg border bg-card p-6 space-y-3">
          <div>
            <h2 className="text-lg font-semibold">Seats by role</h2>
            <p className="text-sm text-muted-foreground">
              Active members against configured limits for each role.
            </p>
          </div>
          <div className="grid gap-3 md:grid-cols-4 text-sm">
            {(["admins", "managers", "supervisors", "users"] as const).map((key) => {
              const used = roleSeatSummary.usage[key];
              const limit = roleSeatSummary.limits[key];
              const over = used > limit;
              const label =
                key === "admins"
                  ? "Org Admins"
                  : key === "users"
                  ? "Sales Reps"
                  : key.charAt(0).toUpperCase() + key.slice(1);
              return (
                <div key={key} className="rounded-md border px-3 py-2">
                  <div className="flex items-center justify-between">
                    <span className="text-xs text-muted-foreground">{label}</span>
                    <span className={`text-xs font-medium ${over ? "text-destructive" : ""}`}>
                      {used} / {limit}
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      <form onSubmit={handleInvite} className="rounded-lg border bg-card p-6 space-y-4">
        <div>
          <h2 className="text-lg font-semibold">Invite member</h2>
          <p className="text-sm text-muted-foreground">
            Send an email invite with a role. Seats and license limits are enforced automatically.
          </p>
        </div>
        <div className="grid gap-4 md:grid-cols-3">
          <Input
            type="email"
            placeholder="user@example.com"
            value={inviteEmail}
            onChange={(e) => setInviteEmail(e.target.value)}
          />
          <Select value={inviteRole} onValueChange={setInviteRole}>
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
          <Button type="submit" disabled={inviteSubmitting}>
            {inviteSubmitting ? "Sending..." : "Send Invite"}
          </Button>
        </div>
      </form>

      <div className="rounded-lg border bg-card p-6 space-y-3">
        <div>
          <h2 className="text-lg font-semibold">Pending invites</h2>
          <p className="text-sm text-muted-foreground">
            Track outstanding email invites and their roles.
          </p>
        </div>
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead>Email</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
              <TableHead>Expires</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {invitesLoading ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                  Loading invites...
                </TableCell>
              </TableRow>
            ) : invites.length === 0 ? (
              <TableRow>
                <TableCell colSpan={4} className="text-center py-6 text-sm text-muted-foreground">
                  No invites found.
                </TableCell>
              </TableRow>
            ) : (
              invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell>{invite.email}</TableCell>
                  <TableCell className="capitalize">{invite.role.replace("_", " ")}</TableCell>
                  <TableCell>{invite.status}</TableCell>
                  <TableCell>{invite.expires_at?.substring(0, 10)}</TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

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
                  Loading members...
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
                  <TableCell className="capitalize">{member.role.replace("_", " ")}</TableCell>
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
