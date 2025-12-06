"use client";

import { useCallback, useEffect, useState } from "react";
import { Clock, RefreshCcw, Send, ShieldX, TimerReset } from "lucide-react";

import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";

type Invite = {
  id: string;
  email: string;
  role: string;
  status: string;
  token: string;
  expires_at: string;
  created_at: string;
  accepted_user_id?: string | null;
};

export default function InvitesPanel({ orgId }: { orgId: string }) {
  const [invites, setInvites] = useState<Invite[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);
  const [form, setForm] = useState({ email: "", role: "sales_rep", expiresInDays: 14 });
  const [confirmInviteId, setConfirmInviteId] = useState<string | null>(null);

  const refresh = useCallback(async () => {
    setLoading(true);
    setError(null);
    setSuccess(null);
    try {
      const res = await fetch(`/api/god/orgs/${orgId}/invites`, { cache: "no-store" });
      const json = await res.json();
      if (!res.ok) throw new Error(json.error || "Failed to load invites");
      setInvites(json.invites || []);
    } catch (err: any) {
      setError(err?.message || "Failed to load invites");
    } finally {
      setLoading(false);
    }
  }, [orgId]);

  useEffect(() => {
    refresh();
  }, [refresh]);

  async function createInvite(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setSuccess(null);
    if (!form.email.trim()) {
      setError("Email is required");
      return;
    }
    setLoading(true);
    try {
      const res = await fetch(`/api/god/orgs/${orgId}/invites`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim(),
          role: form.role,
          expiresInDays: form.expiresInDays,
        }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || "Failed to create invite");
      setSuccess("Invite created");
      setForm((s) => ({ ...s, email: "" }));
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Failed to create invite");
    } finally {
      setLoading(false);
    }
  }

  async function act(inviteId: string, action: "revoke" | "extend" | "resend") {
    setError(null);
    setSuccess(null);
    setLoading(true);
    try {
      const res = await fetch(`/api/god/orgs/${orgId}/invites`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ inviteId, action, expiresInDays: action === "extend" ? 14 : undefined }),
      });
      const json = await res.json().catch(() => ({}));
      if (!res.ok) throw new Error(json.error || `Failed to ${action}`);
      setSuccess(`${action} successful`);
      await refresh();
    } catch (err: any) {
      setError(err?.message || "Action failed");
    } finally {
      setLoading(false);
    }
  }

  function requestRevoke(inviteId: string) {
    setConfirmInviteId(inviteId);
    setSuccess(null);
    setError(null);
  }

  return (
    <Card>
      <CardHeader>
        <CardTitle>Invites</CardTitle>
        <CardDescription>Create and manage pending org invites.</CardDescription>
      </CardHeader>
      <CardContent className="space-y-4">
        <form onSubmit={createInvite} className="grid gap-3 md:grid-cols-4 items-end">
          <div className="space-y-2 md:col-span-2">
            <Label htmlFor="invite-email">Email</Label>
            <Input
              id="invite-email"
              type="email"
              value={form.email}
              onChange={(e) => setForm((s) => ({ ...s, email: e.target.value }))}
              placeholder="user@example.com"
              required
            />
          </div>
          <div className="space-y-2">
            <Label>Role</Label>
            <Select value={form.role} onValueChange={(v) => setForm((s) => ({ ...s, role: v }))}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="org_admin">Org Admin</SelectItem>
                <SelectItem value="manager">Manager</SelectItem>
                <SelectItem value="supervisor">Supervisor</SelectItem>
                <SelectItem value="sales_rep">Sales Rep</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <Button type="submit" disabled={loading}>
            <Send className="mr-2 h-4 w-4" aria-hidden />
            Send Invite
          </Button>
        </form>

        <div className="flex flex-wrap items-center gap-3">
          <Button variant="outline" size="sm" onClick={refresh} disabled={loading}>
            <RefreshCcw className="mr-2 h-4 w-4" aria-hidden />
            Refresh
          </Button>
          {success && <Badge variant="outline">{success}</Badge>}
          {error && <Badge variant="destructive">{error}</Badge>}
        </div>

        <div className="overflow-x-auto">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Email</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Expires</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {invites.map((invite) => (
                <TableRow key={invite.id}>
                  <TableCell className="font-medium">{invite.email}</TableCell>
                  <TableCell className="capitalize">{invite.role.replace("_", " ")}</TableCell>
                  <TableCell>{invite.status}</TableCell>
                  <TableCell>{invite.expires_at?.substring(0, 10)}</TableCell>
                  <TableCell className="flex flex-wrap justify-end gap-2">
                    <Button variant="ghost" size="sm" onClick={() => act(invite.id, "resend")} disabled={loading}>
                      <Send className="mr-1 h-3 w-3" aria-hidden />
                      Resend
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => act(invite.id, "extend")} disabled={loading}>
                      <TimerReset className="mr-1 h-3 w-3" aria-hidden />
                      Extend
                    </Button>
                    <Button variant="ghost" size="sm" onClick={() => requestRevoke(invite.id)} disabled={loading}>
                      <ShieldX className="mr-1 h-3 w-3" aria-hidden />
                      Revoke
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
              {invites.length === 0 && (
                <TableRow>
                  <TableCell colSpan={5} className="text-center text-sm text-muted-foreground">
                    No invites yet.
                  </TableCell>
                </TableRow>
              )}
            </TableBody>
          </Table>
        </div>
      </CardContent>

      <AlertDialog open={!!confirmInviteId} onOpenChange={(open) => !open && setConfirmInviteId(null)}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Revoke invite?</AlertDialogTitle>
            <AlertDialogDescription>
              Revoking will prevent this invite from being used to access the org. You can reissue a new invite at any time.
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel onClick={() => setConfirmInviteId(null)}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={async () => {
                if (confirmInviteId) {
                  await act(confirmInviteId, "revoke");
                  setConfirmInviteId(null);
                }
              }}
            >
              Confirm revoke
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </Card>
  );
}
