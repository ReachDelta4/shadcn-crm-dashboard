import { useQuery } from "@tanstack/react-query";
import { createClient } from "@/utils/supabase/client";
import { sidebarMenus } from "@/data/sidebar-menus";

export function useUser() {
  const supabase = createClient();

  return useQuery({
    queryKey: ["user-session"],
    queryFn: async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) return sidebarMenus.user;

      return {
        name: user.user_metadata?.full_name || user.email?.split('@')[0] || 'User',
        email: user.email || '',
        avatar: user.user_metadata?.avatar_url || '/avatars/avatar.webp',
      };
    },
    // Keep fresh per session change; refetch on mount to avoid stale identity when switching accounts
    staleTime: 0,
    gcTime: 5 * 60 * 1000,
    refetchOnMount: true,
    refetchOnWindowFocus: false,
  });
}
