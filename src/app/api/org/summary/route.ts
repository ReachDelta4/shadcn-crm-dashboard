import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { fetchOrgScope, ensureLicenseActive, ensureOrgAdmin } from "@/server/org/context";
import { supabaseAdmin } from "@/server/supabase";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { summarizeOrgProfile } from "@/server/org/summary.js";

async function getServerClient() {
  const cookieStore = await cookies();
  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return cookieStore.getAll();
        },
        setAll(cookiesToSet) {
          cookiesToSet.forEach(({ name, value, options }) => cookieStore.set(name, value, options));
        },
      },
    }
  );
}

export async function GET() {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const scope = await fetchOrgScope(supabase as any, user.id);
    ensureLicenseActive(scope);
    ensureOrgAdmin(scope);
    if (!scope.orgId) return NextResponse.json({ error: "Organization not configured" }, { status: 400 });

    const { data: org, error: orgErr } = await supabaseAdmin
      .from("organizations")
      .select("id,name,plan_id,plans(name),status,license_expires_at,seat_limit_admins,seat_limit_managers,seat_limit_supervisors,seat_limit_users")
      .eq("id", scope.orgId)
      .maybeSingle();
    if (orgErr) throw orgErr;
    if (!org) return NextResponse.json({ error: "Organization not found" }, { status: 404 });

    const { data: members, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("role,status")
      .eq("org_id", scope.orgId);
    if (memErr) throw memErr;
    const usage = { admins: 0, managers: 0, supervisors: 0, users: 0 };
    (members || []).filter((m) => m.status === "active").forEach((m) => {
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

    const { count: pendingInvites } = await supabaseAdmin
      .from("invites")
      .select("id", { count: "exact", head: true })
      .eq("org_id", scope.orgId)
      .eq("status", "pending");

    const summary = summarizeOrgProfile({
      org,
      usage,
      pendingInvites: pendingInvites || 0,
      now: new Date(),
    });

    return NextResponse.json({ summary });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
export const runtime = "nodejs";
