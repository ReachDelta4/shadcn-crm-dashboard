import { NextRequest, NextResponse } from "next/server";
import { requireGod } from "@/server/auth/requireGod";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { listPlans, createPlan, updatePlan } from "@/server/god/plans.js";
// eslint-disable-next-line @typescript-eslint/ban-ts-comment
// @ts-ignore allow JS interop
import { GodOrgError } from "@/server/god/errors.js";

export async function GET() {
  try {
    await requireGod();
    const plans = await listPlans();
    return NextResponse.json({ plans });
  } catch (error) {
    return toError(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireGod();
    const body = await request.json().catch(() => ({}));
    const data = await createPlan(body);
    return NextResponse.json({ id: data?.id }, { status: 201 });
  } catch (error) {
    return toError(error);
  }
}

export async function PATCH(request: NextRequest) {
  try {
    await requireGod();
    const body = await request.json().catch(() => ({}));
    const { id, ...rest } = body || {};
    if (!id || typeof id !== "string") {
      return NextResponse.json({ error: "Plan id is required" }, { status: 400 });
    }
    await updatePlan(id, rest);
    return NextResponse.json({ updated: true });
  } catch (error) {
    return toError(error);
  }
}

function toError(error: unknown) {
  if (error instanceof GodOrgError) {
    return NextResponse.json({ error: error.message }, { status: error.status || 400 });
  }
  return NextResponse.json({ error: (error as Error).message }, { status: 500 });
}
export const runtime = "nodejs";
