import { NextResponse } from "next/server";
import { getUserAndScope } from "@/server/auth/getUserAndScope";

export async function GET() {
  try {
    const scope = await getUserAndScope();
    const isGod = scope.role === "god";
    // Always return 200 for authenticated users; signal role via isGod flag
    return NextResponse.json({ isGod }, { status: 200 });
  } catch {
    // Keep authentication failures explicit
    return NextResponse.json({ isGod: false }, { status: 401 });
  }
}
