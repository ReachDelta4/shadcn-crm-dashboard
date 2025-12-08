import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";

type SidebarUser = {
  name: string;
  email: string;
  avatar: string;
  orgName?: string | null;
  orgRole?: string | null;
};

export function useUser() {
  const supabase = createClient();

  return useQuery<SidebarUser | null>({
    queryKey: ["user-session"],
    queryFn: async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) return null;

      const base: SidebarUser = {
        name: user.user_metadata?.full_name || user.email?.split("@")[0] || "User",
        email: user.email || "",
        avatar: user.user_metadata?.avatar_url || "/avatars/avatar.webp",
      };

      try {
        const res = await fetch("/api/org/me", { method: "GET", cache: "no-store" });
        if (res.ok) {
          const data = await res.json().catch(() => ({}));
          base.orgName = data?.orgName ?? null;
          base.orgRole = data?.orgRole ?? null;
        }
      } catch {
        // If org info fails to load, silently fall back to base identity
      }

      return base;
    },
    // Keep fresh per session change; refetch on mount to avoid stale identity when switching accounts
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
