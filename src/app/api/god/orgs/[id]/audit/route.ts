import { NextRequest, NextResponse } from "next/server";
import { requireGod } from "@/server/auth/requireGod";
import { supabaseAdmin } from "@/server/supabase";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { listOrgAudit } from "@/server/god/audit.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { GodOrgError } from "@/server/god/errors.js";

export async function GET(_req: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireGod();
    const { id: orgId } = await params;
    const entries = await listOrgAudit(orgId, { supabaseAdmin });
    return NextResponse.json({ entries });
  } catch (error) {
    if (error instanceof GodOrgError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
export const runtime = "nodejs";
