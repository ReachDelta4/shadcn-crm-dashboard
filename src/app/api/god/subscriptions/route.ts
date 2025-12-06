import { NextRequest, NextResponse } from "next/server";
import { requireGod } from "@/server/auth/requireGod";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { updateSubscription } from "@/server/god/subscriptions.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { GodOrgError } from "@/server/god/errors.js";

export async function PATCH(request: NextRequest) {
  try {
    await requireGod();
    const body = await request.json().catch(() => ({}));
    const { orgId, ...rest } = body || {};
    if (!orgId || typeof orgId !== "string") {
      return NextResponse.json({ error: "orgId is required" }, { status: 400 });
    }
    await updateSubscription(orgId, rest);
    return NextResponse.json({ updated: true });
  } catch (error) {
    if (error instanceof GodOrgError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
export const runtime = "nodejs";
