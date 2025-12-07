import { NextResponse } from "next/server";
import { cookies } from "next/headers";
import { createServerClient } from "@supabase/ssr";

import { fetchOrgScope, ensureLicenseActive } from "@/server/org/context";
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
          cookiesToSet.forEach(({ name, value, options }) =>
            cookieStore.set(name, value, options)
          );
        },
      },
    }
  );
}

export async function GET() {
  try {
    if (!supabaseAdmin) {
      return NextResponse.json(
        { error: "Service role not configured" },
        { status: 500 }
      );
    }

    const supabase = await getServerClient();
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }

    const scope = await fetchOrgScope(supabase as any, user.id);
    ensureLicenseActive(scope);

    if (!scope.orgId) {
      return NextResponse.json(
        { error: "Organization not configured" },
        { status: 400 }
      );
    }

    const { data: members, error: membersError } = await supabaseAdmin
      .from("organization_members")
      .select("user_id, role, status")
      .eq("org_id", scope.orgId);

    if (membersError) {
      return NextResponse.json(
        { error: membersError.message },
        { status: 500 }
      );
    }

    const rows = members || [];
    if (!rows.length) {
      return NextResponse.json({ members: [] });
    }

    const userIds = Array.from(
      new Set(rows.map((m: any) => String(m.user_id)))
    );

    const { data: profiles, error: profilesError } = await supabaseAdmin
      .from("profiles")
      .select("id, email, full_name, avatar_url")
      .in("id", userIds);

    if (profilesError) {
      return NextResponse.json(
        { error: profilesError.message },
        { status: 500 }
      );
    }

    const profileById = new Map(
      (profiles || []).map((p: any) => [String(p.id), p])
    );

    const result = rows.map((m: any) => {
      const pid = String(m.user_id);
      const profile = profileById.get(pid);
      const email = profile?.email || "";
      const fallbackName =
        profile?.full_name ||
        (email ? email.split("@")[0] : "User");

      return {
        userId: pid,
        email,
        name: fallbackName,
        avatarUrl: profile?.avatar_url || null,
        role: m.role,
        status: m.status,
      };
    });

    return NextResponse.json({ members: result });
  } catch (error) {
    return NextResponse.json(
      { error: (error as Error).message },
      { status: 500 }
    );
  }
}

export const runtime = "nodejs";

