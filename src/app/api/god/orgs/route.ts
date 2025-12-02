import { NextRequest, NextResponse } from "next/server";
import { requireGod } from "@/server/auth/requireGod";
import { createGodOrg, listGodOrgs } from "@/server/god/orgs";
import { GodOrgError } from "@/server/god/errors";

export async function GET() {
  try {
    await requireGod();
    const data = await listGodOrgs();
    return NextResponse.json({ orgs: data });
  } catch (error) {
    return toErrorResponse(error);
  }
}

export async function POST(request: NextRequest) {
  try {
    await requireGod();
    const body = await request.json();
    const {
      name,
      slug,
      planId,
      planName,
      orgType,
      status,
      licenseEnd,
      seatLimits,
      adminUserId,
      adminEmail,
      adminPassword,
    } = body || {};

    if (!name || typeof name !== "string") {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const limits = {
      admins: Number(seatLimits?.admins ?? 1),
      managers: Number(seatLimits?.managers ?? 0),
      supervisors: Number(seatLimits?.supervisors ?? 0),
      users: Number(seatLimits?.users ?? 0),
    };

    const { orgId } = await createGodOrg({
      name,
      slug,
      planId: planId ?? null,
      planName: planName ?? null,
      orgType: orgType ?? "enterprise",
      status: status ?? "active",
      licenseEnd: licenseEnd ?? null,
      seatLimits: limits,
      adminUserId: adminUserId ?? null,
      adminEmail: adminEmail ?? null,
      adminPassword: adminPassword ?? null,
    });

    return NextResponse.json({ orgId }, { status: 201 });
  } catch (error) {
    return toErrorResponse(error);
  }
}

function toErrorResponse(error: unknown) {
  if (error instanceof GodOrgError) {
    return NextResponse.json({ error: error.message }, { status: error.status || 400 });
  }
  if (error instanceof Error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }
  return NextResponse.json({ error: "Unexpected error" }, { status: 500 });
}
