import { NextRequest, NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";
import { z } from "zod";
import crypto from "crypto";

import { fetchOrgScope, ensureLicenseActive } from "@/server/org/context";
import { supabaseAdmin } from "@/server/supabase";
import { fetchSeatState, willExceedSeatLimit, type OrgRole } from "@/server/org/seatLimits";
import { assertOrgAdmin } from "@/server/guards/rbac";

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

const inviteSchema = z.object({
  email: z.string().email(),
  role: z.enum(["org_admin", "manager", "supervisor", "sales_rep"]),
  expiresInDays: z.number().int().min(1).max(90).optional().default(14),
});

export async function GET() {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const scope = await fetchOrgScope(supabase as any, user.id);
    ensureLicenseActive(scope);
    try {
      assertOrgAdmin(scope);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Forbidden" }, { status: err?.status || 403 });
    }
    if (!scope.orgId) return NextResponse.json({ error: "Organization not configured" }, { status: 400 });

    const { data, error } = await supabaseAdmin
      .from("invites")
      .select("id, email, role, status, expires_at, created_at, token")
      .eq("org_id", scope.orgId)
      .order("created_at", { ascending: false });
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    return NextResponse.json({ invites: data || [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest) {
  try {
    if (!supabaseAdmin) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    const scope = await fetchOrgScope(supabase as any, user.id);
    ensureLicenseActive(scope);
    try {
      assertOrgAdmin(scope);
    } catch (err: any) {
      return NextResponse.json({ error: err?.message || "Forbidden" }, { status: err?.status || 403 });
    }
    if (!scope.orgId) return NextResponse.json({ error: "Organization not configured" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const parsed = inviteSchema.safeParse(body);
    if (!parsed.success) {
      return NextResponse.json({ error: "Invalid payload", details: parsed.error.format() }, { status: 400 });
    }
    const payload = parsed.data;
    const email = payload.email.toLowerCase();
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + payload.expiresInDays);
    const token = crypto.randomUUID();

    // Seat check
    const { limits, usage } = await fetchSeatState(scope.orgId);
    const cap = willExceedSeatLimit({ role: payload.role as OrgRole, limits, usage });
    if (!cap.allowed) return NextResponse.json({ error: cap.reason || "Seat limit reached" }, { status: 409 });

    // 1) Persist invite in org-scoped table
    const { data, error } = await supabaseAdmin
      .from("invites")
      .insert({
        org_id: scope.orgId,
        email,
        role: payload.role,
        status: "pending",
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, token")
      .single();
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // 2) Ask Supabase Auth to send the email invite with a magic link
    try {
      const origin = request.headers.get("origin") || process.env.SALESY_CRM_URL || undefined;
      if (!origin) {
        console.error("[org/invites] Missing origin/SALESY_CRM_URL for redirect");
      } else {
        const base = origin.replace(/\/+$/, "");
        const redirectTo = `${base}/org/invite/${token}`;
        // Use service-role client so we can send project-managed invite emails
        await (supabaseAdmin as any).auth.admin.inviteUserByEmail(email, { redirectTo });
      }
    } catch (e) {
      console.error("[org/invites] Supabase inviteUserByEmail failed", e);
      return NextResponse.json({ error: "Failed to send invite email" }, { status: 502 });
    }

    return NextResponse.json({ id: data?.id, token: data?.token }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
