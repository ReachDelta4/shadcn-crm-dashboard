import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";
import { fetchOrgScope } from "@/server/org/context";
import { supabaseAdmin } from "@/server/supabase";

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

export async function GET() {
  try {
    const supabase = await getServerClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: "Unauthorized" }, { status: 401 });

    let orgId: string | null = null;
    let orgRole: string | null = null;
    let orgName: string | null = null;

    try {
      const scope = await fetchOrgScope(supabase as any, user.id);
      orgId = scope.orgId;
      orgRole = scope.role;

      if (scope.orgId && supabaseAdmin) {
        const { data: org, error } = await supabaseAdmin
          .from("organizations")
          .select("name")
          .eq("id", scope.orgId)
          .maybeSingle();
        if (!error && org) {
          orgName = (org as any).name ?? null;
        }
      }
    } catch (error: any) {
      // For legacy environments (no RPC, no admin client), fail open with null org fields
      const message = String(error?.message || "");
      if (!/get_user_memberships/i.test(message) && !/does not exist/i.test(message)) {
        // Unexpected errors should still be surfaced to logs on the server, but not break the sidebar
        console.error("[org/me] scope resolution error", error);
      }
    }

    return NextResponse.json({ orgId, orgName, orgRole });
  } catch (error) {
    console.error("[org/me] unexpected error", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}

export const runtime = "nodejs";

