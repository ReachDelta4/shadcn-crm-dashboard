import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { requireGod } from "@/server/auth/requireGod";
import { supabaseAdmin } from "@/server/supabase";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { fetchSeatState, willExceedSeatLimit } from "@/server/org/seatLimits";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { validateInviteAction } from "@/server/god/invites.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { GodOrgError } from "@/server/god/errors.js";

export const runtime = "nodejs";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireGod();
    const { id: orgId } = await params;
    if (!supabaseAdmin) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
    const { data, error } = await supabaseAdmin
      .from("invites")
      .select("id, email, role, status, token, expires_at, created_at, accepted_user_id")
      .eq("org_id", orgId)
      .order("created_at", { ascending: false });
    if (error) throw error;
    return NextResponse.json({ invites: data || [] });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function POST(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireGod();
    const { id: orgId } = await params;
    if (!supabaseAdmin) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
    const body = await request.json().catch(() => ({}));
    const email = String(body.email || "").toLowerCase().trim();
    const role = body.role;
    const expiresInDays = Number(body.expiresInDays || 14);
    if (!email || !role) return NextResponse.json({ error: "Email and role are required" }, { status: 400 });
    const expiresAt = new Date();
    expiresAt.setDate(expiresAt.getDate() + (Number.isFinite(expiresInDays) ? expiresInDays : 14));

    // Seat check
    const { limits, usage } = await fetchSeatState(orgId);
    const cap = willExceedSeatLimit({ role, limits, usage });
    if (!cap.allowed) return NextResponse.json({ error: cap.reason || "Seat limit reached" }, { status: 409 });

    const token = crypto.randomUUID();
    const { data, error } = await supabaseAdmin
      .from("invites")
      .insert({
        org_id: orgId,
        email,
        role,
        status: "pending",
        token,
        expires_at: expiresAt.toISOString(),
      })
      .select("id, token")
      .single();
    if (error) throw error;
    return NextResponse.json({ id: data?.id, token: data?.token }, { status: 201 });
  } catch (error) {
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireGod();
    const { id: orgId } = await params;
    if (!supabaseAdmin) return NextResponse.json({ error: "Service role not configured" }, { status: 500 });
    const body = await request.json().catch(() => ({}));
    const action = validateInviteAction(body);

    if (action.action === "revoke") {
      const { error } = await supabaseAdmin
        .from("invites")
        .update({ status: "revoked" })
        .eq("id", action.inviteId)
        .eq("org_id", orgId);
      if (error) throw error;
      await supabaseAdmin.from("organization_audit_log").insert({
        org_id: orgId,
        action: "invite_revoke",
        target_type: "invite",
        target_id: action.inviteId,
      });
      return NextResponse.json({ revoked: true });
    }

    if (action.action === "extend") {
    const { data: invite, error: invErr } = await supabaseAdmin
      .from("invites")
      .select("id, status, expires_at")
      .eq("id", action.inviteId)
      .eq("org_id", orgId)
      .maybeSingle();
      if (invErr) throw invErr;
      if (!invite) throw new GodOrgError("Invite not found", 404);
      if (invite.status !== "pending") throw new GodOrgError("Only pending invites can be extended", 400);
      const newExpires = new Date();
      const extendDays = typeof action.expiresInDays === 'number' ? action.expiresInDays : 14;
      newExpires.setDate(newExpires.getDate() + extendDays);
      const { error: updErr } = await supabaseAdmin
        .from("invites")
        .update({ expires_at: newExpires.toISOString() })
        .eq("id", action.inviteId);
      if (updErr) throw updErr;
      await supabaseAdmin.from("organization_audit_log").insert({
        org_id: orgId,
        action: "invite_extend",
        target_type: "invite",
        target_id: action.inviteId,
        meta: { expires_at: newExpires.toISOString() },
      });
      return NextResponse.json({ extended: true, expiresAt: newExpires.toISOString() });
    }

    if (action.action === "resend") {
      const token = crypto.randomUUID();
      const { error: updErr } = await supabaseAdmin
        .from("invites")
        .update({ token, status: "pending" })
        .eq("id", action.inviteId)
        .eq("org_id", orgId);
      if (updErr) throw updErr;
      await supabaseAdmin.from("organization_audit_log").insert({
        org_id: orgId,
        action: "invite_resend",
        target_type: "invite",
        target_id: action.inviteId,
      });
      return NextResponse.json({ token });
    }

    return NextResponse.json({ error: "Unsupported action" }, { status: 400 });
  } catch (error) {
    if (error instanceof GodOrgError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
