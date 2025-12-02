import { NextResponse } from "next/server";
import { getUserAndScope } from "@/server/auth/getUserAndScope";

export async function GET() {
  try {
    const scope = await getUserAndScope();
    const isGod = scope.role === "god";
    return NextResponse.json({ isGod }, { status: isGod ? 200 : 403 });
  } catch {
    return NextResponse.json({ isGod: false }, { status: 401 });
  }
}

