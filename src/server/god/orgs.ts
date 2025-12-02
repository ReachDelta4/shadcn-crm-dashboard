import { supabaseAdmin } from "@/server/supabase";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { validateAdminMinimum, validateSeatLimitsChange } from "./validators.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { GodOrgError } from "./errors.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { computeOrgHealth } from "./health.js";

export type GodOrgSummary = {
  id: string;
  name: string;
  slug: string | null;
  status: string;
  orgType: string;
  planName: string | null;
  planId?: string | null;
  licenseExpiresAt: string | null;
  seatLimits: {
    admins: number;
    managers: number;
    supervisors: number;
    users: number;
  };
  seatUsage: {
    admins: number;
    managers: number;
    supervisors: number;
    users: number;
  };
  health?: {
    licenseExpired: boolean;
    licenseExpiringSoon: boolean;
    seatOverage: boolean;
    suspended: boolean;
  };
};

function assertAdminClient() {
  if (!supabaseAdmin) {
    throw new GodOrgError("Service role client not configured", 500);
  }
  return supabaseAdmin;
}

export async function listGodOrgs(): Promise<GodOrgSummary[]> {
  const client = assertAdminClient();

  const { data: orgs, error } = await client
    .from("organizations")
    .select(
      "id,name,slug,status,org_type,license_expires_at,seat_limit_admins,seat_limit_managers,seat_limit_supervisors,seat_limit_users,plan_id,plans(id,name)"
    )
    .order("created_at", { ascending: false });

  if (error) {
    throw new GodOrgError(`Failed to list organizations: ${error.message}`, 500);
  }

  const orgIds = (orgs || []).map((o) => o.id);
  const usage: Record<
    string,
    { admins: number; managers: number; supervisors: number; users: number }
  > = {};
  orgIds.forEach((id) => {
    usage[id] = { admins: 0, managers: 0, supervisors: 0, users: 0 };
  });

  if (orgIds.length > 0) {
    const { data: members, error: memErr } = await client
      .from("organization_members")
      .select("org_id, role, status")
      .in("org_id", orgIds);
    if (memErr) {
      throw new GodOrgError(`Failed to read members: ${memErr.message}`, 500);
    }
    (members || [])
      .filter((m) => m.status === "active")
      .forEach((m) => {
        const bucket = usage[m.org_id] || (usage[m.org_id] = { admins: 0, managers: 0, supervisors: 0, users: 0 });
        switch (m.role) {
          case "org_admin":
            bucket.admins += 1;
            break;
          case "manager":
            bucket.managers += 1;
            break;
          case "supervisor":
            bucket.supervisors += 1;
            break;
          default:
            bucket.users += 1;
            break;
        }
      });
  }

  return (orgs || []).map((org: any) => ({
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    orgType: org.org_type,
    planName: org.plans?.name || null,
    planId: org.plan_id || null,
    licenseExpiresAt: org.license_expires_at,
    seatLimits: {
      admins: org.seat_limit_admins,
      managers: org.seat_limit_managers,
      supervisors: org.seat_limit_supervisors,
      users: org.seat_limit_users,
    },
    seatUsage: usage[org.id] || { admins: 0, managers: 0, supervisors: 0, users: 0 },
    health: computeOrgHealth({
      status: org.status,
      licenseExpiresAt: org.license_expires_at,
      seatUsage: usage[org.id] || {},
      seatLimits: {
        admins: org.seat_limit_admins,
        managers: org.seat_limit_managers,
        supervisors: org.seat_limit_supervisors,
        users: org.seat_limit_users,
      },
    }),
  }));
}

export async function getGodOrg(orgId: string): Promise<GodOrgSummary> {
  const client = assertAdminClient();
  const { data: org, error } = await client
    .from("organizations")
    .select(
      "id,name,slug,status,org_type,license_expires_at,seat_limit_admins,seat_limit_managers,seat_limit_supervisors,seat_limit_users,plan_id,plans(id,name)"
    )
    .eq("id", orgId)
    .maybeSingle();
  if (error) {
    throw new GodOrgError(`Failed to fetch organization: ${error.message}`, 500);
  }
  if (!org) throw new GodOrgError("Organization not found", 404);

  const usage: GodOrgSummary["seatUsage"] = { admins: 0, managers: 0, supervisors: 0, users: 0 };
  const { data: members, error: memErr } = await client
    .from("organization_members")
    .select("role, status")
    .eq("org_id", orgId);
  if (memErr) {
    throw new GodOrgError(`Failed to read members: ${memErr.message}`, 500);
  }
  (members || [])
    .filter((m) => m.status === "active")
    .forEach((m) => {
      switch (m.role) {
        case "org_admin":
          usage.admins += 1;
          break;
        case "manager":
          usage.managers += 1;
          break;
        case "supervisor":
          usage.supervisors += 1;
          break;
        default:
          usage.users += 1;
          break;
      }
    });

  return {
    id: org.id,
    name: org.name,
    slug: org.slug,
    status: org.status,
    orgType: org.org_type,
    planName: (org as any).plans?.name || null,
    planId: (org as any).plan_id || null,
    licenseExpiresAt: org.license_expires_at,
    seatLimits: {
      admins: org.seat_limit_admins,
      managers: org.seat_limit_managers,
      supervisors: org.seat_limit_supervisors,
      users: org.seat_limit_users,
    },
    seatUsage: usage,
    health: computeOrgHealth({
      status: org.status,
      licenseExpiresAt: org.license_expires_at,
      seatUsage: usage,
      seatLimits: {
        admins: org.seat_limit_admins,
        managers: org.seat_limit_managers,
        supervisors: org.seat_limit_supervisors,
        users: org.seat_limit_users,
      },
    }),
  };
}

type CreateOrgInput = {
  name: string;
  slug?: string;
  planId?: string | null;
  planName?: string | null;
  orgType?: string;
  status?: string;
  licenseEnd?: string | null;
  seatLimits: {
    admins: number;
    managers: number;
    supervisors: number;
    users: number;
  };
  adminUserId?: string | null;
  adminEmail?: string | null;
  adminPassword?: string | null;
};

async function resolvePlanId({
  planId,
  planName,
}: {
  planId?: string | null;
  planName?: string | null;
}): Promise<string | null> {
  if (planId) return planId;
  if (!planName) return null;
  const client = assertAdminClient();
  const { data: existing, error } = await client
    .from("plans")
    .select("id")
    .eq("name", planName)
    .maybeSingle();
  if (error) {
    throw new GodOrgError(`Failed to read plan: ${error.message}`, 500);
  }
  if (existing?.id) return existing.id;
  const { data, error: insErr } = await client
    .from("plans")
    .insert({ name: planName, status: "active" })
    .select("id")
    .single();
  if (insErr) {
    throw new GodOrgError(`Failed to create plan: ${insErr.message}`, 500);
  }
  return data.id;
}

export async function createGodOrg(input: CreateOrgInput) {
  const client = assertAdminClient();
  const admins = Number(input.seatLimits.admins ?? 0);
  if (!Number.isFinite(admins) || admins < 1) {
    throw new GodOrgError("Admin seat limit must be at least 1");
  }

  const plan_id = await resolvePlanId({ planId: input.planId, planName: input.planName });

  const { data: org, error } = await client
    .from("organizations")
    .insert({
      name: input.name,
      slug: input.slug || null,
      status: input.status || "active",
      org_type: input.orgType || "enterprise",
      license_expires_at: input.licenseEnd || null,
      plan_id,
      seat_limit_admins: admins,
      seat_limit_managers: input.seatLimits.managers ?? 0,
      seat_limit_supervisors: input.seatLimits.supervisors ?? 0,
      seat_limit_users: input.seatLimits.users ?? 0,
    })
    .select("id")
    .single();

  if (error) {
    throw new GodOrgError(`Failed to create organization: ${error.message}`, 400);
  }

  const orgId = org.id as string;

  const adminUserId = await ensureAdminUser({
    adminUserId: input.adminUserId,
    adminEmail: input.adminEmail,
    adminPassword: input.adminPassword,
  });

  if (adminUserId) {
    const { error: memErr } = await client
      .from("organization_members")
      .insert({
        org_id: orgId,
        user_id: adminUserId,
        role: "org_admin",
        status: "active",
      });
    if (memErr) {
      throw new GodOrgError(`Failed to add admin member: ${memErr.message}`, 400);
    }
  }

  return { orgId };
}

export async function updateGodOrg(orgId: string, updates: {
  name?: string;
  slug?: string | null;
  status?: string;
  orgType?: string;
  planId?: string | null;
  licenseEnd?: string | null;
  seatLimits?: {
    admins: number;
    managers: number;
    supervisors: number;
    users: number;
  };
}) {
  const client = assertAdminClient();

  const { data: existing, error: loadErr } = await client
    .from("organizations")
    .select(
      "id,name,slug,status,org_type,license_expires_at,seat_limit_admins,seat_limit_managers,seat_limit_supervisors,seat_limit_users"
    )
    .eq("id", orgId)
    .maybeSingle();
  if (loadErr) throw new GodOrgError(`Failed to fetch organization: ${loadErr.message}`, 500);
  if (!existing) throw new GodOrgError("Organization not found", 404);

  const currentUsage = await getSeatUsage(client, orgId);
  const nextLimits = updates.seatLimits || {
    admins: existing.seat_limit_admins,
    managers: existing.seat_limit_managers,
    supervisors: existing.seat_limit_supervisors,
    users: existing.seat_limit_users,
  };

  validateSeatLimitsChange(currentUsage, nextLimits);
  validateAdminMinimum(nextLimits);

  const updatePayload: Record<string, any> = {};
  if (updates.name !== undefined) updatePayload.name = updates.name;
  if (updates.slug !== undefined) updatePayload.slug = updates.slug;
  if (updates.status !== undefined) updatePayload.status = updates.status;
  if (updates.orgType !== undefined) updatePayload.org_type = updates.orgType;
  if (updates.planId !== undefined) updatePayload.plan_id = updates.planId;
  if (updates.licenseEnd !== undefined) updatePayload.license_expires_at = updates.licenseEnd;

  updatePayload.seat_limit_admins = nextLimits.admins;
  updatePayload.seat_limit_managers = nextLimits.managers;
  updatePayload.seat_limit_supervisors = nextLimits.supervisors;
  updatePayload.seat_limit_users = nextLimits.users;

  const { error: updErr } = await client
    .from("organizations")
    .update(updatePayload)
    .eq("id", orgId);
  if (updErr) throw new GodOrgError(`Failed to update organization: ${updErr.message}`, 400);

  await client.from("organization_audit_log").insert({
    org_id: orgId,
    actor_user_id: null,
    action: "god_update_org",
    target_type: "organization",
    target_id: orgId,
    meta: updatePayload,
  });

  return getGodOrg(orgId);
}

async function getSeatUsage(client: ReturnType<typeof assertAdminClient>, orgId: string): Promise<GodOrgSummary["seatUsage"]> {
  const usage: GodOrgSummary["seatUsage"] = { admins: 0, managers: 0, supervisors: 0, users: 0 };
  const { data: members, error } = await client
    .from("organization_members")
    .select("role, status")
    .eq("org_id", orgId);
  if (error) throw new GodOrgError(`Failed to load member usage: ${error.message}`, 500);
  (members || [])
    .filter((m) => m.status === "active")
    .forEach((m) => {
      switch (m.role) {
        case "org_admin":
          usage.admins += 1;
          break;
        case "manager":
          usage.managers += 1;
          break;
        case "supervisor":
          usage.supervisors += 1;
          break;
        default:
          usage.users += 1;
          break;
      }
    });
  return usage;
}

export { GodOrgError } from "./errors.js";
async function ensureAdminUser({
  adminUserId,
  adminEmail,
  adminPassword,
}: {
  adminUserId?: string | null;
  adminEmail?: string | null;
  adminPassword?: string | null;
}): Promise<string | null> {
  if (adminUserId) return adminUserId;
  if (!adminEmail || !adminPassword) {
    throw new GodOrgError("Admin email and password are required to create the first admin");
  }
  const client = assertAdminClient();
  const { data, error } = await client.auth.admin.createUser({
    email: adminEmail,
    password: adminPassword,
    email_confirm: true,
  });
  if (error) {
    throw new GodOrgError(`Failed to create admin user: ${error.message}`, 400);
  }
  return data.user?.id || null;
}
