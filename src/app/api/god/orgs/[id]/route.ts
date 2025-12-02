import { NextRequest, NextResponse } from "next/server";
import { requireGod } from "@/server/auth/requireGod";
import { updateGodOrg } from "@/server/god/orgs";
import { GodOrgError } from "@/server/god/errors";

export async function PATCH(request: NextRequest, { params }: { params: Promise<{ id: string }> }) {
  try {
    await requireGod();
    const { id } = await params;
    if (!id) return NextResponse.json({ error: "Organization id is required" }, { status: 400 });

    const body = await request.json().catch(() => ({}));
    const {
      name,
      slug,
      status,
      orgType,
      planId,
      licenseEnd,
      seatLimits,
    } = body || {};

    const normalizedSeatLimits = seatLimits
      ? {
          admins: Number(seatLimits.admins),
          managers: Number(seatLimits.managers),
          supervisors: Number(seatLimits.supervisors),
          users: Number(seatLimits.users),
        }
      : undefined;

    if (normalizedSeatLimits) {
      const values = Object.values(normalizedSeatLimits);
      if (values.some((v) => !Number.isFinite(v))) {
        return NextResponse.json({ error: "Seat limits must be numbers" }, { status: 400 });
      }
    }

    const org = await updateGodOrg(id, {
      name,
      slug,
      status,
      orgType,
      planId,
      licenseEnd,
      seatLimits: normalizedSeatLimits,
    });

    return NextResponse.json({ org }, { status: 200 });
  } catch (error) {
    if (error instanceof GodOrgError) {
      return NextResponse.json({ error: error.message }, { status: error.status || 400 });
    }
    return NextResponse.json({ error: (error as Error).message }, { status: 500 });
  }
}
