import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";

import { supabaseAdmin } from "@/server/supabase";
import { fetchSeatState, willExceedSeatLimit, type OrgRole } from "@/server/org/seatLimits";

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

const acceptSchema = z.object({
  token: z.string().min(8),
});

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user || !user.email) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const body = await request.json().catch(() => ({}));
    const parsed = acceptSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }
    const token = parsed.data.token;

    // Load invite
    const nowIso = new Date().toISOString();
    const { data: invite, error: invErr } = await supabaseAdmin
      .from("invites")
      .select("id, org_id, email, role, status, expires_at")
      .eq("token", token)
      .eq("status", "pending")
      .gt("expires_at", nowIso)
      .maybeSingle();
    if (invErr) return NextResponse.json({ error: invErr.message }, { status: 500 });
    if (!invite) return NextResponse.json({ error: "Invite not found or expired" }, { status: 404 });

    const inviteEmail = String(invite.email || "").toLowerCase();
    if (inviteEmail !== user.email.toLowerCase()) {
      return NextResponse.json({ error: "Invite email does not match signed-in user" }, { status: 403 });
    }

    // Seat check
    const { limits, usage } = await fetchSeatState(invite.org_id);
    const cap = willExceedSeatLimit({ role: invite.role as OrgRole, limits, usage });
    if (!cap.allowed) return NextResponse.json({ error: cap.reason || "Seat limit reached" }, { status: 409 });

    // Ensure org is active and license not expired
    const orgOk = await ensureOrgActive(invite.org_id);
    if (!orgOk.allowed) return NextResponse.json({ error: orgOk.reason || "Organization inactive" }, { status: orgOk.status });

    // Add member if missing
    const { data: existing, error: memErr } = await supabaseAdmin
      .from("organization_members")
      .select("id")
      .eq("org_id", invite.org_id)
      .eq("user_id", user.id)
      .maybeSingle();
    if (memErr) return NextResponse.json({ error: memErr.message }, { status: 500 });

    if (!existing) {
      const { error: insertErr } = await supabaseAdmin
        .from("organization_members")
        .insert({
          org_id: invite.org_id,
          user_id: user.id,
          role: invite.role,
          status: "active",
        });
      if (insertErr) return NextResponse.json({ error: insertErr.message }, { status: 500 });
    }

    const { error: updErr } = await supabaseAdmin
      .from("invites")
      .update({ status: "accepted", accepted_user_id: user.id })
      .eq("id", invite.id);
    if (updErr) return NextResponse.json({ error: updErr.message }, { status: 500 });

    return NextResponse.json({ accepted: true, orgId: invite.org_id });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

async function ensureOrgActive(orgId: string): Promise<{ allowed: boolean; reason?: string; status: number }> {
  if (!supabaseAdmin) return { allowed: false, reason: "Service role missing", status: 500 };
  const { data: org, error } = await supabaseAdmin
    .from("organizations")
    .select("status, license_expires_at")
    .eq("id", orgId)
    .maybeSingle();
  if (error) return { allowed: false, reason: error.message, status: 500 };
  if (!org) return { allowed: false, reason: "Organization not found", status: 404 };
  if (org.status !== "active") return { allowed: false, reason: "Organization suspended", status: 403 };
  if (org.license_expires_at) {
    const now = Date.now();
    const expires = new Date(org.license_expires_at).getTime();
    if (Number.isFinite(expires) && expires < now) {
      return { allowed: false, reason: "License expired", status: 403 };
    }
  }
  return { allowed: true, status: 200 };
}
