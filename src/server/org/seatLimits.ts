import { supabaseAdmin } from "@/server/supabase";
import { GodOrgError } from "../god/orgs";

export type SeatLimits = {
  admins: number;
  managers: number;
  supervisors: number;
  users: number;
};

export type SeatUsage = {
  admins: number;
  managers: number;
  supervisors: number;
  users: number;
};

export type OrgRole = "org_admin" | "manager" | "supervisor" | "sales_rep";

export function roleKey(role: OrgRole): keyof SeatLimits {
  switch (role) {
    case "org_admin":
      return "admins";
    case "manager":
      return "managers";
    case "supervisor":
      return "supervisors";
    default:
      return "users";
  }
}

export function willExceedSeatLimit(params: {
  role: OrgRole;
  limits: SeatLimits;
  usage: SeatUsage;
}): { allowed: boolean; reason?: string } {
  const key = roleKey(params.role);
  const limit = params.limits[key] ?? 0;
  const used = params.usage[key] ?? 0;
  if (limit <= 0) {
    return { allowed: false, reason: `Seat limit for ${key} is zero` };
  }
  if (used >= limit) {
    return { allowed: false, reason: `Seat limit reached for ${key}` };
  }
  return { allowed: true };
}

export async function fetchSeatState(orgId: string): Promise<{ limits: SeatLimits; usage: SeatUsage }> {
  if (!supabaseAdmin) {
    throw new GodOrgError("Service role client not configured", 500);
  }
  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select(
      "seat_limit_admins, seat_limit_managers, seat_limit_supervisors, seat_limit_users"
    )
    .eq("id", orgId)
    .maybeSingle();
  if (error) throw new GodOrgError(`Failed to load organization limits: ${error.message}`, 500);
  if (!org) throw new GodOrgError("Organization not found", 404);

  const limits: SeatLimits = {
    admins: org.seat_limit_admins ?? 0,
    managers: org.seat_limit_managers ?? 0,
    supervisors: org.seat_limit_supervisors ?? 0,
    users: org.seat_limit_users ?? 0,
  };

  const { data: members, error: memErr } = await supabaseAdmin
    .from("organization_members")
    .select("role, status")
    .eq("org_id", orgId);
  if (memErr) throw new GodOrgError(`Failed to load members: ${memErr.message}`, 500);

  const usage: SeatUsage = { admins: 0, managers: 0, supervisors: 0, users: 0 };
  (members || [])
    .filter((m) => m.status === "active")
    .forEach((m) => {
      const key = roleKey(m.role as OrgRole);
      usage[key] = (usage[key] || 0) + 1;
    });

  return { limits, usage };
}
