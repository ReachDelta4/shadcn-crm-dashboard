"use client";

import { useEffect, useState } from "react";
import { Loader2 } from "lucide-react";

import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Avatar, AvatarFallback } from "@/components/ui/avatar";

type OrgRosterMember = {
  userId: string;
  email: string;
  name: string;
  avatarUrl: string | null;
  role: string;
  status: string;
};

export default function TeamDirectoryPage() {
  const [members, setMembers] = useState<OrgRosterMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;

    async function loadRoster() {
      setLoading(true);
      setError(null);
      try {
        const res = await fetch("/api/org/roster", { cache: "no-store" });
        const json = await res.json().catch(() => ({}));
        if (!res.ok) {
          if (!cancelled) {
            setError(json?.error || "Failed to load team directory");
          }
          return;
        }
        if (!cancelled) {
          setMembers(json.members || []);
        }
      } catch (err: any) {
        if (!cancelled) {
          setError(err?.message || "Failed to load team directory");
        }
      } finally {
        if (!cancelled) {
          setLoading(false);
        }
      }
    }

    loadRoster();

    return () => {
      cancelled = true;
    };
  }, []);

  return (
    <div className="space-y-4">
      <div>
        <h1 className="text-2xl font-bold tracking-tight">Team Directory</h1>
        <p className="text-sm text-muted-foreground">
          View all members of your organization, including their roles and
          statuses.
        </p>
      </div>

      {error && (
        <div className="rounded-md border border-destructive/50 bg-destructive/10 px-4 py-3 text-sm text-destructive">
          {error}
        </div>
      )}

      <div className="rounded-lg border bg-card">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[220px]">Member</TableHead>
              <TableHead>Role</TableHead>
              <TableHead>Status</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {loading ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  <Loader2 className="mr-2 inline h-4 w-4 animate-spin" />
                  Loading team directory...
                </TableCell>
              </TableRow>
            ) : members.length === 0 ? (
              <TableRow>
                <TableCell
                  colSpan={3}
                  className="py-6 text-center text-sm text-muted-foreground"
                >
                  No members found for this organization.
                </TableCell>
              </TableRow>
            ) : (
              members.map((member) => (
                <TableRow key={member.userId}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="h-8 w-8 rounded-lg">
                        {member.avatarUrl ? null : (
                          <AvatarFallback className="rounded-lg">
                            {member.name
                              .split(" ")
                              .map((n) => n[0])
                              .join("")
                              .substring(0, 2)
                              .toUpperCase()}
                          </AvatarFallback>
                        )}
                      </Avatar>
                      <div className="flex flex-col">
                        <span className="text-sm font-medium leading-tight">
                          {member.name}
                        </span>
                        <span className="text-xs text-muted-foreground">
                          {member.email}
                        </span>
                      </div>
                    </div>
                  </TableCell>
                  <TableCell className="capitalize">
                    {formatOrgRole(member.role)}
                  </TableCell>
                  <TableCell className="capitalize text-xs text-muted-foreground">
                    {member.status}
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>
    </div>
  );
}

function formatOrgRole(role: string): string {
  switch (role) {
    case "org_admin":
      return "Org Admin";
    case "sales_rep":
      return "Sales Rep";
    case "supervisor":
      return "Supervisor";
    case "manager":
      return "Manager";
    case "director":
      return "Director";
    default:
      return role;
  }
}

